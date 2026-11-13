import React, { useState, useRef, useEffect } from 'react';
import { Info, AlertCircle, ShieldAlert, Edit3 } from 'lucide-react';

interface GoogleSitesBadgeProps {
  onOpenOwnerLogin?: () => void;
}

export const GoogleSitesBadge: React.FC<GoogleSitesBadgeProps> = ({ onOpenOwnerLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-40">
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 mb-2 text-sm text-gray-800 animate-in fade-in zoom-in-95 duration-150">
          <a
            href="https://sites.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <Info className="w-4 h-4 mr-2.5 text-gray-500" />
            <span>Google Sites</span>
          </a>
          <button
            onClick={() => {
              onOpenOwnerLogin?.();
              setIsOpen(false);
            }}
            className="w-full flex items-center px-4 py-2 text-left hover:bg-amber-50 hover:text-amber-900 transition-colors text-gray-800 border-y border-gray-100"
          >
            <Edit3 className="w-4 h-4 mr-2.5 text-amber-700" />
            <span>Owner Edit Mode</span>
          </button>
          <button
            onClick={() => {
              window.open(
                'https://sites.google.com/view/brothers-fighting-for-the-king/home',
                '_blank'
              );
              setIsOpen(false);
            }}
            className="w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors text-red-600"
          >
            <ShieldAlert className="w-4 h-4 mr-2.5 text-red-500" />
            <span>Report abuse</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-gray-600 hover:text-black shadow-lg border border-gray-200 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
        title="Site actions"
        aria-label="Site actions"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>
    </div>
  );
};
