import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

interface OwnerAuthFile {
  salt: string;
  hash: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'owner-auth.json');
const CONTENT_FILE = path.join(DATA_DIR, 'site-content.json');

// Owner access code (never exposed to client UI)
const INITIAL_FALLBACK_CODE = '02268689';

// Ephemeral HMAC secret per server process (or derived from persistent auth/env)
const PROCESS_TOKEN_SECRET = crypto.randomBytes(32).toString('hex');

const hashPassword = (password: string, salt: string): string => {
  return crypto.scryptSync(password, salt, 64).toString('hex');
};

const timingSafeEqualHex = (aHex: string, bHex: string): boolean => {
  const aBuf = Buffer.from(aHex, 'hex');
  const bBuf = Buffer.from(bHex, 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const timingSafeEqualText = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const readAuthFile = async (): Promise<OwnerAuthFile | null> => {
  try {
    const raw = await fs.readFile(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<OwnerAuthFile>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      return {
        salt: parsed.salt,
        hash: parsed.hash,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
};

const writeAuthFile = async (password: string): Promise<void> => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  const payload: OwnerAuthFile = {
    salt,
    hash,
    updatedAt: new Date().toISOString(),
  };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(payload, null, 2), 'utf8');
};

export const hasCustomOwnerPassword = async (): Promise<boolean> => {
  const authFile = await readAuthFile();
  if (authFile) return true;
  if (process.env.OWNER_PASSWORD && process.env.OWNER_PASSWORD.trim().length > 0) return true;
  return false;
};

export const verifyOwnerPassword = async (candidate: string): Promise<boolean> => {
  const clean = candidate.trim();
  if (!clean) return false;

  const authFile = await readAuthFile();
  if (authFile) {
    const derived = hashPassword(clean, authFile.salt);
    return timingSafeEqualHex(derived, authFile.hash);
  }

  const envPassword = process.env.OWNER_PASSWORD?.trim();
  if (envPassword) {
    return timingSafeEqualText(clean, envPassword);
  }

  return timingSafeEqualText(clean, INITIAL_FALLBACK_CODE);
};

export const changeOwnerPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  const cleanCurrent = currentPassword.trim();
  const cleanNew = newPassword.trim();

  if (!cleanNew) {
    return { success: false, error: 'New password cannot be empty.' };
  }
  if (cleanNew.length < 4) {
    return { success: false, error: 'New password must be at least 4 characters.' };
  }

  const valid = await verifyOwnerPassword(cleanCurrent);
  if (!valid) {
    return { success: false, error: 'Current password does not match.' };
  }

  await writeAuthFile(cleanNew);
  return { success: true };
};

export const migrateLegacyLocalPasscode = async (
  _legacyPasscode: string
): Promise<{ migrated: boolean }> => {
  return { migrated: false };
};

export const issueOwnerToken = (): string => {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
  const payload = String(expiresAt);
  const sig = crypto.createHmac('sha256', PROCESS_TOKEN_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
};

export const verifyOwnerToken = (token: string | undefined): boolean => {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expectedSig = crypto
    .createHmac('sha256', PROCESS_TOKEN_SECRET)
    .update(payload)
    .digest('hex');
  return timingSafeEqualHex(sig, expectedSig);
};

export const readSavedSiteContent = async (): Promise<Record<string, unknown> | null> => {
  try {
    const raw = await fs.readFile(CONTENT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

export const writeSavedSiteContent = async (content: Record<string, unknown>): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8');
};

export const clearSavedSiteContent = async (): Promise<void> => {
  try {
    await fs.unlink(CONTENT_FILE);
  } catch {
    // ignore if file does not exist
  }
};
