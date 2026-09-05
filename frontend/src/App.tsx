import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ReportModal } from './components/ReportModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LandingPage } from './views/LandingPage';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { FilesView } from './views/FilesView';
import { FileDetailModal } from './views/FileDetailModal';
import { ShareModal } from './views/ShareModal';
import { SharesView } from './views/SharesView';
import { ThreatCenterView } from './views/ThreatCenterView';
import { MLDashboardView } from './views/MLDashboardView';
import { NLPView } from './views/NLPView';
import { BlockchainView } from './views/BlockchainView';
import { UEBAView } from './views/UEBAView';
import { IncidentsView } from './views/IncidentsView';
import { ForensicsView } from './views/ForensicsView';
import { PoliciesView } from './views/PoliciesView';
import { AuditLogsView } from './views/AuditLogsView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';
import { PublicSharePortal } from './views/PublicSharePortal';
import { authStorage, User, apiRequest } from './api/client';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLanding, setIsLanding] = useState(false);

  // Modals state
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [shareFileId, setShareFileId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Public share route check (e.g. /s/:token)
  const [publicShareToken, setPublicShareToken] = useState<string | null>(null);

  useEffect(() => {
    // Check path for public share link: /s/xyz
    const path = window.location.pathname;
    if (path.startsWith('/s/')) {
      const token = path.replace('/s/', '');
      if (token) {
        setPublicShareToken(token);
        return;
      }
    }

    // Check existing stored auth
    const storedUser = authStorage.getUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      // Default to landing page if unauthenticated
      setIsLanding(true);
    }
  }, []);

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    setIsLanding(true);
  };

  const handleQuickDemoLogin = async (roleType: string) => {
    let email = 'admin@secureai.local';
    if (roleType === 'analyst') email = 'soc_analyst@secureai.local';
    if (roleType === 'employee') email = 'john.doe@secureai.local';

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username_or_email: email,
          password: 'Password@123!',
        }),
      });
      authStorage.setToken(data.access_token);
      authStorage.setUser(data.user);
      setUser(data.user);
      setIsLanding(false);
      setIsAuthOpen(false);
      setCurrentView('dashboard');
    } catch (err: any) {
      alert(`Demo login error: ${err.message}`);
    }
  };

  // If visiting public share link
  if (publicShareToken) {
    return (
      <PublicSharePortal
        token={publicShareToken}
        onBackToHome={() => {
          setPublicShareToken(null);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  // If showing Public Landing Page
  if (isLanding) {
    return (
      <LandingPage
        onEnterApp={() => {
          if (user) {
            setIsLanding(false);
          } else {
            setIsAuthOpen(true);
          }
        }}
        onQuickDemoLogin={handleQuickDemoLogin}
      />
    );
  }

  // If showing Authentication View
  if (isAuthOpen || !user) {
    return (
      <AuthView
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setIsAuthOpen(false);
          setIsLanding(false);
          setCurrentView('dashboard');
        }}
        onBackToLanding={() => {
          setIsAuthOpen(false);
          setIsLanding(true);
        }}
      />
    );
  }

  // Render SOC Dashboard Layout
  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        userRole={user?.role || 'Super Admin'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          user={user}
          securityScore={92}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          onLogout={handleLogout}
          onSwitchToLanding={() => setIsLanding(true)}
          unreadAlertsCount={3}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-y-auto bg-[#020617]/95">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'files' && (
            <FilesView
              onSelectFile={(id) => setSelectedFileId(id)}
              onOpenShareModal={(id) => setShareFileId(id)}
            />
          )}
          {currentView === 'shares' && <SharesView />}
          {currentView === 'threats' && (
            <ThreatCenterView onSelectFile={(id) => setSelectedFileId(id)} />
          )}
          {currentView === 'ai-ml' && <MLDashboardView />}
          {currentView === 'nlp' && <NLPView />}
          {currentView === 'blockchain' && <BlockchainView />}
          {currentView === 'ueba' && <UEBAView />}
          {currentView === 'incidents' && <IncidentsView />}
          {currentView === 'forensics' && <ForensicsView />}
          {currentView === 'policies' && <PoliciesView />}
          {currentView === 'audit' && <AuditLogsView />}
          {currentView === 'users' && <UsersView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modals & Overlays */}
      <FileDetailModal
        fileId={selectedFileId}
        onClose={() => setSelectedFileId(null)}
        onOpenShareModal={(id) => {
          setSelectedFileId(null);
          setShareFileId(id);
        }}
      />

      <ShareModal
        fileId={shareFileId}
        onClose={() => setShareFileId(null)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
      />
    </div>
  );
}

export default App;
