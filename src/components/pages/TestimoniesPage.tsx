import React, { useState } from 'react';
import { ArrowLeft, Video, FileText, Plus, Edit3, Trash2, X } from 'lucide-react';
import { Testimony } from '../../data/defaultSiteContent';
import { useOwnerEdit } from '../../context/OwnerEditContext';
import { EditableText } from '../EditableText';
import { ShareBar } from '../ShareBar';

interface TestimoniesPageProps {
  initialItemId?: string;
  onNavigateHome: () => void;
  onNavigateToWatch: () => void;
}

export const TestimoniesPage: React.FC<TestimoniesPageProps> = ({
  initialItemId,
  onNavigateHome,
}) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { title, subtitle, headerImage, footerText, testimonies } = siteContent.testimoniesPage;

  const [activeTab, setActiveTab] = useState<'ALL' | 'WATCH A TESTIMONY' | 'READ A TESTIMONY'>('ALL');
  const [selectedTestimonyId, setSelectedTestimonyId] = useState<string | null>(
    initialItemId || null
  );
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
  const [isAddingTestimony, setIsAddingTestimony] = useState(false);

  const selectedTestimony = testimonies.find((t) => t.id === selectedTestimonyId) || null;
  const filtered =
    activeTab === 'ALL' ? testimonies : testimonies.filter((t) => t.type === activeTab);

  const updateTestimoniesField = <K extends keyof typeof siteContent.testimoniesPage>(
    key: K,
    value: (typeof siteContent.testimoniesPage)[K]
  ) => {
    updateSiteContent((prev) => ({
      ...prev,
      testimoniesPage: { ...prev.testimoniesPage, [key]: value },
    }));
  };

  const openAddModal = () => {
    setIsAddingTestimony(true);
    setEditingTestimony({
      id: `testimony-${Date.now()}`,
      name: 'New Witness',
      type: activeTab === 'ALL' ? 'READ A TESTIMONY' : activeTab,
      title: 'Testimony Title',
      summary: 'Summary of conversion and saving grace...',
      body: ['Write the testimony narrative here...'],
    });
  };

  const handleSaveTestimony = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimony || !editingTestimony.name.trim()) return;
    const cleanedBody = editingTestimony.body.map((p) => p.trim()).filter(Boolean);
    const finalized: Testimony = {
      ...editingTestimony,
      body: cleanedBody.length > 0 ? cleanedBody : [''],
    };

    if (isAddingTestimony) {
      updateTestimoniesField('testimonies', [finalized, ...testimonies]);
      setSelectedTestimonyId(finalized.id);
    } else {
      updateTestimoniesField(
        'testimonies',
        testimonies.map((t) => (t.id === finalized.id ? finalized : t))
      );
    }
    setEditingTestimony(null);
    setIsAddingTestimony(false);
  };

  const handleDeleteTestimony = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateTestimoniesField(
      'testimonies',
      testimonies.filter((t) => t.id !== id)
    );
    if (selectedTestimonyId === id) setSelectedTestimonyId(null);
  };

  const updateParagraph = (id: string, pIndex: number, text: string) => {
    updateTestimoniesField(
      'testimonies',
      testimonies.map((t) =>
        t.id === id ? { ...t, body: t.body.map((p, i) => (i === pIndex ? text : p)) } : t
      )
    );
  };

  const addParagraph = (id: string) => {
    updateTestimoniesField(
      'testimonies',
      testimonies.map((t) => (t.id === id ? { ...t, body: [...t.body, 'New paragraph...'] } : t))
    );
  };

  const removeParagraph = (id: string, pIndex: number) => {
    updateTestimoniesField(
      'testimonies',
      testimonies.map((t) =>
        t.id === id ? { ...t, body: t.body.filter((_, i) => i !== pIndex) } : t
      )
    );
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
              onChange={(val) => updateTestimoniesField('title', val)}
              as="h1"
              className="font-garamond text-4xl md:text-5xl font-normal text-gray-900 tracking-tight"
              label="Testimonies Page Title"
            />
            <EditableText
              value={subtitle}
              onChange={(val) => updateTestimoniesField('subtitle', val)}
              as="p"
              className="mt-2 text-gray-600 font-roboto text-sm md:text-base max-w-xl"
              label="Testimonies Page Subtitle"
            />
          </div>

          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-md shrink-0 border border-amber-200">
            <img src={headerImage} alt="Testimonies" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-xs border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 py-2.5">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {(['ALL', 'WATCH A TESTIMONY', 'READ A TESTIMONY'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedTestimonyId(null);
                }}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-google-sans tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-amber-800 text-white shadow-xs font-medium'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                {tab === 'ALL' ? 'All Testimonies' : tab}
              </button>
            ))}
          </div>

          {isOwnerMode && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Testimony</span>
            </button>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {selectedTestimony ? (
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-6 border-b border-gray-100">
              <button
                onClick={() => setSelectedTestimonyId(null)}
                className="inline-flex items-center text-sm font-google-sans text-amber-800 hover:text-amber-950 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Back to testimonies</span>
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md font-google-sans uppercase tracking-wider">
                  {selectedTestimony.type}
                </span>
                {isOwnerMode && (
                  <>
                    <button
                      onClick={() => {
                        setIsAddingTestimony(false);
                        setEditingTestimony(selectedTestimony);
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded text-xs font-google-sans cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTestimony(selectedTestimony.id)}
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
              <div className="text-xs font-google-sans font-semibold text-amber-800 uppercase tracking-widest flex items-center space-x-1">
                <span>Testimony of</span>
                <EditableText
                  inline
                  value={selectedTestimony.name}
                  onChange={(val) =>
                    updateTestimoniesField(
                      'testimonies',
                      testimonies.map((t) =>
                        t.id === selectedTestimony.id ? { ...t, name: val } : t
                      )
                    )
                  }
                  as="span"
                  label="Witness Name"
                />
              </div>
              <EditableText
                value={selectedTestimony.title}
                onChange={(val) =>
                  updateTestimoniesField(
                    'testimonies',
                    testimonies.map((t) =>
                      t.id === selectedTestimony.id ? { ...t, title: val } : t
                    )
                  )
                }
                as="h2"
                className="font-garamond text-3xl md:text-4xl text-gray-950 font-normal mt-1"
                label="Testimony Title"
              />
            </div>

            <div className="space-y-4 text-gray-800 font-roboto text-base leading-relaxed border-t border-gray-100 pt-6">
              {selectedTestimony.body.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <EditableText
                      value={p}
                      onChange={(val) => updateParagraph(selectedTestimony.id, i, val)}
                      as="p"
                      className="leading-relaxed"
                      label={`Paragraph ${i + 1}`}
                    />
                  </div>
                  {isOwnerMode && selectedTestimony.body.length > 1 && (
                    <button
                      onClick={() => removeParagraph(selectedTestimony.id, i)}
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
                  onClick={() => addParagraph(selectedTestimony.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Paragraph</span>
                </button>
              )}
            </div>

            <ShareBar
              title={`${selectedTestimony.name} — ${selectedTestimony.title}`}
              summary={selectedTestimony.summary}
              path="/testimonies"
              itemId={selectedTestimony.id}
              itemType="Testimony"
              defaultOpen
            />

            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-google-sans">Witness for Jesus Christ</span>
              <button
                onClick={() => setSelectedTestimonyId(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-xs font-google-sans hover:bg-black transition-colors cursor-pointer"
              >
                Back to List
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedTestimonyId(item.id)}
                className="group p-6 rounded-xl border border-gray-200/80 bg-white hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-google-sans text-gray-500 mb-2">
                    <span className="text-amber-800 font-semibold tracking-wider">{item.type}</span>
                    <div className="flex items-center space-x-1.5">
                      {isOwnerMode && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddingTestimony(false);
                              setEditingTestimony(item);
                            }}
                            className="p-1 text-amber-800 hover:bg-amber-100 rounded cursor-pointer"
                            title="Edit testimony"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTestimony(item.id, e)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete testimony"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {item.type === 'WATCH A TESTIMONY' ? (
                        <Video className="w-4 h-4 text-rose-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-garamond text-2xl text-gray-950 font-normal group-hover:text-amber-900 transition-colors">
                    {item.name}
                  </h3>
                  <p className="font-google-sans text-xs font-medium text-gray-500 mt-0.5">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3 font-roboto leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-amber-800 font-google-sans font-medium">
                  <span>
                    {item.type === 'WATCH A TESTIMONY' ? 'Watch Testimony' : 'Read Testimony'}
                  </span>
                  <span>&rarr;</span>
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
            onChange={(val) => updateTestimoniesField('footerText', val)}
            as="span"
            style={{ color: '#1c1c1c' }}
            label="Testimonies Page Footer"
          />
        </small>
      </footer>

      {/* Add / Edit Testimony Modal */}
      {isOwnerMode && editingTestimony && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveTestimony}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-google-sans text-lg font-semibold text-gray-900">
                {isAddingTestimony ? 'Add Testimony' : 'Edit Testimony'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingTestimony(null);
                  setIsAddingTestimony(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Person&apos;s Name
                </label>
                <input
                  type="text"
                  required
                  value={editingTestimony.name}
                  onChange={(e) =>
                    setEditingTestimony({ ...editingTestimony, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={editingTestimony.type}
                  onChange={(e) =>
                    setEditingTestimony({
                      ...editingTestimony,
                      type: e.target.value as Testimony['type'],
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="WATCH A TESTIMONY">WATCH A TESTIMONY</option>
                  <option value="READ A TESTIMONY">READ A TESTIMONY</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Testimony Title
              </label>
              <input
                type="text"
                required
                value={editingTestimony.title}
                onChange={(e) =>
                  setEditingTestimony({ ...editingTestimony, title: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Summary
              </label>
              <textarea
                rows={2}
                required
                value={editingTestimony.summary}
                onChange={(e) =>
                  setEditingTestimony({ ...editingTestimony, summary: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Full Testimony (separate paragraphs with a blank line)
              </label>
              <textarea
                rows={6}
                required
                value={editingTestimony.body.join('\n\n')}
                onChange={(e) =>
                  setEditingTestimony({
                    ...editingTestimony,
                    body: e.target.value.split(/\n\s*\n/),
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingTestimony(null);
                  setIsAddingTestimony(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                {isAddingTestimony ? 'Add Testimony' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
