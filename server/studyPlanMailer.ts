import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';

export type DeliveryStatus = 'notified' | 'activation-needed' | 'delivery-unavailable';
export type DeliveryMethod = 'smtp' | 'resend' | 'formsubmit' | 'stored';

export interface StudyPlanSignupRecord {
  id: string;
  name: string;
  email: string;
  recipientEmail: string;
  subscribedAt: string;
  deliveryStatus: DeliveryStatus;
  deliveryMethod: DeliveryMethod;
  deliveryDetail?: string;
}

export interface SendStudyPlanResult {
  ok: boolean;
  status: DeliveryStatus;
  deliveryMethod: DeliveryMethod;
  message: string;
  record: StudyPlanSignupRecord;
}

const DEFAULT_NOTIFICATION_EMAIL = 'thefearofgod578@gmail.com';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SIGNUPS_FILE = path.join(DATA_DIR, 'study-plan-signups.json');

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const listStudyPlanSignups = async (): Promise<StudyPlanSignupRecord[]> => {
  try {
    const raw = await fs.readFile(SIGNUPS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudyPlanSignupRecord[]) : [];
  } catch {
    return [];
  }
};

const saveStudyPlanSignups = async (records: StudyPlanSignupRecord[]): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SIGNUPS_FILE, JSON.stringify(records, null, 2), 'utf8');
};

export const deleteStudyPlanSignup = async (id: string): Promise<boolean> => {
  const existing = await listStudyPlanSignups();
  const filtered = existing.filter((item) => item.id !== id);
  if (filtered.length === existing.length) return false;
  await saveStudyPlanSignups(filtered);
  return true;
};

export const getConfiguredMailTransport = (): 'smtp' | 'resend' | 'formsubmit' => {
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (smtpUser && smtpPass) return 'smtp';
  if (process.env.RESEND_API_KEY) return 'resend';
  return 'formsubmit';
};

export const sendStudyPlanNotificationEmail = async (params: {
  name?: string;
  email: string;
  recipientEmail?: string;
  requestOrigin?: string;
}): Promise<SendStudyPlanResult> => {
  const cleanEmail = params.email.trim();
  const cleanName = (params.name || '').trim();
  const targetEmail =
    process.env.STUDY_PLAN_NOTIFICATION_EMAIL?.trim() ||
    params.recipientEmail?.trim() ||
    DEFAULT_NOTIFICATION_EMAIL;

  const subscribedAt = new Date().toISOString();
  const formattedDate = new Date(subscribedAt).toUTCString();
  const displayName = cleanName || 'Not provided';
  const subject = `New Daily Bible Study Plan Sign-Up: ${cleanEmail}`;

  const textBody = [
    'A new visitor has signed up for the Daily Bible Study Plan on A Voice in the Last Days.',
    '',
    `Name: ${displayName}`,
    `Subscriber Email: ${cleanEmail}`,
    `Signed Up At: ${formattedDate}`,
    '',
    `Please send the study plan materials to: ${cleanEmail}`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; color: #111827;">
      <h2 style="margin: 0 0 12px; color: #78350f; font-size: 20px;">New Daily Bible Study Plan Sign-Up</h2>
      <p style="margin: 0 0 16px; color: #374151; font-size: 14px;">
        A visitor has registered their interest on <strong>A Voice in the Last Days</strong> and requested the Bible Study Plan by email.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #fffbeb; font-weight: 600; width: 140px;">Name</td>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(displayName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #fffbeb; font-weight: 600;">Email Address</td>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">
            <a href="mailto:${escapeHtml(cleanEmail)}" style="color: #92400e;">${escapeHtml(cleanEmail)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #fffbeb; font-weight: 600;">Signed Up At</td>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(formattedDate)}</td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        Reply directly to this email to reach ${escapeHtml(cleanEmail)}.
      </p>
    </div>
  `.trim();

  let status: DeliveryStatus = 'delivery-unavailable';
  let deliveryMethod: DeliveryMethod = 'stored';
  let detailMessage = 'Sign-up recorded on server.';

  // 1. Direct SMTP via Nodemailer (supports custom SMTP_* or Gmail GMAIL_USER / GMAIL_APP_PASSWORD)
  const smtpUser = process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();

  if (smtpUser && smtpPass) {
    try {
      const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
      const smtpPort = Number(process.env.SMTP_PORT || (smtpHost === 'smtp.gmail.com' ? 465 : 587));
      const smtpSecure =
        process.env.SMTP_SECURE !== undefined
          ? process.env.SMTP_SECURE === 'true'
          : smtpPort === 465;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const fromAddress =
        process.env.SMTP_FROM?.trim() || `"A Voice in the Last Days" <${smtpUser}>`;

      await transporter.sendMail({
        from: fromAddress,
        to: targetEmail,
        replyTo: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      status = 'notified';
      deliveryMethod = 'smtp';
      detailMessage = `Email notification sent to ${targetEmail} via SMTP.`;
    } catch (err) {
      detailMessage = err instanceof Error ? `SMTP error: ${err.message}` : 'SMTP send failed.';
      console.error('[StudyPlanMailer] SMTP error:', err);
    }
  }

  // 2. Resend HTTP API if configured and SMTP wasn't used or failed
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (status !== 'notified' && resendApiKey) {
    try {
      const fromAddress =
        process.env.RESEND_FROM_EMAIL?.trim() ||
        'A Voice in the Last Days <onboarding@resend.dev>';

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [targetEmail],
          reply_to: cleanEmail,
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      if (resendRes.ok) {
        status = 'notified';
        deliveryMethod = 'resend';
        detailMessage = `Email notification sent to ${targetEmail} via Resend.`;
      } else {
        const errBody = await resendRes.text().catch(() => '');
        detailMessage = `Resend API error (${resendRes.status}): ${errBody}`;
        console.error('[StudyPlanMailer] Resend error:', detailMessage);
      }
    } catch (err) {
      detailMessage = err instanceof Error ? `Resend error: ${err.message}` : 'Resend send failed.';
      console.error('[StudyPlanMailer] Resend exception:', err);
    }
  }

  // 3. FormSubmit server-side fallback when no SMTP / Resend credentials are present
  if (status !== 'notified') {
    const originHeader =
      params.requestOrigin || process.env.APP_URL?.trim() || 'http://localhost:3000';

    try {
      const fsResponse = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: originHeader,
            Referer: `${originHeader.replace(/\/$/, '')}/`,
            'User-Agent': 'AVoiceInTheLastDays-Server/1.0',
          },
          body: JSON.stringify({
            name: displayName,
            email: cleanEmail,
            _subject: subject,
            _replyto: cleanEmail,
            _template: 'table',
            message: textBody,
          }),
        }
      );

      const data = (await fsResponse.json().catch(() => ({}))) as {
        success?: boolean | string;
        message?: string;
      };
      const fsMessage = typeof data.message === 'string' ? data.message : '';
      const isSuccessFlag = data.success === true || data.success === 'true';

      if (fsResponse.ok && isSuccessFlag) {
        status = 'notified';
        deliveryMethod = 'formsubmit';
        detailMessage = fsMessage || `Email notification queued for ${targetEmail}.`;
      } else if (fsMessage.toLowerCase().includes('activat')) {
        status = 'activation-needed';
        deliveryMethod = 'formsubmit';
        detailMessage = fsMessage;
      } else {
        status = 'delivery-unavailable';
        deliveryMethod = 'stored';
        detailMessage =
          fsMessage || `Email relay responded with status ${fsResponse.status}.`;
      }
    } catch (err) {
      status = 'delivery-unavailable';
      deliveryMethod = 'stored';
      detailMessage =
        err instanceof Error
          ? `Server email relay unavailable: ${err.message}`
          : 'Server email relay unavailable.';
    }
  }

  const record: StudyPlanSignupRecord = {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    email: cleanEmail,
    recipientEmail: targetEmail,
    subscribedAt,
    deliveryStatus: status,
    deliveryMethod,
    deliveryDetail: detailMessage,
  };

  const existing = await listStudyPlanSignups();
  await saveStudyPlanSignups([record, ...existing]);

  return {
    ok: true,
    status,
    deliveryMethod,
    message: detailMessage,
    record,
  };
};
