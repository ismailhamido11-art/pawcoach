import { Suspense, lazy } from 'react'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { HomeCacheProvider } from '@/lib/HomeCacheContext';
import { DogProvider } from '@/lib/DogContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PawLoader from '@/components/PawLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import SkeletonPage from '@/components/ui/SkeletonPage';
import { Toaster } from 'sonner';

// Public pages — loaded outside auth wrapper
const DogPublicProfile = lazy(() => import('./pages/DogPublicProfile'));
const VetDogView = lazy(() => import('./pages/VetDogView'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>
    <Suspense fallback={<SkeletonPage variant="list" currentPage={currentPageName} />}>{children}</Suspense>
  </Layout>
  : <Suspense fallback={<SkeletonPage variant="list" currentPage={currentPageName} />}>{children}</Suspense>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PawLoader text="Connexion en cours..." />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app — excludes public routes handled at Router level
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <ErrorBoundary>
            <MainPage />
          </ErrorBoundary>
        </LayoutWrapper>
      } />
      {Object.entries(Pages)
        .filter(([path]) => path !== 'DogPublicProfile' && path !== 'VetDogView')
        .map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <ErrorBoundary>
                  <Page />
                </ErrorBoundary>
              </LayoutWrapper>
            }
          />
        ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm">
      Aller au contenu principal
    </a>
    <Toaster position="bottom-center" richColors />
    <Router>
      <Routes>
        {/* Public routes — no auth required */}
        <Route path="/DogPublicProfile" element={
          <ErrorBoundary>
            <Suspense fallback={<SkeletonPage variant="detail" currentPage="DogPublicProfile" />}>
              <DogPublicProfile />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/VetDogView" element={
          <ErrorBoundary>
            <Suspense fallback={<SkeletonPage variant="detail" currentPage="VetDogView" />}>
              <VetDogView />
            </Suspense>
          </ErrorBoundary>
        } />
        {/* All other routes go through auth */}
        <Route path="/*" element={
          <AuthProvider>
            <DogProvider>
              <HomeCacheProvider>
                <AuthenticatedApp />
              </HomeCacheProvider>
            </DogProvider>
          </AuthProvider>
        } />
      </Routes>
    </Router>
    </>
  )
}

export default App
