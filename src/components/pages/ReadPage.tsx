import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  PenTool,
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  DownloadCloud,
} from 'lucide-react';
import { TractItem } from '../../data/defaultSiteContent';
import { useOwnerEdit } from '../../context/OwnerEditContext';
import { EditableText } from '../EditableText';
import {
  cacheMinistryArticlesOffline,
  getCachedArticleIds,
} from '../../utils/offlineTractsCache';
import { ShareBar } from '../ShareBar';

interface ReadPageProps {
  initialSubCategory?: string;
  initialItemId?: string;
  onNavigateHome: () => void;
}

export const ReadPage: React.FC<ReadPageProps> = ({
  initialSubCategory,
  initialItemId,
  onNavigateHome,
}) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { title, subtitle, headerImage, footerText, articles } = siteContent.readPage;

  const [activeTab, setActiveTab] = useState<'ALL' | 'TRACTS' | 'TIMELINES' | 'DOCUMENTS' | 'BLOGS'>(
    (initialSubCategory as 'ALL' | 'TRACTS' | 'TIMELINES' | 'DOCUMENTS' | 'BLOGS') || 'ALL'
  );
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(initialItemId || null);
  const [editingArticle, setEditingArticle] = useState<TractItem | null>(null);
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [cachedIds, setCachedIds] = useState<string[]>([]);
  const [isCachingAll, setIsCachingAll] = useState(false);

  useEffect(() => {
    getCachedArticleIds().then(setCachedIds);
  }, [articles]);

  const handleCacheAllOffline = async () => {
    setIsCachingAll(true);
    const ids = await cacheMinistryArticlesOffline(articles);
    setCachedIds(ids);
    setTimeout(() => setIsCachingAll(false), 500);
  };

  const selectedArticle = articles.find((a) => a.id === selectedArticleId) || null;

  const filtered =
    activeTab === 'ALL' ? articles : articles.filter((a) => a.category === activeTab);

  const updateReadField = <K extends keyof typeof siteContent.readPage>(
    key: K,
    value: (typeof siteContent.readPage)[K]
  ) => {
    updateSiteContent((prev) => ({
      ...prev,
      readPage: { ...prev.readPage, [key]: value },
    }));
  };

  const openAddModal = () => {
    setIsAddingArticle(true);
    setEditingArticle({
      id: `article-${Date.now()}`,
      title: 'New Article',
      category: activeTab === 'ALL' ? 'TRACTS' : activeTab,
      subCategory: '',
      summary: 'Enter a brief summary of this resource...',
      scriptureReference: '',
      content: ['Write your first paragraph here...'],
    });
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title.trim()) return;
    const cleanedContent = editingArticle.content.map((p) => p.trim()).filter(Boolean);
    const finalized: TractItem = {
      ...editingArticle,
      content: cleanedContent.length > 0 ? cleanedContent : [''],
    };

    if (isAddingArticle) {
      updateReadField('articles', [finalized, ...articles]);
      setSelectedArticleId(finalized.id);
    } else {
      updateReadField(
        'articles',
        articles.map((a) => (a.id === finalized.id ? finalized : a))
      );
    }
    setEditingArticle(null);
    setIsAddingArticle(false);
  };

  const handleDeleteArticle = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateReadField(
      'articles',
      articles.filter((a) => a.id !== id)
    );
    if (selectedArticleId === id) {
      setSelectedArticleId(null);
    }
  };

  const updateSelectedParagraph = (articleId: string, pIndex: number, text: string) => {
    updateReadField(
      'articles',
      articles.map((a) =>
        a.id === articleId
          ? { ...a, content: a.content.map((p, i) => (i === pIndex ? text : p)) }
          : a
      )
    );
  };

  const addSelectedParagraph = (articleId: string) => {
    updateReadField(
      'articles',
      articles.map((a) =>
        a.id === articleId ? { ...a, content: [...a.content, 'New paragraph...'] } : a
      )
    );
  };

  const removeSelectedParagraph = (articleId: string, pIndex: number) => {
    updateReadField(
      'articles',
      articles.map((a) =>
        a.id === articleId
          ? { ...a, content: a.content.filter((_, i) => i !== pIndex) }
          : a
      )
    );
  };

  return (
    <div className="w-full bg-white min-h-screen">
      {/* Page Header */}
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
              onChange={(val) => updateReadField('title', val)}
              as="h1"
              className="font-garamond text-4xl md:text-5xl font-normal text-gray-900 tracking-tight"
              label="Read Page Title"
            />
            <EditableText
              value={subtitle}
              onChange={(val) => updateReadField('subtitle', val)}
              as="p"
              className="mt-2 text-gray-600 font-roboto text-sm md:text-base max-w-xl"
              label="Read Page Subtitle"
            />
          </div>

          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-md shrink-0 border border-amber-200">
            <img src={headerImage} alt="Read Scripture" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xs border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 py-2.5">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {(['ALL', 'TRACTS', 'TIMELINES', 'DOCUMENTS', 'BLOGS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedArticleId(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-google-sans tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-amber-800 text-white shadow-xs font-medium'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                {tab === 'ALL' ? 'All Resources' : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCacheAllOffline}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-google-sans font-medium cursor-pointer transition-colors"
              title="Ensure all ministry tracts and articles are saved for offline viewing"
            >
              {cachedIds.length >= articles.length && articles.length > 0 && !isCachingAll ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">
                    Offline Ready ({cachedIds.length}/{articles.length})
                  </span>
                  <span className="sm:hidden">Offline Ready</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="w-3.5 h-3.5 text-amber-800" />
                  <span>{isCachingAll ? 'Caching...' : 'Save Offline'}</span>
                </>
              )}
            </button>

            {isOwnerMode && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Article</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {selectedArticle ? (
          <article className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-6 border-b border-gray-100">
              <button
                onClick={() => setSelectedArticleId(null)}
                className="inline-flex items-center text-sm font-google-sans text-amber-800 hover:text-amber-950 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back to list</span>
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md font-google-sans uppercase tracking-wider">
                  {selectedArticle.category}
                </span>
                {isOwnerMode && (
                  <>
                    <button
                      onClick={() => {
                        setIsAddingArticle(false);
                        setEditingArticle(selectedArticle);
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded text-xs font-google-sans cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(selectedArticle.id)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-google-sans cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="py-6">
              <EditableText
                value={selectedArticle.title}
                onChange={(val) =>
                  updateReadField(
                    'articles',
                    articles.map((a) => (a.id === selectedArticle.id ? { ...a, title: val } : a))
                  )
                }
                as="h2"
                className="font-garamond text-3xl md:text-4xl text-gray-950 font-normal leading-tight"
                label="Article Title"
              />
              {(selectedArticle.scriptureReference || isOwnerMode) && (
                <div className="mt-2 flex items-center space-x-1 text-sm font-garamond italic text-amber-900">
                  <span>Scripture:</span>
                  <EditableText
                    inline
                    value={selectedArticle.scriptureReference || ''}
                    onChange={(val) =>
                      updateReadField(
                        'articles',
                        articles.map((a) =>
                          a.id === selectedArticle.id ? { ...a, scriptureReference: val } : a
                        )
                      )
                    }
                    as="span"
                    label="Scripture Reference"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 text-gray-800 font-roboto text-base leading-relaxed border-t border-gray-100 pt-6">
              {selectedArticle.content.map((p, idx) => (
                <div key={idx} className="relative group/para flex items-start gap-2">
                  <div className="flex-1">
                    <EditableText
                      value={p}
                      onChange={(val) => updateSelectedParagraph(selectedArticle.id, idx, val)}
                      as="p"
                      className="leading-relaxed"
                      label={`Paragraph ${idx + 1}`}
                    />
                  </div>
                  {isOwnerMode && selectedArticle.content.length > 1 && (
                    <button
                      onClick={() => removeSelectedParagraph(selectedArticle.id, idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer shrink-0"
                      title="Remove paragraph"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {isOwnerMode && (
                <button
                  onClick={() => addSelectedParagraph(selectedArticle.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Paragraph</span>
                </button>
              )}
            </div>

            <ShareBar
              title={selectedArticle.title}
              summary={selectedArticle.summary}
              path="/read"
              itemId={selectedArticle.id}
              itemType={
                selectedArticle.category === 'BLOGS'
                  ? 'Blog'
                  : selectedArticle.category === 'DOCUMENTS'
                    ? 'Document'
                    : selectedArticle.category === 'TIMELINES'
                      ? 'Timeline'
                      : 'Article'
              }
              defaultOpen
            />

            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Published by A Voice in the Last Days</span>
              <button
                onClick={() => setSelectedArticleId(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-xs font-google-sans hover:bg-black transition-colors cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </article>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedArticleId(item.id)}
                className="group relative p-6 rounded-xl border border-gray-200/80 bg-white hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-google-sans text-gray-500 mb-2">
                    <span className="text-amber-800 font-semibold tracking-wider">
                      {item.category} {item.subCategory && `• ${item.subCategory}`}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {isOwnerMode && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddingArticle(false);
                              setEditingArticle(item);
                            }}
                            className="p-1 text-amber-800 hover:bg-amber-100 rounded cursor-pointer"
                            title="Edit article"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteArticle(item.id, e)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {item.category === 'TIMELINES' ? (
                        <Clock className="w-4 h-4 text-gray-400" />
                      ) : item.category === 'BLOGS' ? (
                        <PenTool className="w-4 h-4 text-gray-400" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-garamond text-2xl text-gray-950 font-normal group-hover:text-amber-900 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3 font-roboto">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-amber-800 font-google-sans font-medium">
                  <span className="inline-flex items-center space-x-1.5">
                    <span>Read Article</span>
                    {cachedIds.includes(item.id) && (
                      <span
                        className="inline-flex items-center text-2xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-normal"
                        title="Cached for offline viewing"
                      >
                        Offline
                      </span>
                    )}
                  </span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 py-8 px-4 sm:px-6 max-w-6xl mx-auto">
        <small dir="ltr" className="block text-gray-900">
          <EditableText
            inline
            value={footerText}
            onChange={(val) => updateReadField('footerText', val)}
            as="span"
            style={{ color: '#1c1c1c' }}
            label="Read Page Footer"
          />
        </small>
      </footer>

      {/* Add / Edit Article Modal */}
      {isOwnerMode && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveArticle}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-google-sans text-lg font-semibold text-gray-900">
                {isAddingArticle ? 'Add New Reading Resource' : 'Edit Reading Resource'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingArticle(null);
                  setIsAddingArticle(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingArticle.category}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      category: e.target.value as TractItem['category'],
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="TRACTS">TRACTS</option>
                  <option value="DOCUMENTS">DOCUMENTS</option>
                  <option value="TIMELINES">TIMELINES</option>
                  <option value="BLOGS">BLOGS</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Sub-category (Optional)
                </label>
                <input
                  type="text"
                  value={editingArticle.subCategory || ''}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, subCategory: e.target.value })
                  }
                  placeholder="e.g. General, Damnable Sins"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Scripture Reference (Optional)
                </label>
                <input
                  type="text"
                  value={editingArticle.scriptureReference || ''}
                  onChange={(e) =>
                    setEditingArticle({ ...editingArticle, scriptureReference: e.target.value })
                  }
                  placeholder="e.g. John 3:16, Romans 5:12"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                rows={2}
                required
                value={editingArticle.summary}
                onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Body Paragraphs (separate paragraphs with a blank line)
              </label>
              <textarea
                rows={7}
                required
                value={editingArticle.content.join('\n\n')}
                onChange={(e) =>
                  setEditingArticle({
                    ...editingArticle,
                    content: e.target.value.split(/\n\s*\n/),
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingArticle(null);
                  setIsAddingArticle(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                {isAddingArticle ? 'Add Article' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
