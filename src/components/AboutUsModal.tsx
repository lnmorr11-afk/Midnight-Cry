import React from 'react';
import { X, ExternalLink, BookOpen, Heart, Globe } from 'lucide-react';
import { useOwnerEdit } from '../context/OwnerEditContext';
import { EditableText } from './EditableText';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { aboutUs } = siteContent;

  if (!isOpen) return null;

  const updateField = <K extends keyof typeof aboutUs>(key: K, value: (typeof aboutUs)[K]) => {
    updateSiteContent((prev) => ({
      ...prev,
      aboutUs: { ...prev.aboutUs, [key]: value },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="relative bg-gradient-to-r from-amber-800 to-yellow-900 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6 text-amber-200" />
          </div>
          <EditableText
            value={aboutUs.title}
            onChange={(val) => updateField('title', val)}
            as="h3"
            className="text-2xl font-serif font-bold tracking-tight text-white"
            label="About Us Title"
          />
          <EditableText
            value={aboutUs.subtitle}
            onChange={(val) => updateField('subtitle', val)}
            as="p"
            className="text-amber-200/90 text-sm mt-1 font-google-sans"
            label="About Us Subtitle"
          />
        </div>

        <div className="p-6 space-y-4 text-gray-700 font-roboto text-sm leading-relaxed">
          <EditableText
            value={aboutUs.quote}
            onChange={(val) => updateField('quote', val)}
            as="p"
            className="text-base text-gray-900 font-medium"
            label="About Us Quote"
          />
          <EditableText
            value={aboutUs.description}
            onChange={(val) => updateField('description', val)}
            as="p"
            label="About Us Description"
          />
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 text-amber-950 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-semibold">
              <Heart className="w-4 h-4 text-amber-700 shrink-0" />
              <EditableText
                inline
                value={aboutUs.missionTitle}
                onChange={(val) => updateField('missionTitle', val)}
                as="span"
                label="Mission Heading"
              />
            </div>
            <EditableText
              value={aboutUs.missionBody}
              onChange={(val) => updateField('missionBody', val)}
              as="p"
              label="Mission Description"
            />
          </div>

          {isOwnerMode && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
              <label className="block text-2xs font-google-sans font-semibold text-amber-900 uppercase">
                Owner: Overview Button Link URL &amp; Label
              </label>
              <input
                type="text"
                value={aboutUs.overviewUrl}
                onChange={(e) => updateField('overviewUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded bg-white"
              />
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={aboutUs.overviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (isOwnerMode) e.preventDefault();
              }}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-google-sans text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <Globe className="w-4 h-4 mr-2 shrink-0" />
              <EditableText
                inline
                value={aboutUs.overviewButtonText}
                onChange={(val) => updateField('overviewButtonText', val)}
                as="span"
                label="Overview Button Text"
              />
              <ExternalLink className="w-3.5 h-3.5 ml-2 shrink-0" />
            </a>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-google-sans text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {aboutUs.closeButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
