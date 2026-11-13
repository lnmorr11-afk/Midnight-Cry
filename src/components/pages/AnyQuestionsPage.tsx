import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  X,
  Inbox,
} from 'lucide-react';
import { FaqItem } from '../../data/defaultSiteContent';
import { useOwnerEdit } from '../../context/OwnerEditContext';
import { EditableText } from '../EditableText';

interface AnyQuestionsPageProps {
  onNavigateHome: () => void;
}

interface QuestionRecord {
  id: string;
  name: string;
  email: string;
  topic: string;
  question: string;
  submittedAt: string;
  deliveryStatus: 'notified' | 'activation-needed' | 'delivery-unavailable';
  deliveryMethod?: string;
}

const QUESTIONS_RECIPIENT_EMAIL = 'thefearofgod578@gmail.com';

export const AnyQuestionsPage: React.FC<AnyQuestionsPageProps> = ({ onNavigateHome }) => {
  const { isOwnerMode, ownerToken, siteContent, updateSiteContent } = useOwnerEdit();
  const {
    title,
    subtitle,
    formHeading,
    verseQuote,
    verseReference,
    faqHeading,
    footerText,
    faqs,
  } = siteContent.anyQuestionsPage;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [topic, setTopic] = useState('Salvation & Grace');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    status: 'notified' | 'activation-needed' | 'delivery-unavailable';
    submittedName: string;
    submittedEmail: string;
    submittedTopic: string;
    submittedQuestion: string;
  } | null>(null);

  const [submissions, setSubmissions] = useState<QuestionRecord[]>([]);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!ownerToken) return;
    try {
      const res = await fetch('/api/questions/submissions', {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { ok?: boolean; submissions?: QuestionRecord[] };
      if (Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
      }
    } catch {
      // ignore offline errors
    }
  }, [ownerToken]);

  useEffect(() => {
    if (isOwnerMode && ownerToken) {
      fetchSubmissions();
    }
  }, [isOwnerMode, ownerToken, fetchSubmissions]);

  const updateQuestionsField = <K extends keyof typeof siteContent.anyQuestionsPage>(
    key: K,
    value: (typeof siteContent.anyQuestionsPage)[K]
  ) => {
    updateSiteContent((prev) => ({
      ...prev,
      anyQuestionsPage: { ...prev.anyQuestionsPage, [key]: value },
    }));
  };

  const buildMailtoHref = (
    senderName: string,
    senderEmail: string,
    inquiryTopic: string,
    inquiryQuestion: string
  ) => {
    const subject = encodeURIComponent(`Any Questions (${inquiryTopic}) from ${senderName}`);
    const body = encodeURIComponent(
      `Name: ${senderName}\nEmail: ${senderEmail}\nTopic: ${inquiryTopic}\n\nQuestion:\n${inquiryQuestion}`
    );
    return `mailto:${QUESTIONS_RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanQuestion = question.trim();

    if (!cleanName) {
      setFormError('Please enter your name.');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!cleanQuestion) {
      setFormError('Please write your question.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    let deliveryStatus: QuestionRecord['deliveryStatus'] = 'delivery-unavailable';

    try {
      const res = await fetch('/api/questions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          topic,
          question: cleanQuestion,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: QuestionRecord['deliveryStatus'];
        error?: string;
        record?: QuestionRecord;
      };

      if (!res.ok) {
        setIsSubmitting(false);
        setFormError(data.error || 'Could not send your question. Please try again.');
        return;
      }

      deliveryStatus = data.status || 'delivery-unavailable';
      if (data.record) {
        setSubmissions((prev) => [data.record!, ...prev]);
      }
    } catch {
      deliveryStatus = 'delivery-unavailable';
    }

    setIsSubmitting(false);
    setSubmitResult({
      status: deliveryStatus,
      submittedName: cleanName,
      submittedEmail: cleanEmail,
      submittedTopic: topic,
      submittedQuestion: cleanQuestion,
    });
  };

  const handleDeleteSubmission = async (id: string) => {
    setSubmissions((prev) => prev.filter((item) => item.id !== id));
    if (!ownerToken) return;
    try {
      await fetch(`/api/questions/submissions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
    } catch {
      // ignore network error
    }
  };

  const openAddFaq = () => {
    setIsAddingFaq(true);
    setEditingFaq({
      id: `faq-${Date.now()}`,
      q: 'New Biblical Question?',
      a: 'Write the scriptural answer here...',
    });
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq || !editingFaq.q.trim()) return;
    if (isAddingFaq) {
      updateQuestionsField('faqs', [...faqs, editingFaq]);
    } else {
      updateQuestionsField(
        'faqs',
        faqs.map((f) => (f.id === editingFaq.id ? editingFaq : f))
      );
    }
    setEditingFaq(null);
    setIsAddingFaq(false);
  };

  const handleDeleteFaq = (id: string) => {
    updateQuestionsField(
      'faqs',
      faqs.filter((f) => f.id !== id)
    );
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-50/60 to-white border-b border-gray-100 py-10 md:py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center text-sm font-google-sans text-amber-900 hover:text-black mb-3 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </button>
          <EditableText
            value={title}
            onChange={(val) => updateQuestionsField('title', val)}
            as="h1"
            className="font-garamond text-4xl md:text-5xl font-normal text-gray-900 tracking-tight"
            label="Page Title"
          />
          <EditableText
            value={subtitle}
            onChange={(val) => updateQuestionsField('subtitle', val)}
            as="p"
            className="mt-2 text-gray-600 font-roboto text-sm md:text-base max-w-xl"
            label="Page Subtitle"
          />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Question Form */}
          <div className="md:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2.5 mb-6 text-amber-900">
              <MessageSquare className="w-5 h-5 text-amber-800 shrink-0" />
              <EditableText
                value={formHeading}
                onChange={(val) => updateQuestionsField('formHeading', val)}
                as="h2"
                className="font-garamond text-2xl font-normal text-gray-900"
                label="Form Heading"
              />
            </div>

            {submitResult ? (
              submitResult.status === 'notified' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-google-sans font-semibold text-emerald-900 text-lg">
                    Question Sent
                  </h3>
                  <p className="font-roboto text-sm text-emerald-800">
                    Thank you, {submitResult.submittedName}. Your question has been sent directly to{' '}
                    <span className="font-medium">{QUESTIONS_RECIPIENT_EMAIL}</span>. We
                    prayerfully review every inquiry according to the Holy Scriptures.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitResult(null);
                      setQuestion('');
                    }}
                    className="mt-4 text-xs font-google-sans text-emerald-700 hover:underline cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3 animate-in fade-in duration-300">
                  <AlertCircle className="w-10 h-10 text-amber-700 mx-auto" />
                  <h3 className="font-google-sans font-semibold text-amber-950 text-lg">
                    {submitResult.status === 'activation-needed'
                      ? 'Question Saved — Inbox Confirmation Pending'
                      : 'Question Saved'}
                  </h3>
                  <p className="font-roboto text-sm text-amber-900">
                    {submitResult.status === 'activation-needed'
                      ? `Your question was recorded and an activation email was sent to ${QUESTIONS_RECIPIENT_EMAIL}. You can also email your question directly using the button below.`
                      : `Your question was recorded, but automated email delivery is currently waiting on mail relay configuration or connectivity. Tap below to send your question directly to ${QUESTIONS_RECIPIENT_EMAIL}.`}
                  </p>
                  <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={buildMailtoHref(
                        submitResult.submittedName,
                        submitResult.submittedEmail,
                        submitResult.submittedTopic,
                        submitResult.submittedQuestion
                      )}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-google-sans font-medium rounded-lg shadow-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email {QUESTIONS_RECIPIENT_EMAIL}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitResult(null);
                        setQuestion('');
                      }}
                      className="text-xs font-google-sans text-amber-900 hover:underline cursor-pointer"
                    >
                      Send another inquiry
                    </button>
                  </div>
                </div>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="e.g. John"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm font-roboto"
                  />
                </div>

                <div>
                  <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm font-roboto"
                  />
                </div>

                <div>
                  <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                    Topic of Inquiry
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm font-roboto bg-white"
                  >
                    <option value="Salvation & Grace">Salvation &amp; Grace</option>
                    <option value="Repentance & Faith">Repentance &amp; Faith</option>
                    <option value="Tracts & Literature">Tracts &amp; Literature</option>
                    <option value="Testimony or Baptism">Testimony or Baptism</option>
                    <option value="Bible Study Plan">Bible Study Plan</option>
                    <option value="Other Questions">Other Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                    Your Question or Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Write your question here..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-amber-600 focus:border-amber-600 text-sm font-roboto resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-red-600 font-roboto">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-amber-800 hover:bg-amber-900 disabled:bg-gray-400 text-white font-google-sans font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending...' : 'Submit Question'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Direct Email Notice & Scripture Sidebar */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-6 space-y-3">
              <div className="flex items-center space-x-2 font-google-sans font-semibold text-amber-950 text-sm">
                <Mail className="w-4 h-4 text-amber-800 shrink-0" />
                <span>Direct Ministry Email</span>
              </div>
              <p className="text-xs text-gray-700 font-roboto leading-relaxed">
                All submitted questions go directly to our ministry inbox so we can respond
                personally from Scripture.
              </p>
              <a
                href={`mailto:${QUESTIONS_RECIPIENT_EMAIL}`}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 rounded-lg text-xs font-google-sans font-medium shadow-2xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5 mr-2 shrink-0" />
                <span>{QUESTIONS_RECIPIENT_EMAIL}</span>
              </a>
            </div>

            {/* Quick Bible Verse */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white space-y-2">
              <EditableText
                value={verseQuote}
                onChange={(val) => updateQuestionsField('verseQuote', val)}
                as="p"
                className="font-garamond italic text-sm text-gray-800"
                label="Verse Quote"
              />
              <EditableText
                value={verseReference}
                onChange={(val) => updateQuestionsField('verseReference', val)}
                as="p"
                className="text-2xs font-google-sans text-gray-400 uppercase tracking-wider"
                label="Verse Reference"
              />
            </div>
          </div>
        </div>

        {/* Owner-Only Submitted Questions Log */}
        {isOwnerMode && (
          <div className="border border-amber-300 rounded-2xl p-6 bg-amber-50/40 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
              <div className="flex items-center space-x-2">
                <Inbox className="w-5 h-5 text-amber-800" />
                <h3 className="font-google-sans font-semibold text-gray-900 text-base">
                  Owner Inbox: Questions Sent to {QUESTIONS_RECIPIENT_EMAIL} ({submissions.length})
                </h3>
              </div>
            </div>

            {submissions.length === 0 ? (
              <p className="text-xs text-gray-500 font-roboto bg-white border border-gray-200 rounded-lg p-3">
                No questions submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 text-xs font-roboto"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-gray-900">{item.name}</span>{' '}
                        <span className="text-gray-500">({item.email})</span>
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-2xs font-google-sans">
                          {item.topic}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.topic}`)}`}
                          className="text-amber-800 hover:underline font-google-sans"
                        >
                          Reply
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.question}
                    </p>
                    <div className="text-2xs text-gray-400">
                      {new Date(item.submittedAt).toLocaleString()} •{' '}
                      {item.deliveryStatus === 'notified'
                        ? `Sent to ${QUESTIONS_RECIPIENT_EMAIL} (${item.deliveryMethod || 'email'})`
                        : item.deliveryStatus === 'activation-needed'
                          ? 'Awaiting Inbox Activation'
                          : 'Saved on Server'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAQs */}
        <div className="border-t border-gray-100 pt-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EditableText
              value={faqHeading}
              onChange={(val) => updateQuestionsField('faqHeading', val)}
              as="h3"
              className="font-garamond text-3xl text-gray-900 font-normal"
              label="FAQ Heading"
            />
            {isOwnerMode && (
              <button
                onClick={openAddFaq}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {faqs.map((f) => (
              <div
                key={f.id}
                className="p-5 rounded-xl border border-gray-200/80 bg-gray-50/40 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <EditableText
                      value={f.q}
                      onChange={(val) =>
                        updateQuestionsField(
                          'faqs',
                          faqs.map((item) => (item.id === f.id ? { ...item, q: val } : item))
                        )
                      }
                      as="h4"
                      className="font-google-sans font-medium text-sm text-gray-950"
                      label="FAQ Question"
                    />
                  </div>
                  {isOwnerMode && (
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => {
                          setIsAddingFaq(false);
                          setEditingFaq(f);
                        }}
                        className="p-1 text-amber-800 hover:bg-amber-100 rounded cursor-pointer"
                        title="Edit FAQ"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFaq(f.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <EditableText
                  value={f.a}
                  onChange={(val) =>
                    updateQuestionsField(
                      'faqs',
                      faqs.map((item) => (item.id === f.id ? { ...item, a: val } : item))
                    )
                  }
                  as="p"
                  className="font-roboto text-xs md:text-sm text-gray-700 leading-relaxed"
                  label="FAQ Answer"
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 py-8 px-4 sm:px-6 max-w-4xl mx-auto">
        <small dir="ltr" className="block text-gray-900">
          <EditableText
            inline
            value={footerText}
            onChange={(val) => updateQuestionsField('footerText', val)}
            as="span"
            style={{ color: '#1c1c1c' }}
            label="Any Questions Footer"
          />
        </small>
      </footer>

      {/* Add / Edit FAQ Modal */}
      {isOwnerMode && editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveFaq}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-google-sans text-lg font-semibold text-gray-900">
                {isAddingFaq ? 'Add Question & Answer' : 'Edit Question & Answer'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingFaq(null);
                  setIsAddingFaq(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                type="text"
                required
                value={editingFaq.q}
                onChange={(e) => setEditingFaq({ ...editingFaq, q: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Answer
              </label>
              <textarea
                rows={4}
                required
                value={editingFaq.a}
                onChange={(e) => setEditingFaq({ ...editingFaq, a: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingFaq(null);
                  setIsAddingFaq(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                {isAddingFaq ? 'Add FAQ' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
