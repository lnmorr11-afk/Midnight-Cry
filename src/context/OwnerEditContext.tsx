import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { EXACT_PAGE_TEXTS } from '../data/siteData';
import { DEFAULT_SITE_CONTENT, SiteContent } from '../data/defaultSiteContent';

export type SiteTextsType = typeof EXACT_PAGE_TEXTS;

interface OwnerEditContextType {
  isOwnerMode: boolean;
  ownerToken: string | null;
  siteContent: SiteContent;
  siteTexts: SiteTextsType;
  updateText: (key: keyof SiteTextsType, value: string) => void;
  updateSiteContent: (updater: (prev: SiteContent) => SiteContent) => void;
  saveChanges: () => void;
  resetToDefault: () => void;
  unlockOwnerMode: (passcode: string) => Promise<boolean>;
  changePasscode: (
    currentPasscode: string,
    newPasscode: string
  ) => Promise<{ success: boolean; error?: string }>;
  hasCustomPasscode: boolean;
  exitOwnerMode: (saveBeforeExit?: boolean) => void;
  hasUnsavedChanges: boolean;
  exportContentJson: () => void;
  importContentJson: (rawJson: string) => { success: boolean; error?: string };
}

const CMS_STORAGE_KEY = 'voice_site_cms_data_v1';
const LEGACY_TEXTS_KEY = 'voice_site_custom_texts';
const LEGACY_PASSCODE_KEY = 'voice_site_owner_passcode';

const migrateLegacyAssetUrl = (
  url: string | undefined,
  legacyTokens: string | string[],
  replacement: string
): string => {
  const tokens = Array.isArray(legacyTokens) ? legacyTokens : [legacyTokens];
  if (!url || tokens.some((token) => url.includes(token))) return replacement;
  return url;
};

const deepMergeContent = (parsed: Partial<SiteContent>): SiteContent => {
  const mergedHeader = { ...DEFAULT_SITE_CONTENT.header, ...(parsed.header || {}) };
  mergedHeader.logoUrl = migrateLegacyAssetUrl(
    mergedHeader.logoUrl,
    [
      'voice_site_logo_1794488203143',
      'simple_cross_logo_1794557479811',
      'cross_hill_logo_1794557619466',
      'cross_hill_clean_logo_1794557679528',
    ],
    DEFAULT_SITE_CONTENT.header.logoUrl
  );

  const mergedHome = { ...DEFAULT_SITE_CONTENT.home, ...(parsed.home || {}) };
  mergedHome.cards = mergedHome.cards.map((card) => ({
    ...card,
    image: migrateLegacyAssetUrl(
      card.image,
      'watch_video_card_1794488177980',
      DEFAULT_SITE_CONTENT.watchPage.headerImage
    ),
  }));

  const mergedWatch = { ...DEFAULT_SITE_CONTENT.watchPage, ...(parsed.watchPage || {}) };
  mergedWatch.headerImage = migrateLegacyAssetUrl(
    mergedWatch.headerImage,
    'watch_video_card_1794488177980',
    DEFAULT_SITE_CONTENT.watchPage.headerImage
  );
  mergedWatch.videos = mergedWatch.videos.map((v) => ({
    ...v,
    thumbnail: migrateLegacyAssetUrl(
      v.thumbnail,
      'watch_video_card_1794488177980',
      DEFAULT_SITE_CONTENT.watchPage.headerImage
    ),
  }));

  const mergedTestimonies = {
    ...DEFAULT_SITE_CONTENT.testimoniesPage,
    ...(parsed.testimoniesPage || {}),
  };
  mergedTestimonies.headerImage = migrateLegacyAssetUrl(
    mergedTestimonies.headerImage,
    'watch_video_card_1794488177980',
    DEFAULT_SITE_CONTENT.testimoniesPage.headerImage
  );

  return {
    ...DEFAULT_SITE_CONTENT,
    ...parsed,
    siteTexts: { ...DEFAULT_SITE_CONTENT.siteTexts, ...(parsed.siteTexts || {}) },
    banner: { ...DEFAULT_SITE_CONTENT.banner, ...(parsed.banner || {}) },
    header: mergedHeader,
    home: mergedHome,
    dailyVerse: { ...DEFAULT_SITE_CONTENT.dailyVerse, ...(parsed.dailyVerse || {}) },
    aboutUs: { ...DEFAULT_SITE_CONTENT.aboutUs, ...(parsed.aboutUs || {}) },
    readPage: { ...DEFAULT_SITE_CONTENT.readPage, ...(parsed.readPage || {}) },
    hearPage: { ...DEFAULT_SITE_CONTENT.hearPage, ...(parsed.hearPage || {}) },
    watchPage: mergedWatch,
    testimoniesPage: mergedTestimonies,
    studyPlanPage: {
      ...DEFAULT_SITE_CONTENT.studyPlanPage,
      ...(parsed.studyPlanPage || {}),
      notificationEmail:
        parsed.studyPlanPage?.notificationEmail?.trim() ||
        DEFAULT_SITE_CONTENT.studyPlanPage.notificationEmail,
    },
    anyQuestionsPage: { ...DEFAULT_SITE_CONTENT.anyQuestionsPage, ...(parsed.anyQuestionsPage || {}) },
  };
};

const OwnerEditContext = createContext<OwnerEditContextType | null>(null);

interface OwnerEditProviderProps {
  children: React.ReactNode;
  onRequestLoginModal?: () => void;
}

export const OwnerEditProvider: React.FC<OwnerEditProviderProps> = ({
  children,
  onRequestLoginModal,
}) => {
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(false);
  const [hasCustomPasscode, setHasCustomPasscode] = useState<boolean>(false);
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const ownerTokenRef = useRef<string | null>(null);
  const migrationPromiseRef = useRef<Promise<void> | null>(null);

  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const savedCms = localStorage.getItem(CMS_STORAGE_KEY);
      if (savedCms) {
        return deepMergeContent(JSON.parse(savedCms));
      }
      const legacySaved = localStorage.getItem(LEGACY_TEXTS_KEY);
      if (legacySaved) {
        return deepMergeContent({
          siteTexts: { ...EXACT_PAGE_TEXTS, ...JSON.parse(legacySaved) },
        });
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_SITE_CONTENT;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Sync server password status, migrate any legacy browser-local custom passcode to server, and load shared CMS edits
  useEffect(() => {
    const initFromServer = async () => {
      try {
        const statusRes = await fetch('/api/owner/status');
        if (statusRes.ok) {
          const statusData = (await statusRes.json()) as {
            ok?: boolean;
            hasCustomPassword?: boolean;
          };
          const customActive = Boolean(statusData.hasCustomPassword);

          if (localStorage.getItem(LEGACY_PASSCODE_KEY) !== null) {
            localStorage.removeItem(LEGACY_PASSCODE_KEY);
          }

          setHasCustomPasscode(customActive);
        }
      } catch {
        // offline or unreachable
      }

      try {
        const contentRes = await fetch('/api/owner/content');
        if (contentRes.ok) {
          const contentData = (await contentRes.json()) as {
            ok?: boolean;
            content?: Partial<SiteContent> | null;
          };
          if (contentData.content) {
            const merged = deepMergeContent(contentData.content);
            setSiteContent(merged);
            try {
              localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(merged));
              localStorage.setItem(LEGACY_TEXTS_KEY, JSON.stringify(merged.siteTexts));
            } catch {
              // ignore quota errors
            }
          }
        }
      } catch {
        // offline or unreachable
      }
    };

    migrationPromiseRef.current = initFromServer();
  }, []);

  const persistContentToServer = useCallback(async (contentToSave: SiteContent) => {
    const token = ownerTokenRef.current;
    if (!token) return;
    try {
      await fetch('/api/owner/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: contentToSave }),
      });
    } catch (err) {
      console.error('Failed to sync content to server', err);
    }
  }, []);

  const saveChanges = useCallback(() => {
    try {
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(siteContent));
      localStorage.setItem(LEGACY_TEXTS_KEY, JSON.stringify(siteContent.siteTexts));
      setHasUnsavedChanges(false);
      void persistContentToServer(siteContent);
    } catch (err) {
      console.error('Failed to save content', err);
    }
  }, [siteContent, persistContentToServer]);

  // Keyboard shortcut Alt+E: exits if unlocked, or opens password modal if locked
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        if (isOwnerMode) {
          setIsOwnerMode(false);
        } else {
          onRequestLoginModal?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwnerMode, onRequestLoginModal]);

  const updateSiteContent = useCallback((updater: (prev: SiteContent) => SiteContent) => {
    setSiteContent((prev) => updater(prev));
    setHasUnsavedChanges(true);
  }, []);

  const updateText = useCallback((key: keyof SiteTextsType, value: string) => {
    setSiteContent((prev) => ({
      ...prev,
      siteTexts: { ...prev.siteTexts, [key]: value },
    }));
    setHasUnsavedChanges(true);
  }, []);

  const resetToDefault = useCallback(() => {
    localStorage.removeItem(CMS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TEXTS_KEY);
    setSiteContent(DEFAULT_SITE_CONTENT);
    setHasUnsavedChanges(false);
    const token = ownerTokenRef.current;
    if (token) {
      void fetch('/api/owner/content', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, []);

  const unlockOwnerMode = async (enteredPasscode: string): Promise<boolean> => {
    if (migrationPromiseRef.current) {
      await migrationPromiseRef.current.catch(() => {});
    }
    try {
      const res = await fetch('/api/owner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: enteredPasscode }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { ok?: boolean; token?: string };
      if (data.ok && data.token) {
        ownerTokenRef.current = data.token;
        setOwnerToken(data.token);
        setIsOwnerMode(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const changePasscode = async (
    currentPasscode: string,
    newPasscode: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanNew = newPasscode.trim();
    if (!cleanNew) {
      return { success: false, error: 'New password cannot be empty.' };
    }
    try {
      const res = await fetch('/api/owner/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPasscode,
          newPassword: cleanNew,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        token?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return { success: false, error: data.error || 'Could not update password.' };
      }
      if (data.token) {
        ownerTokenRef.current = data.token;
        setOwnerToken(data.token);
      }
      localStorage.removeItem(LEGACY_PASSCODE_KEY);
      setHasCustomPasscode(true);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to reach server to update password.' };
    }
  };

  const exitOwnerMode = (saveBeforeExit?: boolean) => {
    if (saveBeforeExit) {
      saveChanges();
    }
    ownerTokenRef.current = null;
    setOwnerToken(null);
    setIsOwnerMode(false);
  };

  const exportContentJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(siteContent, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'voice-site-full-backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importContentJson = (rawJson: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid backup file format.' };
      }
      const normalized =
        'siteTexts' in parsed
          ? deepMergeContent(parsed as Partial<SiteContent>)
          : deepMergeContent({ siteTexts: { ...EXACT_PAGE_TEXTS, ...parsed } });
      setSiteContent(normalized);
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem(LEGACY_TEXTS_KEY, JSON.stringify(normalized.siteTexts));
      setHasUnsavedChanges(false);
      void persistContentToServer(normalized);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not parse JSON backup file.' };
    }
  };

  return (
    <OwnerEditContext.Provider
      value={{
        isOwnerMode,
        ownerToken,
        siteContent,
        siteTexts: siteContent.siteTexts,
        updateText,
        updateSiteContent,
        saveChanges,
        resetToDefault,
        unlockOwnerMode,
        changePasscode,
        hasCustomPasscode,
        exitOwnerMode,
        hasUnsavedChanges,
        exportContentJson,
        importContentJson,
      }}
    >
      {children}
    </OwnerEditContext.Provider>
  );
};

export const useOwnerEdit = () => {
  const ctx = useContext(OwnerEditContext);
  if (!ctx) {
    throw new Error('useOwnerEdit must be used within an OwnerEditProvider');
  }
  return ctx;
};
