import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectImportPage } from './pages/ProjectImportPage';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AdminPage } from './pages/AdminPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { SecuritySettingsPage } from './pages/SecuritySettingsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { DomainsPage } from './pages/DomainsPage';
import { GoogleLoginSimulationPage } from './pages/GoogleLoginSimulationPage';

function ProtectedLayout() {
  const token = useSelector((state) => state.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-[#06080F] relative overflow-hidden">
      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Purple floating blob */}
      <div
        className="absolute top-[8%] left-[15%] w-[40%] h-[40%] rounded-full pointer-events-none floating-blob"
        style={{
          background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Cyan floating blob */}
      <div
        className="absolute bottom-[8%] right-[15%] w-[35%] h-[35%] rounded-full pointer-events-none floating-blob-delayed"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Content */}
      <div className="relative mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6 lg:py-8">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#06080F] relative overflow-x-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> }
    ]
  },
  {
    path: '/google-login-simulation',
    element: <GoogleLoginSimulationPage />
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:projectId', element: <ProjectDetailsPage /> },
      { path: '/projects/import', element: <ProjectImportPage /> },
      { path: '/deployments', element: <DeploymentsPage /> },
      { path: '/assistant', element: <AIAssistantPage /> },
      { path: '/domains', element: <DomainsPage /> },
      { path: '/admin', element: <AdminPage /> },
      { path: '/billing', element: <SubscriptionPage /> },
      { path: '/settings/security', element: <SecuritySettingsPage /> }
    ]
  }
]);
