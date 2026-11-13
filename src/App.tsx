import React, { useState, useEffect } from 'react';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { HeaderNav } from './components/HeaderNav';
import { HomePage } from './components/pages/HomePage';
import { ReadPage } from './components/pages/ReadPage';
import { HearPage } from './components/pages/HearPage';
import { WatchPage } from './components/pages/WatchPage';
import { StudyPlanPage } from './components/pages/StudyPlanPage';
import { AnyQuestionsPage } from './components/pages/AnyQuestionsPage';
import { TestimoniesPage } from './components/pages/TestimoniesPage';
import { SearchModal } from './components/SearchModal';
import { AboutUsModal } from './components/AboutUsModal';
import { GoogleSitesBadge } from './components/GoogleSitesBadge';
import { OwnerEditProvider } from './context/OwnerEditContext';
import { OwnerToolbar } from './components/OwnerToolbar';
import { OwnerLoginModal } from './components/OwnerLoginModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useOwnerEdit } from './context/OwnerEditContext';
import { cacheMinistryArticlesOffline } from './utils/offlineTractsCache';

const OfflineContentSync: React.FC = () => {
  const { siteContent } = useOwnerEdit();
  useEffect(() => {
    cacheMinistryArticlesOffline(siteContent.readPage.articles);
  }, [siteContent.readPage.articles]);
  return null;
};

const getInitialRouteState = (): { path: string; itemId?: string } => {
  if (typeof window === 'undefined') return { path: '/home' };
  const params = new URLSearchParams(window.location.search);
  const queryPage = params.get('page');
  const queryItem = params.get('item') || undefined;
  if (queryPage) {
    return {
      path: queryPage.startsWith('/') ? queryPage : `/${queryPage}`,
      itemId: queryItem,
    };
  }
  const pathname = window.location.pathname;
  if (pathname && pathname !== '/') {
    return { path: pathname, itemId: queryItem };
  }
  return { path: '/home', itemId: queryItem };
};

export default function App() {
  const initialRoute = getInitialRouteState();
  const [currentPath, setCurrentPath] = useState<string>(initialRoute.path);
  const [deepLinkItemId, setDeepLinkItemId] = useState<string | undefined>(initialRoute.itemId);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isOwnerLoginOpen, setIsOwnerLoginOpen] = useState(false);

  // Sync with browser URL / hash if user navigates
  useEffect(() => {
    const handlePopState = () => {
      const next = getInitialRouteState();
      setCurrentPath(next.path);
      setDeepLinkItemId(next.itemId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setDeepLinkItemId(undefined);
    setCurrentPath(path);
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    if (currentPath.startsWith('/read')) {
      return (
        <ReadPage
          initialSubCategory={currentPath.includes('tracts') ? 'TRACTS' : undefined}
          initialItemId={deepLinkItemId}
          onNavigateHome={() => navigateTo('/home')}
        />
      );
    }
    if (currentPath.startsWith('/hear')) {
      return <HearPage initialItemId={deepLinkItemId} onNavigateHome={() => navigateTo('/home')} />;
    }
    if (currentPath.startsWith('/watch')) {
      return (
        <WatchPage
          initialItemId={deepLinkItemId}
          onNavigateHome={() => navigateTo('/home')}
          onNavigateToTestimonies={() => navigateTo('/testimonies')}
        />
      );
    }
    if (currentPath.startsWith('/study-plan')) {
      return <StudyPlanPage onNavigateHome={() => navigateTo('/home')} />;
    }
    if (currentPath.startsWith('/any-questions')) {
      return <AnyQuestionsPage onNavigateHome={() => navigateTo('/home')} />;
    }
    if (currentPath.startsWith('/testimonies')) {
      return (
        <TestimoniesPage
          initialItemId={deepLinkItemId}
          onNavigateHome={() => navigateTo('/home')}
          onNavigateToWatch={() => navigateTo('/watch')}
        />
      );
    }

    // Default: Home Page
    return (
      <HomePage
        onNavigate={navigateTo}
        onOpenAboutUs={() => setIsAboutUsOpen(true)}
        onOpenOwnerLogin={() => setIsOwnerLoginOpen(true)}
      />
    );
  };

  return (
    <OwnerEditProvider onRequestLoginModal={() => setIsOwnerLoginOpen(true)}>
      <div className="min-h-screen flex flex-col bg-white text-gray-900 font-roboto antialiased selection:bg-amber-100 selection:text-amber-900">
        {/* 1. Gold Announcement Banner at very top */}
        <AnnouncementBanner
          onNavigate={navigateTo}
          onAnyQuestionsClick={() => navigateTo('/any-questions')}
        />

        {/* 2. Main Sticky Navigation Header */}
        <HeaderNav
          currentPath={currentPath}
          onNavigate={navigateTo}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* 3. Page Body */}
        <div className="flex-1">
          {renderCurrentView()}
        </div>

        {/* 4. Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={(path) => navigateTo(path)}
        />

        {/* 5. About Us Modal */}
        <AboutUsModal
          isOpen={isAboutUsOpen}
          onClose={() => setIsAboutUsOpen(false)}
        />

        {/* 6. Google Sites Floating Badge in bottom right */}
        <GoogleSitesBadge onOpenOwnerLogin={() => setIsOwnerLoginOpen(true)} />

        {/* 7. Owner Edit Controls */}
        <OwnerToolbar />
        <OwnerLoginModal
          isOpen={isOwnerLoginOpen}
          onClose={() => setIsOwnerLoginOpen(false)}
        />

        {/* 8. Offline State & Background Tract Cache Sync */}
        <OfflineContentSync />
        <OfflineIndicator />
      </div>
    </OwnerEditProvider>
  );
}
