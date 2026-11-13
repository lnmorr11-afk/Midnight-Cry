import React, { useState } from 'react';
import { ChevronDown, Link2, Check, Lock, Plus, Trash2, Edit3, X, Image as ImageIcon } from 'lucide-react';
import { HomeCardItem } from '../../data/defaultSiteContent';
import { useOwnerEdit } from '../../context/OwnerEditContext';
import { DailyVerse } from '../DailyVerse';
import { EditableText } from '../EditableText';
import { ImageUploadField } from '../ImageUploadField';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onOpenAboutUs: () => void;
  onOpenOwnerLogin?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenAboutUs,
  onOpenOwnerLogin,
}) => {
  const { isOwnerMode, siteContent, updateSiteContent, updateText } = useOwnerEdit();
  const [copiedHeading, setCopiedHeading] = useState<string | null>(null);
  const [editingHeroImage, setEditingHeroImage] = useState(false);
  const [editingCard, setEditingCard] = useState<HomeCardItem | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);

  const { heroImage, cards, footerBrandLabel } = siteContent.home;

  const handleCopyLink = (headingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${headingId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedHeading(headingId);
      setTimeout(() => setCopiedHeading(null), 2000);
    });
  };

  const scrollToContent = () => {
    const el = document.getElementById('featured-sections');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editingCard.title.trim()) return;
    if (isAddingCard) {
      updateSiteContent((prev) => ({
        ...prev,
        home: { ...prev.home, cards: [...prev.home.cards, editingCard] },
      }));
    } else {
      updateSiteContent((prev) => ({
        ...prev,
        home: {
          ...prev.home,
          cards: prev.home.cards.map((c) => (c.id === editingCard.id ? editingCard : c)),
        },
      }));
    }
    setEditingCard(null);
    setIsAddingCard(false);
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSiteContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        cards: prev.home.cards.filter((c) => c.id !== id),
      },
    }));
  };

  const openAddCard = () => {
    setIsAddingCard(true);
    setEditingCard({
      id: `card-${Date.now()}`,
      title: 'New Section',
      path: '/read',
      image: cards[0]?.image || heroImage,
      alt: 'Ministry resource section',
    });
  };

  return (
    <div className="w-full bg-white">
      {/* SECTION 0: Hero Banner */}
      <section
        id="h.INITIAL_GRID.v78fyy3212yg"
        className="relative min-h-[380px] md:min-h-[460px] lg:min-h-[520px] flex items-center justify-center bg-gray-900 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat transition-transform duration-1000 scale-100"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />

        {isOwnerMode && (
          <button
            onClick={() => setEditingHeroImage(true)}
            className="absolute top-4 right-4 z-20 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-amber-300 border border-amber-400/50 text-xs font-google-sans cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Change Banner Image</span>
          </button>
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-16">
          <h1 id="h.9maaxntbsmt5" dir="ltr">
            <EditableText
              fieldKey="heroTitle"
              as="span"
              className="font-garamond text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-white tracking-tight drop-shadow-md select-none block text-center"
            />
          </h1>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={scrollToContent}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white flex items-center justify-center transition-all hover:scale-110 focus:outline-hidden cursor-pointer"
            aria-label="Scroll down"
            title="Scroll down"
          >
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </button>
        </div>
      </section>

      {/* SECTION 1: Featured Cards */}
      <section
        id="featured-sections"
        className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-100"
      >
        {isOwnerMode && (
          <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <span className="text-xs font-google-sans text-amber-950 font-medium">
              Home Feature Cards ({cards.length})
            </span>
            <button
              onClick={openAddCard}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col group relative">
              <div
                onClick={() => {
                  if (!isOwnerMode) onNavigate(card.path);
                }}
                className="overflow-hidden rounded-lg bg-gray-100 shadow-sm cursor-pointer aspect-4/3 relative"
              >
                <img
                  src={card.image}
                  alt={card.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                {isOwnerMode && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingCard(false);
                        setEditingCard(card);
                      }}
                      className="p-1.5 rounded-md bg-white/95 hover:bg-amber-100 text-amber-900 shadow-md cursor-pointer"
                      title="Edit card image & link"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      className="p-1.5 rounded-md bg-white/95 hover:bg-red-100 text-red-600 shadow-md cursor-pointer"
                      title="Remove card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <h2
                  id={`${card.id}_l`}
                  dir="ltr"
                  className="font-google-sans text-xl md:text-2xl font-normal text-gray-900 inline-flex items-center justify-center relative group/heading cursor-pointer"
                  onClick={() => onNavigate(card.path)}
                >
                  <EditableText
                    inline
                    value={card.title}
                    onChange={(val) =>
                      updateSiteContent((prev) => ({
                        ...prev,
                        home: {
                          ...prev.home,
                          cards: prev.home.cards.map((c) =>
                            c.id === card.id ? { ...c, title: val } : c
                          ),
                        },
                      }))
                    }
                    as="span"
                    className="hover:text-amber-800 transition-colors"
                    label={`Card "${card.title}"`}
                  />
                  <button
                    onClick={(e) => handleCopyLink(card.id, e)}
                    className="opacity-0 group-hover/heading:opacity-100 ml-2 p-1 text-gray-400 hover:text-black transition-opacity rounded"
                    title="Copy heading link"
                    aria-label={`Copy link to ${card.title}`}
                  >
                    {copiedHeading === card.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </button>
                </h2>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DAILY SCRIPTURE: Bible Gateway KJV Only */}
      <DailyVerse />

      {/* SECTION 2: My Reader Letter */}
      <section
        id="h.2e447594cdd2f851_23"
        className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"
      >
        <div className="space-y-6 text-gray-800 font-roboto text-base md:text-lg leading-relaxed">
          <div dir="ltr">
            <EditableText
              fieldKey="readerGreeting"
              as="p"
              className="font-google-sans font-medium text-xl md:text-2xl text-gray-900 tracking-tight"
            />
          </div>

          <div dir="ltr">
            <EditableText
              fieldKey="readerParagraph1"
              as="p"
              className="text-gray-800 leading-relaxed text-justify sm:text-left"
            />
          </div>

          <div dir="ltr">
            <EditableText
              fieldKey="readerParagraph2"
              as="p"
              className="text-gray-800 leading-relaxed text-justify sm:text-left"
            />
          </div>

          <div className="py-2">
            <EditableText
              fieldKey="scriptureQuote"
              as="blockquote"
              className="font-garamond italic text-lg md:text-xl text-gray-900 pl-4 border-l-2 border-amber-500/60 block"
            />
          </div>

          <div dir="ltr">
            <EditableText
              fieldKey="thankYou"
              as="p"
              className="text-gray-900 font-medium"
            />
          </div>

          {/* About Us Button */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            {isOwnerMode ? (
              <div className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white text-sm md:text-base font-google-sans font-medium rounded-md shadow-xs">
                <EditableText
                  inline
                  value={siteContent.siteTexts.aboutUsButton}
                  onChange={(val) => updateText('aboutUsButton', val)}
                  as="span"
                  label="About Us Button"
                />
              </div>
            ) : (
              <button
                onClick={onOpenAboutUs}
                className="inline-flex items-center px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm md:text-base font-google-sans font-medium rounded-md shadow-xs hover:shadow-md transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                aria-label="About Us"
              >
                <span>{siteContent.siteTexts.aboutUsButton}</span>
              </button>
            )}
            {isOwnerMode && (
              <button
                onClick={onOpenAboutUs}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-google-sans font-medium rounded-md cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit About Us Popup</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: Footer */}
      <footer className="w-full border-t border-gray-200/60 py-8 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <small id="h.xmxbhqap3y95" dir="ltr" className="block text-gray-900">
            <EditableText
              fieldKey="footerText"
              as="span"
              className="inline-block"
              style={{ color: '#1c1c1c' }}
            />
          </small>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenOwnerLogin}
              className="inline-flex items-center space-x-1 text-gray-400 hover:text-amber-800 transition-colors cursor-pointer text-2xs font-google-sans"
              title="Owner Edit Mode"
            >
              <Lock className="w-3 h-3" />
              <span>Owner Edit</span>
            </button>
            <EditableText
              inline
              value={footerBrandLabel}
              onChange={(val) =>
                updateSiteContent((prev) => ({
                  ...prev,
                  home: { ...prev.home, footerBrandLabel: val },
                }))
              }
              as="span"
              className="text-gray-400 font-google-sans text-xs"
              label="Footer Label"
            />
          </div>
        </div>
      </footer>

      {/* Hero Image Modal */}
      {isOwnerMode && editingHeroImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-google-sans text-base font-semibold text-gray-900">
                Change Hero Banner Image
              </h3>
              <button
                onClick={() => setEditingHeroImage(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ImageUploadField
              label="Banner Image URL or File"
              value={heroImage}
              onChange={(val) =>
                updateSiteContent((prev) => ({
                  ...prev,
                  home: { ...prev.home, heroImage: val },
                }))
              }
            />
            <div className="flex justify-end">
              <button
                onClick={() => setEditingHeroImage(false)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Add / Edit Modal */}
      {isOwnerMode && editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveCard}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-google-sans text-base font-semibold text-gray-900">
                {isAddingCard ? 'Add Feature Card' : 'Edit Feature Card'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingCard(null);
                  setIsAddingCard(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Card Title
              </label>
              <input
                type="text"
                required
                value={editingCard.title}
                onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Destination Page Path
              </label>
              <select
                value={editingCard.path}
                onChange={(e) => setEditingCard({ ...editingCard, path: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="/read">Read Page (/read)</option>
                <option value="/hear">Hear Page (/hear)</option>
                <option value="/watch">Watch Page (/watch)</option>
                <option value="/testimonies">Testimonies Page (/testimonies)</option>
                <option value="/study-plan">Study Plan Page (/study-plan)</option>
                <option value="/any-questions">Any Questions Page (/any-questions)</option>
              </select>
            </div>

            <ImageUploadField
              label="Card Image URL or Upload"
              value={editingCard.image}
              onChange={(val) => setEditingCard({ ...editingCard, image: val })}
            />

            <div>
              <label className="block text-xs font-google-sans font-medium text-gray-700 mb-1">
                Image Description (Alt Text)
              </label>
              <input
                type="text"
                value={editingCard.alt}
                onChange={(e) => setEditingCard({ ...editingCard, alt: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingCard(null);
                  setIsAddingCard(false);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                {isAddingCard ? 'Add Card' : 'Save Card'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
