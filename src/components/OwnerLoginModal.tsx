import React, { useState } from 'react';
import { useOwnerEdit } from '../context/OwnerEditContext';
import { X, Lock, KeyRound, AlertCircle } from 'lucide-react';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerLoginModal: React.FC<OwnerLoginModalProps> = ({ isOpen, onClose }) => {
  const { unlockOwnerMode } = useOwnerEdit();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setIsVerifying(true);
    const success = await unlockOwnerMode(passcode);
    setIsVerifying(false);
    if (success) {
      setPasscode('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-google-sans text-xl font-semibold text-gray-900">
            Owner Edit Access
          </h3>
          <p className="text-xs text-gray-500 font-roboto leading-relaxed">
            Enter your owner password to edit text, add items, and remove content across all pages without AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                autoFocus
                required
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(false);
                }}
                placeholder="Enter your owner password"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm font-mono tracking-widest focus:outline-hidden focus:ring-2 ${
                  error
                    ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/30'
                    : 'border-gray-300 focus:ring-amber-600 focus:border-amber-600'
                }`}
              />
            </div>
            {error && (
              <p className="text-2xs text-red-600 mt-1.5 flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                Incorrect password. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-2.5 bg-amber-800 hover:bg-amber-900 disabled:bg-gray-400 text-white font-google-sans text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {isVerifying ? 'Verifying...' : 'Unlock Edit Mode'}
          </button>
        </form>
      </div>
    </div>
  );
};
