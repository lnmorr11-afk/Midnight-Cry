import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Mail,
  AlertCircle,
  Send,
  Users,
  Copy,
  Check,
  Download,
  Trash2,
} from 'lucide-react';
import { useOwnerEdit } from '../../context/OwnerEditContext';
import { EditableText } from '../EditableText';

interface StudyPlanPageProps {
  onNavigateHome: () => void;
}

interface SubscriberRecord {
  id: string;
  name: string;
  email: string;
  subscribedAt: string;
  status: 'notified' | 'activation-needed' | 'delivery-unavailable';
  deliveryMethod?: string;
}

interface ServerSignupRecord {
  id: string;
  name: string;
  email: string;
  subscribedAt: string;
  deliveryStatus: 'notified' | 'activation-needed' | 'delivery-unavailable';
  deliveryMethod?: string;
}

const SUBSCRIBERS_STORAGE_KEY = 'voice_site_study_subscribers_v1';

const loadLocalSubscribers = (): SubscriberRecord[] => {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const StudyPlanPage: React.FC<StudyPlanPageProps> = ({ onNavigateHome }) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const {
    title,
    subtitle,
    headerImage,
    formTitle,
    formSubtitle,
    formDisclaimer,
    notificationEmail,
    footerText,
  } = siteContent.studyPlanPage;

  const targetNotificationEmail = notificationEmail?.trim() || 'thefearofgod578@gmail.com';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    status: 'notified' | 'activation-needed' | 'delivery-unavailable';
    submittedEmail: string;
    submittedName: string;
    detailMessage?: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>(loadLocalSubscribers);
  const [serverTransport, setServerTransport] = useState<string | null>(null);
  const [copiedEmails, setCopiedEmails] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(subscribers));
    } catch {
      // ignore storage quota errors
    }
  }, [subscribers]);

  const fetchServerSubscribers = useCallback(async () => {
    try {
      const res = await fetch('/api/study-plan/signups');
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        signups?: ServerSignupRecord[];
        emailTransport?: string;
      };
      if (data.emailTransport) {
        setServerTransport(data.emailTransport);
      }
      if (Array.isArray(data.signups)) {
        const mapped: SubscriberRecord[] = data.signups.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          subscribedAt: item.subscribedAt,
          status: item.deliveryStatus || 'delivery-unavailable',
          deliveryMethod: item.deliveryMethod,
        }));
        setSubscribers((prev) => {
          const seen = new Set(mapped.map((m) => m.id));
          const localOnly = prev.filter((p) => !seen.has(p.id));
          return [...mapped, ...localOnly];
        });
      }
    } catch {
      // offline or server unreachable; keep local records
    }
  }, []);

  useEffect(() => {
    if (isOwnerMode) {
      fetchServerSubscribers();
    }
  }, [isOwnerMode, fetchServerSubscribers]);

  const updateStudyField = <K extends keyof typeof siteContent.studyPlanPage>(
    key: K,
    value: (typeof siteContent.studyPlanPage)[K]
  ) => {
    updateSiteContent((prev) => ({
      ...prev,
      studyPlanPage: { ...prev.studyPlanPage, [key]: value },
    }));
  };

  const buildMailtoHref = (subEmail: string, subName: string) => {
    const subject = encodeURIComponent(`New Bible Study Plan Signup: ${subEmail}`);
    const body = encodeURIComponent(
      `New Daily Bible Study Plan signup:\n\nName: ${subName || 'Not provided'}\nSubscriber Email: ${subEmail}\n\nPlease send the study plan to this email address.`
    );
    return `mailto:${targetNotificationEmail}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    let deliveryStatus: SubscriberRecord['status'] = 'delivery-unavailable';
    let detailMessage: string | undefined;
    let deliveryMethod: string | undefined;
    let serverRecordId: string | undefined;
    let subscribedAt = new Date().toISOString();

    try {
      const response = await fetch('/api/study-plan/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          recipientEmail: targetNotificationEmail,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: 'notified' | 'activation-needed' | 'delivery-unavailable';
        deliveryMethod?: string;
        message?: string;
        error?: string;
        record?: ServerSignupRecord;
      };

      if (!response.ok) {
        setIsSubmitting(false);
        setFormError(data.error || 'Unable to process signup right now. Please try again.');
        return;
      }

      deliveryStatus = data.status || 'delivery-unavailable';
      detailMessage = data.message;
      deliveryMethod = data.deliveryMethod;
      if (data.record) {
        serverRecordId = data.record.id;
        subscribedAt = data.record.subscribedAt;
      }
    } catch {
      deliveryStatus = 'delivery-unavailable';
      detailMessage = 'Server unreachable or device is offline.';
    }

    const record: SubscriberRecord = {
      id: serverRecordId || `sub-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      subscribedAt,
      status: deliveryStatus,
      deliveryMethod,
    };

    setSubscribers((prev) => [record, ...prev.filter((item) => item.id !== record.id)]);
    setIsSubmitting(false);
    setSubmitResult({
      status: deliveryStatus,
      submittedEmail: cleanEmail,
      submittedName: cleanName,
      detailMessage,
    });
  };

  const handleCopyAllEmails = async () => {
    if (subscribers.length === 0) return;
    const uniqueEmails = Array.from(new Set(subscribers.map((s) => s.email))).join(', ');
    try {
      await navigator.clipboard.writeText(uniqueEmails);
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const rows = [
      ['Name', 'Email', 'Signed Up At', 'Notification Status'].join(','),
      ...subscribers.map((s) =>
        [
          `"${(s.name || '').replace(/"/g, '""')}"`,
          `"${s.email.replace(/"/g, '""')}"`,
          `"${s.subscribedAt}"`,
          `"${s.status}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bible-study-plan-subscribers.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSubscriber = async (id: string) => {
    setSubscribers((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/study-plan/signups/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore network failure on cleanup
    }
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-50/60 to-white border-b border-gray-100 py-10 md:py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center text-sm font-google-sans text-amber-900 hover:text-black mb-3 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </button>
            <EditableText
              value={title}
              onChange={(val) => updateStudyField('title', val)}
              as="h1"
              className="font-garamond text-4xl md:text-5xl font-normal text-gray-900 tracking-tight"
              label="Study Plan Title"
            />
            <EditableText
              value={subtitle}
              onChange={(val) => updateStudyField('subtitle', val)}
              as="p"
              className="mt-2 text-gray-600 font-roboto text-sm md:text-base max-w-xl"
              label="Study Plan Subtitle"
            />
          </div>

          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-md shrink-0 border border-amber-200">
            <img src={headerImage} alt="Bible Study Plan" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Email Signup Card */}
        <div className="bg-white rounded-2xl border-2 border-amber-200/80 shadow-md p-6 sm:p-10 max-w-xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block p-3 bg-amber-100 text-amber-800 rounded-full mb-3">
              <BookOpen className="w-6 h-6" />
            </span>
            <EditableText
              value={formTitle}
              onChange={(val) => updateStudyField('formTitle', val)}
              as="h2"
              className="font-garamond text-3xl font-normal text-gray-900"
              label="Form Heading"
            />
            <EditableText
              value={formSubtitle}
              onChange={(val) => updateStudyField('formSubtitle', val)}
              as="p"
              className="font-google-sans text-amber-900 font-medium text-sm mt-1"
              label="Form Subheading"
            />
          </div>

          {submitResult ? (
            submitResult.status === 'notified' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2.5 animate-in fade-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-google-sans font-semibold text-emerald-900 text-lg">
                  Thank you!
                </h3>
                <p className="font-roboto text-sm text-emerald-800">
                  Your signup for <span className="font-medium">{submitResult.submittedEmail}</span>{' '}
                  has been received. We will send the Bible study plan directly to your email.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitResult(null);
                    setEmail('');
                    setName('');
                  }}
                  className="mt-3 text-xs font-google-sans text-emerald-700 hover:underline cursor-pointer"
                >
                  Sign up another email
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3 animate-in fade-in duration-300">
                <AlertCircle className="w-10 h-10 text-amber-700 mx-auto" />
                <h3 className="font-google-sans font-semibold text-amber-950 text-lg">
                  {submitResult.status === 'activation-needed'
                    ? 'Registration Saved — Inbox Confirmation Pending'
                    : 'Registration Saved'}
                </h3>
                <p className="font-roboto text-sm text-amber-900">
                  {submitResult.status === 'activation-needed'
                    ? `Your signup (${submitResult.submittedEmail}) has been saved, and an activation confirmation email was sent to ${targetNotificationEmail}. You can also send your registration directly via email below.`
                    : `Your signup (${submitResult.submittedEmail}) has been saved, but automated email delivery is currently waiting on server mail configuration or connectivity. Tap below to notify ${targetNotificationEmail} directly from your email app.`}
                </p>
                <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={buildMailtoHref(submitResult.submittedEmail, submitResult.submittedName)}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-google-sans font-medium rounded-lg shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Signup to {targetNotificationEmail}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitResult(null);
                      setEmail('');
                      setName('');
                    }}
                    className="text-xs font-google-sans text-amber-900 hover:underline cursor-pointer"
                  >
                    Sign up another email
                  </button>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm font-roboto"
                />
              </div>

              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm font-roboto"
                  />
                </div>
                {formError && (
                  <p className="mt-1 text-xs text-red-600 font-roboto">{formError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-800 hover:bg-amber-900 disabled:bg-gray-400 text-white font-google-sans font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </span>
                ) : (
                  <span>Subscribe</span>
                )}
              </button>

              <EditableText
                value={formDisclaimer}
                onChange={(val) => updateStudyField('formDisclaimer', val)}
                as="p"
                className="text-2xs text-gray-500 text-center font-roboto"
                label="Form Disclaimer"
              />
            </form>
          )}
        </div>

        {/* Owner-Only Notification Settings & Captured Subscribers */}
        {isOwnerMode && (
          <div className="max-w-2xl mx-auto border border-amber-300 rounded-2xl p-6 bg-amber-50/40 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-800" />
                <h3 className="font-google-sans font-semibold text-gray-900 text-base">
                  Owner Settings: Study Plan Notifications & Signups
                </h3>
              </div>
              {subscribers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyAllEmails}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-google-sans text-gray-800 cursor-pointer"
                  >
                    {copiedEmails ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedEmails ? 'Copied' : 'Copy Emails'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-xs font-google-sans text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Notification Recipient Email
              </label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => updateStudyField('notificationEmail', e.target.value)}
                placeholder="thefearofgod578@gmail.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-roboto focus:outline-hidden focus:ring-2 focus:ring-amber-600"
              />
              <p className="mt-1 text-2xs text-gray-600 font-roboto">
                Signups are submitted to <span className="font-mono">/api/study-plan/signup</span>{' '}
                and forwarded to{' '}
                <span className="font-medium text-gray-900">{targetNotificationEmail}</span>
                {serverTransport ? ` (active server transport: ${serverTransport})` : ''}. Set{' '}
                <span className="font-mono">GMAIL_USER</span> +{' '}
                <span className="font-mono">GMAIL_APP_PASSWORD</span> (or{' '}
                <span className="font-mono">RESEND_API_KEY</span>) in server secrets for direct
                unattended delivery.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-google-sans font-medium text-gray-700">
                Recorded Signups ({subscribers.length})
              </div>
              {subscribers.length === 0 ? (
                <p className="text-xs text-gray-500 font-roboto bg-white border border-gray-200 rounded-lg p-3">
                  No signups recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {subscribers.map((sub) => (
                    <div
                      key={sub.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-roboto"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {sub.email}
                          {sub.name ? (
                            <span className="text-gray-500 font-normal"> ({sub.name})</span>
                          ) : null}
                        </div>
                        <div className="text-2xs text-gray-500">
                          {new Date(sub.subscribedAt).toLocaleString()} •{' '}
                          {sub.status === 'notified'
                            ? `Notified (${sub.deliveryMethod || 'email'})`
                            : sub.status === 'activation-needed'
                              ? 'Awaiting Inbox Activation'
                              : 'Stored / Fallback Needed'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubscriber(sub.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer shrink-0"
                        title="Remove entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 py-8 px-4 sm:px-6 max-w-4xl mx-auto">
        <small dir="ltr" className="block text-gray-900">
          <EditableText
            inline
            value={footerText}
            onChange={(val) => updateStudyField('footerText', val)}
            as="span"
            style={{ color: '#1c1c1c' }}
            label="Study Plan Footer"
          />
        </small>
      </footer>
    </div>
  );
};
