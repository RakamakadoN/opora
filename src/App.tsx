import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, MessageSquareHeart, Compass, User, PlusCircle, Stethoscope } from 'lucide-react';
import { NavigatorTab } from './components/NavigatorTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { DirectoryTab } from './components/DirectoryTab';
import { Onboarding } from './components/Onboarding';
import { ProfileTab } from './components/ProfileTab';
import { CommunityTab } from './components/CommunityTab';
import { DoctorCabinetTab } from './components/DoctorCabinetTab';
import { CareTrackerTab, type TrackerView } from './components/CareTrackerTab';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';

export type TabType = 'navigator' | 'ai' | 'tracker' | 'directory' | 'community' | 'profile' | 'doctor';
type DirectoryQuickFilter = 'recommendations' | undefined;

function AppContent() {
  const { hasSeenOnboarding, appRole, setAppRole } = useProfile();
  const [activeTab, setActiveTab] = useState<TabType>('navigator');
  const [trackerInitialView, setTrackerInitialView] = useState<TrackerView>('calendar');
  const [directoryQuickFilter, setDirectoryQuickFilter] = useState<DirectoryQuickFilter>(undefined);

  React.useEffect(() => {
    if (appRole === 'doctor' && !['doctor', 'directory', 'profile'].includes(activeTab)) {
      setActiveTab('doctor');
    }
    if (appRole === 'parent' && activeTab === 'doctor') {
      setActiveTab('navigator');
    }
  }, [activeTab, appRole]);

  React.useEffect(() => {
    (window as any).__oporaChangeTab = setActiveTab;
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<TabType>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('changeTab', handleTabChange);
    return () => {
      window.removeEventListener('changeTab', handleTabChange);
      delete (window as any).__oporaChangeTab;
    };
  }, []);

  if (!hasSeenOnboarding) {
    return <Onboarding onComplete={() => {}} />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'navigator':
        return (
          <NavigatorTab
            onChangeTab={setActiveTab}
            onOpenDirectoryRecommendations={() => {
              setDirectoryQuickFilter('recommendations');
              setActiveTab('directory');
            }}
            onOpenTrackerView={(view) => {
              setTrackerInitialView(view);
              setActiveTab('tracker');
            }}
          />
        );
      case 'ai':
        return (
          <AIAssistantTab
            onChangeTab={setActiveTab}
            onOpenTrackerView={(view) => {
              setTrackerInitialView(view);
              setActiveTab('tracker');
            }}
          />
        );
      case 'tracker':
        return <CareTrackerTab initialView={trackerInitialView} />;
      case 'directory':
        return <DirectoryTab initialFilter={directoryQuickFilter} />;
      case 'profile':
        return <ProfileTab />;
      case 'community':
        return <CommunityTab />;
      case 'doctor':
        return <DoctorCabinetTab />;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-4">
      <div className="opora-device-frame opora-shell opora-mobile-shell relative flex w-full max-w-none flex-col overflow-hidden font-sans sm:h-[844px] sm:max-w-[410px] sm:rounded-[2rem] sm:border sm:border-white/70">
        <main className="opora-shell-main relative z-10 min-w-0 flex-1 overflow-y-auto scroll-smooth">
          <div className={`opora-role-switcher px-4 pt-3 ${appRole === 'parent' && ['navigator', 'ai'].includes(activeTab) ? 'hidden' : 'flex justify-end'}`}>
            <div className="flex max-w-full flex-wrap justify-end gap-1 rounded-2xl border border-black/5 bg-white/80 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            {[
              { id: 'parent', label: 'Я родитель' },
              { id: 'doctor', label: 'Я врач' }
            ].map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  const nextRole = role.id as typeof appRole;
                  setAppRole(nextRole);
                  setActiveTab(nextRole === 'doctor' ? 'doctor' : 'navigator');
                }}
                className={`min-h-8 flex-1 rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold transition-all sm:flex-none ${
                  appRole === role.id ? 'bg-opora-navy text-white' : 'text-opora-navy dark:text-slate-100'
                }`}
              >
                {role.label}
              </button>
            ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="min-h-full min-w-0"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="opora-bottom-nav no-scrollbar z-50 w-full shrink-0 overflow-x-auto border-t px-3 pb-7 pt-3 backdrop-blur-2xl">
          <ul className="flex w-full items-end justify-between gap-1 px-1">
            {appRole === 'parent' && (
              <>
                <NavItem 
                  icon={<Compass size={22} strokeWidth={activeTab === 'navigator' ? 2.5 : 1.5} />} 
                  label="Главная" 
                  isActive={activeTab === 'navigator'} 
                  onClick={() => setActiveTab('navigator')} 
                />
                <NavItem 
                  icon={<MessageSquareHeart size={22} strokeWidth={activeTab === 'ai' ? 2.5 : 1.5} />} 
                  label="Помощник" 
                  isActive={activeTab === 'ai'} 
                  onClick={() => setActiveTab('ai')} 
                />
                <NavItem
                  icon={<PlusCircle size={22} strokeWidth={activeTab === 'tracker' ? 2.5 : 1.5} />}
                  label="Действие"
                  isActive={activeTab === 'tracker'}
                  onClick={() => setActiveTab('tracker')}
                  variant="action"
                />
              </>
            )}
            <NavItem 
              icon={<Map size={22} strokeWidth={activeTab === 'directory' ? 2.5 : 1.5} />} 
              label="Места" 
              isActive={activeTab === 'directory'} 
              onClick={() => {
                setDirectoryQuickFilter(undefined);
                setActiveTab('directory');
              }} 
            />
            <NavItem 
              icon={<User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 1.5} />} 
              label="Профиль" 
              isActive={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')} 
            />
            {appRole === 'doctor' && (
              <NavItem 
                icon={<Stethoscope size={22} strokeWidth={activeTab === 'doctor' ? 2.5 : 1.5} />} 
                label="Кабинет" 
                isActive={activeTab === 'doctor'} 
                onClick={() => setActiveTab('doctor')} 
              />
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="rounded-3xl bg-white/80 px-6 py-5 text-sm font-bold text-opora-navy shadow-sm">
          Загружаем личный кабинет...
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <ProfileProvider key={user.id}>
      <AppContent />
    </ProfileProvider>
  );
}

function NavItem({
  icon,
  label,
  isActive,
  onClick,
  variant = 'default'
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'default' | 'action';
}) {
  if (variant === 'action') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        className={`flex min-w-[64px] flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isActive ? 'text-opora-sage' : 'text-opora-text hover:text-opora-navy'}`}
      >
        <div className="relative -mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#8B74FF_0%,#6D4FF3_100%)] text-white shadow-[0_18px_34px_rgba(124,92,255,0.34)] transition-all duration-200">
          {icon}
        </div>
        <span className={`text-[10px] font-bold tracking-normal transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`opora-nav-button flex shrink-0 flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isActive ? 'text-opora-sage' : 'text-opora-text hover:text-opora-navy'}`}
    >
      <div className={`opora-nav-icon relative flex items-center justify-center p-2 transition-all duration-200 ${isActive ? 'bg-opora-sage/10 text-opora-sage' : 'text-opora-text/70'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-normal transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );
}
