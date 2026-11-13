import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';

export type QuestionDeliveryStatus = 'notified' | 'activation-needed' | 'delivery-unavailable';
export type QuestionDeliveryMethod = 'smtp' | 'resend' | 'formsubmit' | 'stored';

export interface QuestionSubmissionRecord {
  id: string;
  name: string;
  email: string;
  topic: string;
  question: string;
  recipientEmail: 'thefearofgod578@gmail.com';
  submittedAt: string;
  deliveryStatus: QuestionDeliveryStatus;
  deliveryMethod: QuestionDeliveryMethod;
  deliveryDetail?: string;
}

export interface SendQuestionResult {
  ok: boolean;
  status: QuestionDeliveryStatus;
  deliveryMethod: QuestionDeliveryMethod;
  message: string;
  record: QuestionSubmissionRecord;
}

// Questions from Any Questions must go ONLY to this address
export const QUESTIONS_ONLY_EMAIL = 'thefearofgod578@gmail.com' as const;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions-submissions.json');

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const listQuestionSubmissions = async (): Promise<QuestionSubmissionRecord[]> => {
  try {
    const raw = await fs.readFile(QUESTIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuestionSubmissionRecord[]) : [];
  } catch {
    return [];
  }
};

const saveQuestionSubmissions = async (records: QuestionSubmissionRecord[]): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(QUESTIONS_FILE, JSON.stringify(records, null, 2), 'utf8');
};

export const deleteQuestionSubmission = async (id: string): Promise<boolean> => {
  const existing = await listQuestionSubmissions();
  const filtered = existing.filter((item) => item.id !== id);
  if (filtered.length === existing.length) return false;
  await saveQuestionSubmissions(filtered);
  return true;
};

export const sendQuestionNotificationEmail = async (params: {
  name: string;
  email: string;
  topic: string;
  question: string;
  requestOrigin?: string;
}): Promise<SendQuestionResult> => {
  const cleanName = params.name.trim();
  const cleanEmail = params.email.trim();
  const cleanTopic = params.topic.trim() || 'General Question';
  const cleanQuestion = params.question.trim();
  const targetEmail = QUESTIONS_ONLY_EMAIL;

  const submittedAt = new Date().toISOString();
  const formattedDate = new Date(submittedAt).toUTCString();
  const subject = `Any Questions (${cleanTopic}) from ${cleanName}`;

  const textBody = [
    'A new question has been submitted on A Voice in the Last Days (Any Questions).',
    '',
    `From: ${cleanName}`,
    `Reply Email: ${cleanEmail}`,
    `Topic: ${cleanTopic}`,
    `Submitted At: ${formattedDate}`,
    '',
    'Question:',
    cleanQuestion,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; color: #111827;">
      <h2 style="margin: 0 0 12px; color: #78350f; font-size: 20px;">New Inquiry — Any Questions?</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #fffbeb; font-weight: 600; width: 140px;">Name</td>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(cleanName)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #fffbeb; font-weight: 600;">Email</td>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">
            <a href="mailto:${escapeHtml(cleanEmail)}" style="color: #92400e;">${escapeHtml(cleanEmail)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #fffbeb; font-weight: 600;">Topic</td>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(cleanTopic)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb; background: #fffbeb; font-weight: 600;">Submitted At</td>
          <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${escapeHtml(formattedDate)}</td>
        </tr>
      </table>
      <div style="padding: 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(cleanQuestion)}</div>
      <p style="margin: 14px 0 0; font-size: 12px; color: #6b7280;">
        Reply directly to this email to answer ${escapeHtml(cleanName)} (${escapeHtml(cleanEmail)}).
      </p>
    </div>
  `.trim();

  let status: QuestionDeliveryStatus = 'delivery-unavailable';
  let deliveryMethod: QuestionDeliveryMethod = 'stored';
  let detailMessage = 'Question recorded on server.';

  // 1. Direct SMTP via Nodemailer
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
      detailMessage = `Question sent to ${targetEmail} via SMTP.`;
    } catch (err) {
      detailMessage = err instanceof Error ? `SMTP error: ${err.message}` : 'SMTP send failed.';
      console.error('[QuestionMailer] SMTP error:', err);
    }
  }

  // 2. Resend HTTP API
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
        detailMessage = `Question sent to ${targetEmail} via Resend.`;
      } else {
        const errBody = await resendRes.text().catch(() => '');
        detailMessage = `Resend API error (${resendRes.status}): ${errBody}`;
        console.error('[QuestionMailer] Resend error:', detailMessage);
      }
    } catch (err) {
      detailMessage = err instanceof Error ? `Resend error: ${err.message}` : 'Resend send failed.';
      console.error('[QuestionMailer] Resend exception:', err);
    }
  }

  // 3. FormSubmit server-side relay fallback
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
            name: cleanName,
            email: cleanEmail,
            topic: cleanTopic,
            question: cleanQuestion,
            _subject: subject,
            _replyto: cleanEmail,
            _template: 'table',
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
        detailMessage = fsMessage || `Question sent to ${targetEmail}.`;
      } else if (fsMessage.toLowerCase().includes('activat')) {
        status = 'activation-needed';
        deliveryMethod = 'formsubmit';
        detailMessage = fsMessage;
      } else {
        status = 'delivery-unavailable';
        deliveryMethod = 'stored';
        detailMessage = fsMessage || `Email relay responded with status ${fsResponse.status}.`;
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

  const record: QuestionSubmissionRecord = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    email: cleanEmail,
    topic: cleanTopic,
    question: cleanQuestion,
    recipientEmail: targetEmail,
    submittedAt,
    deliveryStatus: status,
    deliveryMethod,
    deliveryDetail: detailMessage,
  };

  const existing = await listQuestionSubmissions();
  await saveQuestionSubmissions([record, ...existing]);

  return {
    ok: true,
    status,
    deliveryMethod,
    message: detailMessage,
    record,
  };
};
