import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer font-google-sans"
        title="Install app for offline reading"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700/40 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-950 transition-colors cursor-pointer font-google-sans"
          title="Add to iPhone or iPad Home Screen"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-200 space-y-3">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-google-sans font-semibold text-gray-900">
                Install on iPhone / iPad
              </h3>
              <p className="text-sm font-roboto text-gray-600 leading-relaxed">
                1. Tap the <strong>Share</strong> button in your Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> to read ministry tracts offline.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-2 w-full rounded-lg bg-gray-900 hover:bg-black py-2 text-xs font-google-sans font-medium text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
