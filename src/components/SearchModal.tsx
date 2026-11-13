import React, { useState } from 'react';
import { Search, X, BookOpen, Music, Video, FileText, ArrowRight } from 'lucide-react';
import { NavItem } from '../data/siteData';
import { useOwnerEdit } from '../context/OwnerEditContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (path: string) => void;
}

interface FlattenedItem {
  title: string;
  path: string;
  category: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const { siteContent } = useOwnerEdit();

  if (!isOpen) return null;

  const flatten = (items: NavItem[], parentCat = 'General'): FlattenedItem[] => {
    let result: FlattenedItem[] = [];
    for (const item of items) {
      if (!item.external && item.path) {
        result.push({
          title: item.title,
          path: item.path,
          category: parentCat,
        });
      }
      if (item.children) {
        result = result.concat(flatten(item.children, item.title));
      }
    }
    return result;
  };

  const dynamicItems: FlattenedItem[] = [
    ...flatten(siteContent.header.navItems),
    ...siteContent.readPage.articles.map((a) => ({
      title: a.title,
      path: `/read#${a.id}`,
      category: `Read • ${a.category}`,
    })),
    ...siteContent.hearPage.tracks.map((t) => ({
      title: t.title,
      path: '/hear',
      category: `Hear • ${t.type}`,
    })),
    ...siteContent.watchPage.videos.map((v) => ({
      title: v.title,
      path: '/watch',
      category: `Watch • ${v.category}`,
    })),
    ...siteContent.testimoniesPage.testimonies.map((t) => ({
      title: `${t.name} — ${t.title}`,
      path: '/testimonies',
      category: `Testimonies • ${t.type}`,
    })),
  ];

  const uniqueItems = dynamicItems.filter(
    (item, idx, self) =>
      self.findIndex((other) => other.title.toLowerCase() === item.title.toLowerCase()) === idx
  );

  const filtered = query.trim()
    ? uniqueItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : uniqueItems.slice(0, 10);

  const getIcon = (cat: string) => {
    if (cat.includes('Watch') || cat.includes('Video'))
      return <Video className="w-4 h-4 text-rose-500" />;
    if (cat.includes('Hear') || cat.includes('Song') || cat.includes('Sermon'))
      return <Music className="w-4 h-4 text-emerald-500" />;
    if (cat.includes('Tract') || cat.includes('Blog') || cat.includes('Read'))
      return <BookOpen className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracts, sermons, documents, scriptures..."
            className="w-full bg-transparent border-none text-base focus:outline-hidden text-gray-900 placeholder-gray-400 font-google-sans"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 rounded transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-roboto text-sm">
              No results found for &ldquo;{query}&rdquo;. Try searching for &ldquo;salvation&rdquo;, &ldquo;cross&rdquo;, or &ldquo;tracts&rdquo;.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-2xs font-semibold text-gray-400 uppercase tracking-wider font-google-sans">
                {query ? 'Search Results' : 'Suggested Resources'}
              </div>
              {filtered.map((item, idx) => (
                <button
                  key={`${item.path}-${idx}`}
                  onClick={() => {
                    onSelectResult(item.path.split('#')[0]);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-amber-50/70 group transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span className="p-2 bg-gray-100 rounded-md group-hover:bg-amber-100/60 transition-colors">
                      {getIcon(item.category)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-amber-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-amber-700" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
