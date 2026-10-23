import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppShell } from '@/components/AppShell';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { InstitutionHome } from '@/pages/InstitutionHome';
import { SubmitApplication } from '@/pages/SubmitApplication';
import { ApplicationDetail } from '@/pages/ApplicationDetail';
import { DocumentReview } from '@/pages/DocumentReview';
import { Rules } from '@/pages/Rules';
import { Audit } from '@/pages/Audit';
import { Eval } from '@/pages/Eval';
import { NotFound } from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function HomeRoute() {
  const { isOfficer } = useRole();
  return isOfficer ? <Dashboard /> : <Navigate to="/applications" replace />;
}

function ApplicationsRoute() {
  const { isOfficer } = useRole();
  return isOfficer ? <Dashboard /> : <InstitutionHome />;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <RoleProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/applications" element={<ApplicationsRoute />} />
                  <Route path="/applications/new" element={<SubmitApplication />} />
                  <Route path="/applications/:id" element={<ApplicationDetail />} />
                  <Route path="/documents/:id" element={<DocumentReview />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/audit" element={<Audit />} />
                  <Route path="/eval" element={<Eval />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </RoleProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
