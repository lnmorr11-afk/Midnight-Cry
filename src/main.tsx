import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { DEFAULT_SITE_CONTENT } from './data/defaultSiteContent';
import { cacheMinistryArticlesOffline } from './utils/offlineTractsCache';

registerSW({
  immediate: true,
});

// Pre-warm offline cache with key ministry tracts and articles on startup
cacheMinistryArticlesOffline(DEFAULT_SITE_CONTENT.readPage.articles);

createRoot(document.getElementById('root')!).render(<App />);
