import React, { useState } from 'react';
import { ArrowLeft, Play, ExternalLink, Plus, Edit3, Trash2, X } from 'lucide-react';
import { VideoItem } from '../../data/defaultSiteContent';
import { useOwnerEdit } from '../../context/OwnerEditContext';
import { EditableText } from '../EditableText';
import { ImageUploadField } from '../ImageUploadField';
import { ShareBar } from '../ShareBar';

interface WatchPageProps {
  initialItemId?: string;
  onNavigateHome: () => void;
  onNavigateToTestimonies: () => void;
}

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  return null;
};

export const WatchPage: React.FC<WatchPageProps> = ({
  initialItemId,
  onNavigateHome,
  onNavigateToTestimonies,
}) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { title, subtitle, headerImage, backButtonText, footerText, videos } =
    siteContent.watchPage;

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(initialItemId || null);
  const [activeCategory, setActiveCategory] = useState<
    'ALL' | 'WATCH TESTIMONIES OF SALVATION' | 'WATCH PREACHING VIDEOS'
  >('ALL');
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || null;
  const filtered =
    activeCategory === 'ALL' ? videos : videos.filter((v) => v.category === activeCategory);

  const updateWatchField = <K extends keyof typeof siteContent.watchPage>(
    key: K,
    value: (typeof siteContent.watchPage)[K]
  ) => {
    updateSiteContent((prev) => ({
      ...prev,
      watchPage: { ...prev.watchPage, [key]: value },
    }));
  };

  const openAddModal = () => {
    setIsAddingVideo(true);
    setEditingVideo({
      id: `video-${Date.now()}`,
      title: 'New Video Message',
      category: activeCategory === 'ALL' ? 'WATCH PREACHING VIDEOS' : activeCategory,
      speaker: 'Ministry Speaker',
      duration: '15:00',
      description: 'Enter video description...',
      thumbnail: headerImage,
      videoUrl: '',
    });
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !editingVideo.title.trim()) return;
    if (isAddingVideo) {
      updateWatchField('videos', [editingVideo, ...videos]);
    } else {
      updateWatchField(
        'videos',
        videos.map((v) => (v.id === editingVideo.id ? editingVideo : v))
      );
    }
    setEditingVideo(null);
    setIsAddingVideo(false);
  };

  const handleDeleteVideo = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateWatchField(
      'videos',
      videos.filter((v) => v.id !== id)
    );
    if (selectedVideoId === id) setSelectedVideoId(null);
  };

  const embedUrl = getYouTubeEmbedUrl(selectedVideo?.videoUrl);

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-amber-50/60 to-white border-b border-gray-100 py-10 md:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center text-sm font-google-sans text-amber-900 hover:text-black mb-3 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
              <span>Back Home</span>
            </button>
            <EditableText
              value={title}
              onChange={(val) => updateWatchField('title', val)}
              as="h1"
              className="font-garamond text-4xl md:text-5xl font-normal text-gray-900 tracking-tight"
              label="Watch Page Title"
            />
            <EditableText
              value={subtitle}
              onChange={(val) => updateWatchField('subtitle', val)}
              as="p"
              className="mt-2 text-gray-600 font-roboto text-sm md:text-base max-w-xl"
              label="Watch Page Subtitle"
            />
          </div>

          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-md shrink-0 border border-amber-200">
            <img src={headerImage} alt="Watch Preaching" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xs border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 py-2.5">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {(['ALL', 'WATCH TESTIMONIES OF SALVATION', 'WATCH PREACHING VIDEOS'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setSelectedVideoId(null);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-google-sans tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-amber-800 text-white shadow-xs font-medium'
                      : 'text-gray-600 hover:text-black hover:bg-gray-100'
                  }`}
                >
                  {cat === 'ALL' ? 'All Videos' : cat}
                </button>
              )
            )}
          </div>

          {isOwnerMode && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {selectedVideo ? (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in duration-200">
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : selectedVideo.videoUrl ? (
                <video src={selectedVideo.videoUrl} controls className="w-full h-full" />
              ) : (
                <>
                  <img
                    src={selectedVideo.thumbnail}
                    alt={selectedVideo.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-amber-600/90 hover:bg-amber-500 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 cursor-pointer mb-4">
                      <Play className="w-8 h-8 ml-1" />
                    </div>
                    <p className="text-white text-lg font-garamond font-medium max-w-xl">
                      {selectedVideo.title}
                    </p>
                    <p className="text-amber-200 text-xs mt-1 font-google-sans">
                      Ministry Media Broadcast • {selectedVideo.duration}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 md:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md font-google-sans uppercase tracking-wider">
                  {selectedVideo.category}
                </span>
                <div className="flex items-center space-x-2">
                  {isOwnerMode && (
                    <>
                      <button
                        onClick={() => {
                          setIsAddingVideo(false);
                          setEditingVideo(selectedVideo);
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded text-xs font-google-sans cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Video</span>
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(selectedVideo.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-google-sans cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                  <span className="text-xs text-gray-400 font-mono">{selectedVideo.duration}</span>
                </div>
              </div>
              <h2 className="font-garamond text-2xl md:text-3xl text-gray-900 font-normal">
                {selectedVideo.title}
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed font-roboto">
                {selectedVideo.description}
              </p>

              <ShareBar
                title={selectedVideo.title}
                summary={selectedVideo.description}
                path="/watch"
                itemId={selectedVideo.id}
                itemType="Message"
                defaultOpen
              />

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedVideoId(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-google-sans font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Close Player
                </button>
                <button
                  onClick={onNavigateToTestimonies}
                  className="inline-flex items-center text-xs font-google-sans font-medium text-amber-800 hover:text-amber-950 cursor-pointer"
                >
                  <span>Explore Written Testimonies</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideoId(video.id)}
                className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-amber-700 group-hover:text-white transition-all">
                        <Play className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>
                    {isOwnerMode && (
                      <div className="absolute top-2 right-2 flex items-center space-x-1 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingVideo(false);
                            setEditingVideo(video);
                          }}
                          className="p-1.5 rounded-md bg-white/95 hover:bg-amber-100 text-amber-900 shadow-md cursor-pointer"
                          title="Edit video"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteVideo(video.id, e)}
                          className="p-1.5 rounded-md bg-white/95 hover:bg-red-100 text-red-600 shadow-md cursor-pointer"
                          title="Delete video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-2xs px-2 py-0.5 rounded font-mono">
                      {video.duration}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-2xs font-semibold text-amber-800 font-google-sans uppercase tracking-wider mb-1">
                      {video.category === 'WATCH TESTIMONIES OF SALVATION'
                        ? 'Testimony of Salvation'
                        : 'Preaching Video'}
                    </p>
                    <h3 className="font-garamond text-xl text-gray-950 font-normal group-hover:text-amber-900 transition-colors">
                      {video.title}
                    </h3>
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2 font-roboto leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-4 pt-1 flex items-center justify-between text-xs text-gray-400 font-google-sans">
                  <span>{video.speaker}</span>
                  <span className="text-amber-800 font-medium group-hover:underline">
                    Watch &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Home Button */}
        <div className="mt-16 text-center border-t border-gray-100 pt-10">
          {isOwnerMode ? (
            <div className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm font-google-sans font-medium rounded-md shadow-xs">
              <EditableText
                inline
                value={backButtonText}
                onChange={(val) => updateWatchField('backButtonText', val)}
                as="span"
                label="Back Button Text"
              />
            </div>
          ) : (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-google-sans font-medium rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <span>{backButtonText}</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 py-8 px-4 sm:px-6 max-w-6xl mx-auto">
        <small dir="ltr" className="block text-gray-900">
          <EditableText
            inline
            value={footerText}
            onChange={(val) => updateWatchField('footerText', val)}
            as="span"
            style={{ color: '#1c1c1c' }}
            label="Watch Page Footer"
          />
        </small>
      </footer>

      {/* Add / Edit Video Modal */}
      {isOwnerMode && editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveVideo}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-google-sans text-lg font-semibold text-gray-900">
                {isAddingVideo ? 'Add New Video' : 'Edit Video'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingVideo(null);
                  setIsAddingVideo(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Video Title
              </label>
              <input
                type="text"
                required
                value={editingVideo.title}
                onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingVideo.category}
                  onChange={(e) =>
                    setEditingVideo({
                      ...editingVideo,
                      category: e.target.value as VideoItem['category'],
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="WATCH TESTIMONIES OF SALVATION">
                    WATCH TESTIMONIES OF SALVATION
                  </option>
                  <option value="WATCH PREACHING VIDEOS">WATCH PREACHING VIDEOS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={editingVideo.duration}
                  onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                  placeholder="e.g. 24:12"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Speaker
              </label>
              <input
                type="text"
                required
                value={editingVideo.speaker}
                onChange={(e) => setEditingVideo({ ...editingVideo, speaker: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Video URL (Optional YouTube or direct MP4 URL)
              </label>
              <input
                type="text"
                value={editingVideo.videoUrl || ''}
                onChange={(e) => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... or MP4 URL"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <ImageUploadField
              label="Thumbnail Image URL or Upload"
              value={editingVideo.thumbnail}
              onChange={(val) => setEditingVideo({ ...editingVideo, thumbnail: val })}
            />

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={editingVideo.description}
                onChange={(e) =>
                  setEditingVideo({ ...editingVideo, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingVideo(null);
                  setIsAddingVideo(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                {isAddingVideo ? 'Add Video' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
