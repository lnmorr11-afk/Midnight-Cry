import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  deleteStudyPlanSignup,
  getConfiguredMailTransport,
  listStudyPlanSignups,
  sendStudyPlanNotificationEmail,
} from './server/studyPlanMailer.ts';
import {
  changeOwnerPassword,
  clearSavedSiteContent,
  hasCustomOwnerPassword,
  issueOwnerToken,
  migrateLegacyLocalPasscode,
  readSavedSiteContent,
  verifyOwnerPassword,
  verifyOwnerToken,
  writeSavedSiteContent,
} from './server/ownerAuth.ts';
import {
  deleteQuestionSubmission,
  listQuestionSubmissions,
  sendQuestionNotificationEmail,
} from './server/questionMailer.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '5mb' }));

  // Health & transport status check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      emailTransport: getConfiguredMailTransport(),
      defaultNotificationEmail:
        process.env.STUDY_PLAN_NOTIFICATION_EMAIL?.trim() || 'thefearofgod578@gmail.com',
    });
  });

  // Owner auth & CMS persistence routes (password never returned to client)
  app.get('/api/owner/status', async (_req, res) => {
    try {
      const hasCustomPassword = await hasCustomOwnerPassword();
      res.json({ ok: true, hasCustomPassword });
    } catch (err) {
      console.error('Error checking owner status:', err);
      res.status(500).json({ ok: false, error: 'Failed to check owner status.' });
    }
  });

  app.post('/api/owner/verify', async (req, res) => {
    try {
      const { password } = (req.body || {}) as { password?: unknown };
      const clean = typeof password === 'string' ? password : '';
      const valid = await verifyOwnerPassword(clean);
      if (!valid) {
        res.status(401).json({ ok: false, error: 'Incorrect password.' });
        return;
      }
      const token = issueOwnerToken();
      res.json({ ok: true, token });
    } catch (err) {
      console.error('Error verifying owner password:', err);
      res.status(500).json({ ok: false, error: 'Failed to verify password.' });
    }
  });

  app.post('/api/owner/change-password', async (req, res) => {
    try {
      const { currentPassword, newPassword } = (req.body || {}) as {
        currentPassword?: unknown;
        newPassword?: unknown;
      };
      const result = await changeOwnerPassword(
        typeof currentPassword === 'string' ? currentPassword : '',
        typeof newPassword === 'string' ? newPassword : ''
      );
      if (!result.success) {
        res.status(400).json({ ok: false, error: result.error });
        return;
      }
      const token = issueOwnerToken();
      res.json({ ok: true, token });
    } catch (err) {
      console.error('Error changing owner password:', err);
      res.status(500).json({ ok: false, error: 'Failed to update password.' });
    }
  });

  app.post('/api/owner/migrate-passcode', async (req, res) => {
    try {
      const { legacyPasscode } = (req.body || {}) as { legacyPasscode?: unknown };
      const result = await migrateLegacyLocalPasscode(
        typeof legacyPasscode === 'string' ? legacyPasscode : ''
      );
      res.json({ ok: true, migrated: result.migrated });
    } catch (err) {
      console.error('Error migrating passcode:', err);
      res.status(500).json({ ok: false, migrated: false });
    }
  });

  app.get('/api/owner/content', async (_req, res) => {
    try {
      const content = await readSavedSiteContent();
      res.json({ ok: true, content });
    } catch (err) {
      console.error('Error reading site content:', err);
      res.status(500).json({ ok: false, error: 'Failed to load site content.' });
    }
  });

  app.put('/api/owner/content', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!verifyOwnerToken(token)) {
        res.status(401).json({ ok: false, error: 'Owner authentication required.' });
        return;
      }
      const { content } = (req.body || {}) as { content?: unknown };
      if (!content || typeof content !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid content payload.' });
        return;
      }
      await writeSavedSiteContent(content as Record<string, unknown>);
      res.json({ ok: true });
    } catch (err) {
      console.error('Error saving site content:', err);
      res.status(500).json({ ok: false, error: 'Failed to save site content.' });
    }
  });

  app.delete('/api/owner/content', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!verifyOwnerToken(token)) {
        res.status(401).json({ ok: false, error: 'Owner authentication required.' });
        return;
      }
      await clearSavedSiteContent();
      res.json({ ok: true });
    } catch (err) {
      console.error('Error resetting site content:', err);
      res.status(500).json({ ok: false, error: 'Failed to reset site content.' });
    }
  });

  // List persisted Study Plan signups (for Owner Mode management)
  app.get('/api/study-plan/signups', async (_req, res) => {
    try {
      const signups = await listStudyPlanSignups();
      res.json({
        ok: true,
        signups,
        emailTransport: getConfiguredMailTransport(),
      });
    } catch (err) {
      console.error('Failed to list signups:', err);
      res.status(500).json({ ok: false, error: 'Failed to load study plan signups.' });
    }
  });

  // Handle Study Plan registration & send notification email to thefearofgod578@gmail.com
  app.post('/api/study-plan/signup', async (req, res) => {
    try {
      const { name, email, recipientEmail } = (req.body || {}) as {
        name?: unknown;
        email?: unknown;
        recipientEmail?: unknown;
      };

      const cleanEmail = typeof email === 'string' ? email.trim() : '';
      const cleanName = typeof name === 'string' ? name.trim() : '';
      const cleanRecipient =
        typeof recipientEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())
          ? recipientEmail.trim()
          : 'thefearofgod578@gmail.com';

      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        res.status(400).json({ ok: false, error: 'Please provide a valid email address.' });
        return;
      }

      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol =
        typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol;
      const host = req.get('host');
      const requestOrigin = host ? `${protocol}://${host}` : undefined;

      const result = await sendStudyPlanNotificationEmail({
        name: cleanName,
        email: cleanEmail,
        recipientEmail: cleanRecipient,
        requestOrigin,
      });

      res.json(result);
    } catch (err) {
      console.error('Error handling study plan signup:', err);
      res.status(500).json({
        ok: false,
        error: 'An unexpected error occurred while processing your signup.',
      });
    }
  });

  // Delete a signup record by ID (Owner Mode cleanup)
  app.delete('/api/study-plan/signups/:id', async (req, res) => {
    try {
      const deleted = await deleteStudyPlanSignup(req.params.id);
      res.json({ ok: true, deleted });
    } catch (err) {
      console.error('Error deleting signup:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete signup record.' });
    }
  });

  // Any Questions: strictly delivers questions to thefearofgod578@gmail.com only
  app.post('/api/questions/submit', async (req, res) => {
    try {
      const { name, email, topic, question } = (req.body || {}) as {
        name?: unknown;
        email?: unknown;
        topic?: unknown;
        question?: unknown;
      };

      const cleanName = typeof name === 'string' ? name.trim() : '';
      const cleanEmail = typeof email === 'string' ? email.trim() : '';
      const cleanTopic = typeof topic === 'string' ? topic.trim() : 'General Question';
      const cleanQuestion = typeof question === 'string' ? question.trim() : '';

      if (!cleanName) {
        res.status(400).json({ ok: false, error: 'Please enter your name.' });
        return;
      }
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        res.status(400).json({ ok: false, error: 'Please provide a valid email address.' });
        return;
      }
      if (!cleanQuestion) {
        res.status(400).json({ ok: false, error: 'Please write your question.' });
        return;
      }

      const forwardedProto = req.headers['x-forwarded-proto'];
      const protocol =
        typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol;
      const host = req.get('host');
      const requestOrigin = host ? `${protocol}://${host}` : undefined;

      const result = await sendQuestionNotificationEmail({
        name: cleanName,
        email: cleanEmail,
        topic: cleanTopic,
        question: cleanQuestion,
        requestOrigin,
      });

      res.json(result);
    } catch (err) {
      console.error('Error handling Any Questions submission:', err);
      res.status(500).json({
        ok: false,
        error: 'An unexpected error occurred while submitting your question.',
      });
    }
  });

  app.get('/api/questions/submissions', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!verifyOwnerToken(token)) {
        res.status(401).json({ ok: false, error: 'Owner authentication required.' });
        return;
      }
      const submissions = await listQuestionSubmissions();
      res.json({ ok: true, submissions });
    } catch (err) {
      console.error('Error listing question submissions:', err);
      res.status(500).json({ ok: false, error: 'Failed to load questions.' });
    }
  });

  app.delete('/api/questions/submissions/:id', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!verifyOwnerToken(token)) {
        res.status(401).json({ ok: false, error: 'Owner authentication required.' });
        return;
      }
      const deleted = await deleteQuestionSubmission(req.params.id);
      res.json({ ok: true, deleted });
    } catch (err) {
      console.error('Error deleting question submission:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete question.' });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', async (_req, res) => {
      const indexHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
      res.status(200).set({ 'Content-Type': 'text/html' }).end(indexHtml);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
