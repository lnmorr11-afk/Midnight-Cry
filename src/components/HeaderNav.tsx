import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Settings2,
} from 'lucide-react';
import { NavItem } from '../data/siteData';
import { useOwnerEdit } from '../context/OwnerEditContext';
import { EditableText } from './EditableText';
import { ImageUploadField } from './ImageUploadField';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSearch: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ currentPath, onNavigate, onOpenSearch }) => {
  const { isOwnerMode, siteContent, updateSiteContent } = useOwnerEdit();
  const { brandTitle, logoUrl, navItems } = siteContent.header;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<Record<string, boolean>>({});
  const [isMenuEditorOpen, setIsMenuEditorOpen] = useState(false);
  const [newNavTitle, setNewNavTitle] = useState('');
  const [newNavPath, setNewNavPath] = useState('/read');
  const [newNavExternal, setNewNavExternal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setActiveSubDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (item: NavItem, e?: React.MouseEvent) => {
    if (item.external) {
      return;
    }
    e?.preventDefault();
    setActiveDropdown(null);
    setActiveSubDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(item.path);
  };

  const toggleMobileExpand = (id: string) => {
    setExpandedMobile((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateNavItem = (id: string, patch: Partial<NavItem>) => {
    updateSiteContent((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        navItems: prev.header.navItems.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }));
  };

  const removeNavItem = (id: string) => {
    updateSiteContent((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        navItems: prev.header.navItems.filter((item) => item.id !== id),
      },
    }));
  };

  const handleAddNavItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNavTitle.trim() || !newNavPath.trim()) return;
    const item: NavItem = {
      id: `custom-nav-${Date.now()}`,
      title: newNavTitle.trim(),
      path: newNavPath.trim(),
      external: newNavExternal,
    };
    updateSiteContent((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        navItems: [...prev.header.navItems, item],
      },
    }));
    setNewNavTitle('');
    setNewNavPath('/read');
    setNewNavExternal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => onNavigate('/home')}
                className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-[#202020] shadow-xs border border-amber-600/30 flex items-center justify-center focus:outline-hidden group cursor-pointer hover:scale-105 transition-transform"
                aria-label={brandTitle}
              >
                <img
                  src={logoUrl}
                  alt={brandTitle}
                  className={`w-full h-full object-cover object-center ${
                    logoUrl === '/assets/aistudio/image_ffef0b8e.png'
                      ? 'scale-[1.18] translate-y-[3%]'
                      : ''
                  }`}
                />
              </button>
              <div
                onClick={() => {
                  if (!isOwnerMode) onNavigate('/home');
                }}
                className={`flex items-center whitespace-nowrap ${isOwnerMode ? '' : 'cursor-pointer'}`}
              >
                <EditableText
                  inline
                  value={brandTitle}
                  onChange={(val) =>
                    updateSiteContent((prev) => ({
                      ...prev,
                      header: { ...prev.header, brandTitle: val },
                    }))
                  }
                  as="span"
                  className="font-google-sans text-base sm:text-lg xl:text-xl font-normal text-gray-900 hover:text-amber-800 transition-colors tracking-tight whitespace-nowrap"
                  label="Site Brand Title"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav ref={dropdownRef} className="hidden lg:flex items-center space-x-1 font-google-sans text-sm">
              {navItems.map((item) => {
                const isSelected =
                  item.path === '/home'
                    ? currentPath === '/home' || currentPath === '/'
                    : currentPath.startsWith(item.path);
                const hasChildren = item.children && item.children.length > 0;
                const isDropdownOpen = activeDropdown === item.id;

                if (item.external) {
                  return (
                    <a
                      key={item.id}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 rounded-md text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-60" />
                    </a>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="relative group"
                    onMouseEnter={() => {
                      if (hasChildren) setActiveDropdown(item.id);
                    }}
                    onMouseLeave={() => {
                      if (hasChildren) {
                        setActiveDropdown(null);
                        setActiveSubDropdown(null);
                      }
                    }}
                  >
                    <button
                      onClick={(e) => handleLinkClick(item, e)}
                      className={`inline-flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-gray-950 font-medium border-b-2 border-black rounded-b-none'
                          : 'text-gray-700 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      <span>{item.title}</span>
                      {hasChildren && (
                        <ChevronDown
                          className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                            isDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Level 2 Dropdown */}
                    {hasChildren && isDropdownOpen && (
                      <div className="absolute left-0 mt-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        {item.children!.map((child) => {
                          const hasGrandChildren = child.children && child.children.length > 0;
                          const isSubOpen = activeSubDropdown === child.id;

                          return (
                            <div
                              key={child.id}
                              className="relative"
                              onMouseEnter={() => {
                                if (hasGrandChildren) setActiveSubDropdown(child.id);
                              }}
                              onMouseLeave={() => {
                                if (hasGrandChildren) setActiveSubDropdown(null);
                              }}
                            >
                              <button
                                onClick={(e) => handleLinkClick(child, e)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span className="truncate">{child.title}</span>
                                {hasGrandChildren && <ChevronRight className="w-4 h-4 ml-2 text-gray-400" />}
                              </button>

                              {/* Level 3 Dropdown */}
                              {hasGrandChildren && isSubOpen && (
                                <div className="absolute left-full top-0 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 ml-0.5 max-h-96 overflow-y-auto">
                                  {child.children!.map((subChild) => {
                                    const hasGreatGrandChildren =
                                      subChild.children && subChild.children.length > 0;
                                    return (
                                      <div key={subChild.id} className="group/sub">
                                        <button
                                          onClick={(e) => handleLinkClick(subChild, e)}
                                          className="w-full text-left px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between transition-colors cursor-pointer"
                                        >
                                          <span className="truncate">{subChild.title}</span>
                                          {hasGreatGrandChildren && (
                                            <ChevronRight className="w-3.5 h-3.5 ml-1 text-gray-400" />
                                          )}
                                        </button>
                                        {hasGreatGrandChildren && (
                                          <div className="pl-4 py-1 bg-gray-50 border-l-2 border-amber-300">
                                            {subChild.children!.map((ggChild) => (
                                              <button
                                                key={ggChild.id}
                                                onClick={(e) => handleLinkClick(ggChild, e)}
                                                className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:text-amber-900 hover:bg-amber-100/50 block truncate transition-colors cursor-pointer"
                                              >
                                                {ggChild.title}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {isOwnerMode && (
                <button
                  onClick={() => setIsMenuEditorOpen(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 ml-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium cursor-pointer"
                  title="Edit header logo and menu links"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Edit Menu</span>
                </button>
              )}

              {/* PWA Install App Button */}
              <div className="ml-1">
                <PWAInstallButton />
              </div>

              {/* Search Icon Button */}
              <button
                onClick={onOpenSearch}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer ml-1"
                title="Search site resources"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </nav>

            {/* Mobile Right Controls */}
            <div className="flex lg:hidden items-center space-x-2">
              <PWAInstallButton />
              {isOwnerMode && (
                <button
                  onClick={() => setIsMenuEditorOpen(true)}
                  className="px-2 py-1 rounded bg-amber-100 text-amber-900 text-xs font-google-sans font-medium cursor-pointer"
                >
                  Menu
                </button>
              )}
              <button
                onClick={onOpenSearch}
                className="p-2 text-gray-600 hover:text-black rounded-md cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-black rounded-md focus:outline-hidden cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-white z-50 overflow-y-auto border-t border-gray-200 p-4">
            <div className="space-y-1 pb-16">
              {navItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = !!expandedMobile[item.id];
                const isSelected =
                  item.path === '/home'
                    ? currentPath === '/home' || currentPath === '/'
                    : currentPath.startsWith(item.path);

                if (item.external) {
                  return (
                    <a
                      key={item.id}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2.5 rounded-md text-base text-gray-800 hover:bg-gray-100"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  );
                }

                return (
                  <div key={item.id} className="border-b border-gray-100 pb-1">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => handleLinkClick(item, e)}
                        className={`flex-1 text-left px-3 py-2.5 rounded-md text-base transition-colors ${
                          isSelected ? 'font-medium text-amber-900 bg-amber-50' : 'text-gray-800 hover:bg-gray-100'
                        }`}
                      >
                        {item.title}
                      </button>
                      {hasChildren && (
                        <button
                          onClick={() => toggleMobileExpand(item.id)}
                          className="p-2 text-gray-500 hover:text-black"
                          aria-label={`Expand ${item.title}`}
                        >
                          <ChevronDown
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Mobile Level 2 */}
                    {hasChildren && isExpanded && (
                      <div className="pl-4 space-y-1 mt-1 border-l-2 border-amber-300 ml-2">
                        {item.children!.map((child) => {
                          const hasGrandChildren = child.children && child.children.length > 0;
                          const isSubExpanded = !!expandedMobile[child.id];

                          return (
                            <div key={child.id}>
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={(e) => handleLinkClick(child, e)}
                                  className="flex-1 text-left px-3 py-2 text-sm text-gray-700 hover:text-black"
                                >
                                  {child.title}
                                </button>
                                {hasGrandChildren && (
                                  <button
                                    onClick={() => toggleMobileExpand(child.id)}
                                    className="p-1.5 text-gray-400"
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform ${
                                        isSubExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>

                              {/* Mobile Level 3 */}
                              {hasGrandChildren && isSubExpanded && (
                                <div className="pl-4 space-y-1 border-l border-gray-200 ml-2">
                                  {child.children!.map((sub) => (
                                    <button
                                      key={sub.id}
                                      onClick={(e) => handleLinkClick(sub, e)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:text-black block"
                                    >
                                      {sub.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Owner Header & Navigation Menu Editor Modal */}
      {isOwnerMode && isMenuEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-google-sans text-lg font-semibold text-gray-900">
                Edit Header &amp; Navigation Menu
              </h3>
              <button
                onClick={() => setIsMenuEditorOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logo Image */}
            <ImageUploadField
              label="Site Logo Image"
              value={logoUrl}
              onChange={(val) =>
                updateSiteContent((prev) => ({
                  ...prev,
                  header: { ...prev.header, logoUrl: val },
                }))
              }
            />

            {/* Existing Top-level Links */}
            <div className="space-y-2">
              <label className="block text-xs font-google-sans font-semibold text-gray-700 uppercase">
                Navigation Items
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {navItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateNavItem(item.id, { title: e.target.value })}
                      className="flex-1 min-w-[120px] px-2.5 py-1 text-xs border border-gray-300 rounded bg-white"
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      value={item.path}
                      onChange={(e) => updateNavItem(item.id, { path: e.target.value })}
                      className="flex-1 min-w-[120px] px-2.5 py-1 text-xs border border-gray-300 rounded bg-white font-mono"
                      placeholder="/path or https://..."
                    />
                    <label className="inline-flex items-center space-x-1 text-2xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!item.external}
                        onChange={(e) => updateNavItem(item.id, { external: e.target.checked })}
                      />
                      <span>Ext</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeNavItem(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      title="Remove menu link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Link */}
            <form onSubmit={handleAddNavItem} className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <p className="text-xs font-google-sans font-semibold text-amber-950">Add New Menu Item</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newNavTitle}
                  onChange={(e) => setNewNavTitle(e.target.value)}
                  placeholder="Menu Label (e.g. Events)"
                  className="px-2.5 py-1.5 text-xs border border-amber-300 rounded bg-white"
                />
                <input
                  type="text"
                  required
                  value={newNavPath}
                  onChange={(e) => setNewNavPath(e.target.value)}
                  placeholder="Path (/read, /hear, or https://...)"
                  className="px-2.5 py-1.5 text-xs border border-amber-300 rounded bg-white font-mono"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center space-x-1.5 text-xs text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNavExternal}
                    onChange={(e) => setNewNavExternal(e.target.checked)}
                  />
                  <span>External website link (opens new tab)</span>
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              </div>
            </form>

            <div className="flex justify-end">
              <button
                onClick={() => setIsMenuEditorOpen(false)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-google-sans font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
