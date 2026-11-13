import React from 'react';
import { useOwnerEdit } from '../context/OwnerEditContext';
import { EditableText } from './EditableText';
import { Eye, EyeOff } from 'lucide-react';

interface AnnouncementBannerProps {
  onNavigate?: (path: string) => void;
  onAnyQuestionsClick: () => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  onNavigate,
  onAnyQuestionsClick,
}) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { banner } = siteContent;

  if (!banner.visible && !isOwnerMode) return null;

  const handleClick = () => {
    if (banner.targetPath && onNavigate) {
      onNavigate(banner.targetPath);
    } else {
      onAnyQuestionsClick();
    }
  };

  return (
    <div
      style={{ backgroundColor: 'rgb(191, 144, 0)' }}
      className={`w-full text-black px-4 py-2 flex items-center justify-center shadow-xs text-sm font-medium z-40 transition-colors ${
        !banner.visible ? 'opacity-50' : ''
      }`}
      role="region"
      aria-label="Announcement"
    >
      <div className="max-w-7xl mx-auto w-full relative flex flex-wrap items-center justify-center gap-2">
        {isOwnerMode && (
          <button
            type="button"
            onClick={() =>
              updateSiteContent((prev) => ({
                ...prev,
                banner: { ...prev.banner, visible: !prev.banner.visible },
              }))
            }
            className="sm:absolute sm:right-2 inline-flex items-center space-x-1 px-2 py-1 rounded bg-black/15 hover:bg-black/25 text-xs font-google-sans text-black cursor-pointer"
            title={banner.visible ? 'Hide announcement banner' : 'Show announcement banner'}
          >
            {banner.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{banner.visible ? 'Shown' : 'Hidden'}</span>
          </button>
        )}

        {isOwnerMode ? (
          <div
            className="inline-flex items-center px-4 py-1.5 text-xs md:text-sm font-medium text-black border border-black/80 rounded font-google-sans uppercase tracking-wider"
            title={banner.buttonText}
          >
            <EditableText
              inline
              value={banner.buttonText}
              onChange={(val) =>
                updateSiteContent((prev) => ({
                  ...prev,
                  banner: { ...prev.banner, buttonText: val },
                }))
              }
              as="span"
              label="Banner Button"
            />
          </div>
        ) : (
          <button
            onClick={handleClick}
            className="inline-flex items-center px-4 py-1.5 text-xs md:text-sm font-medium text-black border border-black/80 rounded hover:bg-black/10 focus:outline-hidden focus:ring-2 focus:ring-black/40 transition-all cursor-pointer font-google-sans uppercase tracking-wider"
            title={banner.buttonText}
          >
            <span>{banner.buttonText}</span>
          </button>
        )}
      </div>
    </div>
  );
};
