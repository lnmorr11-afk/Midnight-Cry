import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-900 px-3.5 py-2 text-xs font-google-sans font-medium text-amber-50 shadow-lg border border-amber-500/50"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
      <span>Offline Mode — Cached tracts &amp; articles available.</span>
    </div>
  );
};
