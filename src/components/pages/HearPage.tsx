import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  Music,
  Mic,
  Clock,
  Plus,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { AudioTrack } from '../../data/defaultSiteContent';
import { useOwnerEdit } from '../../context/OwnerEditContext';
import { EditableText } from '../EditableText';
import { ShareBar } from '../ShareBar';

interface HearPageProps {
  initialItemId?: string;
  onNavigateHome: () => void;
}

export const HearPage: React.FC<HearPageProps> = ({ initialItemId, onNavigateHome }) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { title, subtitle, headerImage, footerText, tracks } = siteContent.hearPage;

  const [activeTab, setActiveTab] = useState<'ALL' | 'SPIRITUAL SONGS' | 'SERMONS'>('ALL');
  const [playingId, setPlayingId] = useState<string | null>(initialItemId || null);
  const [editingTrack, setEditingTrack] = useState<AudioTrack | null>(null);
  const [isAddingTrack, setIsAddingTrack] = useState(false);

  const filtered = activeTab === 'ALL' ? tracks : tracks.filter((t) => t.type === activeTab);

  const togglePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const updateHearField = <K extends keyof typeof siteContent.hearPage>(
    key: K,
    value: (typeof siteContent.hearPage)[K]
  ) => {
    updateSiteContent((prev) => ({
      ...prev,
      hearPage: { ...prev.hearPage, [key]: value },
    }));
  };

  const openAddModal = () => {
    setIsAddingTrack(true);
    setEditingTrack({
      id: `track-${Date.now()}`,
      title: 'New Audio Resource',
      type: activeTab === 'ALL' ? 'SPIRITUAL SONGS' : activeTab,
      speakerOrArtist: 'A Voice in the Last Days',
      duration: '5:00',
      description: 'Enter description...',
      scripture: '',
      audioUrl: '',
    });
  };

  const handleSaveTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack || !editingTrack.title.trim()) return;
    if (isAddingTrack) {
      updateHearField('tracks', [editingTrack, ...tracks]);
    } else {
      updateHearField(
        'tracks',
        tracks.map((t) => (t.id === editingTrack.id ? editingTrack : t))
      );
    }
    setEditingTrack(null);
    setIsAddingTrack(false);
  };

  const handleDeleteTrack = (id: string) => {
    updateHearField(
      'tracks',
      tracks.filter((t) => t.id !== id)
    );
    if (playingId === id) setPlayingId(null);
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-50/60 to-white border-b border-gray-100 py-10 md:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
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
              onChange={(val) => updateHearField('title', val)}
              as="h1"
              className="font-garamond text-4xl md:text-5xl font-normal text-gray-900 tracking-tight"
              label="Hear Page Title"
            />
            <EditableText
              value={subtitle}
              onChange={(val) => updateHearField('subtitle', val)}
              as="p"
              className="mt-2 text-gray-600 font-roboto text-sm md:text-base max-w-xl"
              label="Hear Page Subtitle"
            />
          </div>

          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-md shrink-0 border border-amber-200">
            <img src={headerImage} alt="Listen Audio" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xs border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 py-2.5">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {(['ALL', 'SPIRITUAL SONGS', 'SERMONS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-google-sans tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-amber-800 text-white shadow-xs font-medium'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                {tab === 'ALL' ? 'All Audio' : tab}
              </button>
            ))}
          </div>

          {isOwnerMode && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* Tracks List */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-4">
          {filtered.map((track) => {
            const isPlaying = playingId === track.id;

            return (
              <div
                key={track.id}
                className={`p-5 rounded-xl border transition-all ${
                  isPlaying
                    ? 'border-amber-600 bg-amber-50/40 shadow-md ring-1 ring-amber-500/30'
                    : 'border-gray-200/80 bg-white hover:border-amber-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => togglePlay(track.id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-800 text-white scale-105'
                          : 'bg-gray-100 text-gray-800 hover:bg-amber-700 hover:text-white'
                      }`}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2 text-xs font-google-sans text-amber-800 font-medium">
                        {track.type === 'SPIRITUAL SONGS' ? (
                          <Music className="w-3.5 h-3.5" />
                        ) : (
                          <Mic className="w-3.5 h-3.5" />
                        )}
                        <span>{track.type}</span>
                        {track.scripture && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">{track.scripture}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-garamond text-xl md:text-2xl text-gray-900 mt-0.5">
                        {track.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-roboto mt-0.5">
                        {track.speakerOrArtist}
                      </p>
                      <p className="text-sm text-gray-600 font-roboto mt-2 max-w-2xl">
                        {track.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 text-xs text-gray-500 font-google-sans shrink-0">
                    <div className="flex items-center space-x-2">
                      {isOwnerMode && (
                        <>
                          <button
                            onClick={() => {
                              setIsAddingTrack(false);
                              setEditingTrack(track);
                            }}
                            className="p-1.5 text-amber-800 hover:bg-amber-100 rounded cursor-pointer"
                            title="Edit track"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{track.duration}</span>
                      </div>
                    </div>
                    {isPlaying && (
                      <span className="text-amber-800 font-medium animate-pulse mt-1 flex items-center space-x-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Playing Audio</span>
                      </span>
                    )}
                  </div>
                </div>

                {isPlaying && (
                  <div className="mt-4 pt-3 border-t border-amber-200/60">
                    {track.audioUrl ? (
                      <audio controls autoPlay src={track.audioUrl} className="w-full h-9" />
                    ) : (
                      <>
                        <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-800 h-full w-2/5 animate-pulse rounded-full" />
                        </div>
                        <div className="flex justify-between text-2xs text-gray-400 mt-1 font-mono">
                          <span>01:14</span>
                          <span>{track.duration}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <ShareBar
                  compact
                  title={track.title}
                  summary={`${track.speakerOrArtist} — ${track.description}`}
                  path="/hear"
                  itemId={track.id}
                  itemType={track.type === 'SPIRITUAL SONGS' ? 'Song' : 'Sermon'}
                />
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 py-8 px-4 sm:px-6 max-w-6xl mx-auto">
        <small dir="ltr" className="block text-gray-900">
          <EditableText
            inline
            value={footerText}
            onChange={(val) => updateHearField('footerText', val)}
            as="span"
            style={{ color: '#1c1c1c' }}
            label="Hear Page Footer"
          />
        </small>
      </footer>

      {/* Add / Edit Audio Modal */}
      {isOwnerMode && editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveTrack}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-google-sans text-lg font-semibold text-gray-900">
                {isAddingTrack ? 'Add Audio Track' : 'Edit Audio Track'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingTrack(null);
                  setIsAddingTrack(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={editingTrack.title}
                onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingTrack.type}
                  onChange={(e) =>
                    setEditingTrack({
                      ...editingTrack,
                      type: e.target.value as AudioTrack['type'],
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="SPIRITUAL SONGS">SPIRITUAL SONGS</option>
                  <option value="SERMONS">SERMONS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={editingTrack.duration}
                  onChange={(e) => setEditingTrack({ ...editingTrack, duration: e.target.value })}
                  placeholder="e.g. 4:15"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Speaker or Artist
                </label>
                <input
                  type="text"
                  required
                  value={editingTrack.speakerOrArtist}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, speakerOrArtist: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Scripture (Optional)
                </label>
                <input
                  type="text"
                  value={editingTrack.scripture}
                  onChange={(e) => setEditingTrack({ ...editingTrack, scripture: e.target.value })}
                  placeholder="e.g. Revelation 1:5"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Audio File URL (Optional MP3 link for direct playback)
              </label>
              <input
                type="text"
                value={editingTrack.audioUrl || ''}
                onChange={(e) => setEditingTrack({ ...editingTrack, audioUrl: e.target.value })}
                placeholder="https://example.com/audio.mp3"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={editingTrack.description}
                onChange={(e) =>
                  setEditingTrack({ ...editingTrack, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingTrack(null);
                  setIsAddingTrack(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                {isAddingTrack ? 'Add Audio' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
