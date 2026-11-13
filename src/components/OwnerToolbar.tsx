import React, { useState, useRef } from 'react';
import { useOwnerEdit } from '../context/OwnerEditContext';
import {
  Save,
  Check,
  RotateCcw,
  Download,
  Upload,
  LogOut,
  Edit3,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const OwnerToolbar: React.FC = () => {
  const {
    isOwnerMode,
    saveChanges,
    resetToDefault,
    exitOwnerMode,
    hasUnsavedChanges,
    exportContentJson,
    importContentJson,
    changePasscode,
  } = useOwnerEdit();

  const [justSaved, setJustSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOwnerMode) return null;

  const handleSave = () => {
    saveChanges();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (newPass.trim() !== confirmPass.trim()) {
      setPassError('New passwords do not match.');
      return;
    }
    setIsUpdatingPass(true);
    const result = await changePasscode(currentPass, newPass);
    setIsUpdatingPass(false);
    if (!result.success) {
      setPassError(result.error || 'Could not update password.');
      return;
    }
    setPassSuccess(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => {
      setPassSuccess(false);
      setShowPasswordModal(false);
    }, 1400);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importContentJson(String(reader.result || ''));
      setImportStatus({
        ok: res.success,
        msg: res.success ? 'Backup restored!' : res.error || 'Import failed.',
      });
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExitClick = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      exitOwnerMode(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-in slide-in-from-bottom-4 duration-200">
        <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-amber-500/50 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left Status */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold font-google-sans text-amber-400 tracking-wider uppercase">
                  Owner Edit Mode
                </span>
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <p className="text-2xs text-gray-400 font-roboto hidden sm:block">
                Click any text to edit, or use + Add / Edit / Remove buttons on any page.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {importStatus && (
              <span
                className={`text-2xs px-2 py-1 rounded font-google-sans ${
                  importStatus.ok ? 'bg-emerald-600/30 text-emerald-300' : 'bg-red-600/30 text-red-300'
                }`}
              >
                {importStatus.msg}
              </span>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-google-sans font-medium transition-all shadow-xs cursor-pointer ${
                justSaved
                  ? 'bg-emerald-600 text-white'
                  : hasUnsavedChanges
                  ? 'bg-amber-500 hover:bg-amber-400 text-black font-semibold animate-pulse'
                  : 'bg-amber-600/80 hover:bg-amber-500 text-white'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Edits</span>
                </>
              )}
            </button>

            {/* Change Password */}
            <button
              onClick={() => {
                setPassError(null);
                setPassSuccess(false);
                setShowPasswordModal(true);
              }}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-google-sans text-amber-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              title="Change Owner Password"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1" />
              <span>Password</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={exportContentJson}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              title="Download Full Content Backup (JSON)"
              aria-label="Download Backup"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              title="Restore Content Backup (JSON)"
              aria-label="Import Backup"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Reset Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              title="Reset All Pages to Original Content"
              aria-label="Reset to Original"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Exit Edit Mode */}
            <button
              onClick={handleExitClick}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-google-sans text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-google-sans text-lg font-semibold text-gray-900">
                  Change Owner Password
                </h3>
                <p className="text-2xs text-gray-500 font-roboto">
                  Set your personal passcode for editing this website.
                </p>
              </div>
            </div>

            {passSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-google-sans font-medium text-emerald-900">
                  Password updated!
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => {
                      setCurrentPass(e.target.value);
                      setPassError(null);
                    }}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                    New Preferred Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => {
                      setNewPass(e.target.value);
                      setPassError(null);
                    }}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => {
                      setConfirmPass(e.target.value);
                      setPassError(null);
                    }}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                {passError && (
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {passError}
                  </p>
                )}

                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPass}
                    className="flex-1 py-2 bg-amber-800 hover:bg-amber-900 disabled:bg-gray-400 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
                  >
                    {isUpdatingPass ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-google-sans text-lg font-semibold text-gray-900">
              Reset All Content to Original?
            </h3>
            <p className="text-xs text-gray-600 font-roboto leading-relaxed">
              This will restore all pages, texts, articles, audio tracks, videos, testimonies, FAQs, and menu items back to the original site content. Your custom password will remain unchanged.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDefault();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit With Unsaved Changes Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-google-sans text-lg font-semibold text-gray-900">
              Save Changes Before Exiting?
            </h3>
            <p className="text-xs text-gray-600 font-roboto leading-relaxed">
              You have unsaved edits. Would you like to save them before leaving Owner Edit Mode?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  exitOwnerMode(true);
                }}
                className="flex-1 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Save &amp; Exit
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  exitOwnerMode(false);
                }}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Exit Without Saving
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="py-2 px-3 text-gray-500 hover:text-gray-800 text-xs font-google-sans cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
