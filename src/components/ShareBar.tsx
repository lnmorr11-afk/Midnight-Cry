import React, { useState } from 'react';
import { Share2, Mail, Link2, Check, MessageCircle } from 'lucide-react';

interface ShareBarProps {
  title: string;
  summary?: string;
  path: string;
  itemId?: string;
  itemType?: string;
  compact?: boolean;
  defaultOpen?: boolean;
}

const buildShareUrl = (path: string, itemId?: string): string => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  const cleanPage = path.replace(/^\//, '');
  if (cleanPage && cleanPage !== 'home') {
    url.searchParams.set('page', cleanPage);
  }
  if (itemId) {
    url.searchParams.set('item', itemId);
  }
  return url.toString();
};

export const ShareBar: React.FC<ShareBarProps> = ({
  title,
  summary,
  path,
  itemId,
  itemType = 'resource',
  compact = false,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const shareUrl = buildShareUrl(path, itemId);
  const shareText = summary ? `${title} — ${summary}` : `${title} | A Voice in the Last Days`;

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(`${title} — A Voice in the Last Days`)}&body=${encodeURIComponent(`${shareText}\n\nRead / Listen here:\n${shareUrl}`)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `${title} | A Voice in the Last Days`,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // user cancelled native share
    }
  };

  if (compact) {
    return (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-950 text-xs font-google-sans font-medium transition-colors cursor-pointer"
            aria-expanded={isOpen}
          >
            <Share2 className="w-3.5 h-3.5 text-amber-800" />
            <span>Share</span>
          </button>

          {isOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150"
            >
              <a
                href={xHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-white text-xs font-google-sans font-medium transition-colors"
                title="Share on X"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X</span>
              </a>

              <a
                href={facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-google-sans font-medium transition-colors"
                title="Share on Facebook"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span>Facebook</span>
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-google-sans font-medium transition-colors"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={emailHref}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-google-sans font-medium transition-colors"
                title="Share via Email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-google-sans font-medium transition-colors cursor-pointer"
                title="Copy share link"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              {canNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-google-sans font-medium transition-colors cursor-pointer"
                  title="More sharing options"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>More</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs sm:text-sm font-google-sans font-medium transition-colors cursor-pointer self-start"
          aria-expanded={isOpen}
        >
          <Share2 className="w-4 h-4 text-amber-800" />
          <span>Share this {itemType}</span>
        </button>

        {isOpen && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
            <a
              href={xHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-black hover:bg-gray-800 text-white text-xs font-google-sans font-medium transition-colors"
              title="Share on X"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X</span>
            </a>

            <a
              href={facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-google-sans font-medium transition-colors"
              title="Share on Facebook"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              <span>Facebook</span>
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-google-sans font-medium transition-colors"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={emailHref}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-google-sans font-medium transition-colors"
              title="Share via Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-google-sans font-medium transition-colors cursor-pointer"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-google-sans font-medium transition-colors cursor-pointer"
                title="More sharing options"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>More</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
