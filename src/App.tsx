import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, MessageSquareHeart, HeartHandshake, Compass, User, Stethoscope } from 'lucide-react';
import { NavigatorTab } from './components/NavigatorTab';
import { AIAssistantTab } from './components/AIAssistantTab';
import { DirectoryTab } from './components/DirectoryTab';
import { Onboarding } from './components/Onboarding';
import { ProfileTab } from './components/ProfileTab';
import { CommunityTab } from './components/CommunityTab';
import { DoctorCabinetTab } from './components/DoctorCabinetTab';
import { ProfileProvider, useProfile } from './context/ProfileContext';

export type TabType = 'navigator' | 'ai' | 'directory' | 'community' | 'profile' | 'doctor';
type DirectoryQuickFilter = 'recommendations' | undefined;

function AppContent() {
  const { hasSeenOnboarding, appRole, setAppRole } = useProfile();
  const [activeTab, setActiveTab] = useState<TabType>('navigator');
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
          />
        );
      case 'ai':
        return <AIAssistantTab />;
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
    <div className="flex min-h-screen justify-center items-center p-0 sm:p-4">
      <div className="opora-device-frame opora-shell w-full h-[100dvh] sm:h-[844px] max-w-[390px] sm:max-w-[410px] sm:rounded-[2rem] overflow-hidden relative flex flex-col font-sans sm:border border-white/70">
        <main className="flex-1 overflow-y-auto pb-4 scroll-smooth relative z-10">
          <div className="absolute right-4 top-3 z-30 rounded-2xl border border-black/5 bg-white/80 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
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
                className={`rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold transition-all ${
                  appRole === role.id ? 'bg-opora-navy text-white' : 'text-opora-navy dark:text-slate-100'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="opora-bottom-nav w-full shrink-0 backdrop-blur-2xl border-t px-3 pb-7 pt-3 z-50">
          <ul className="flex justify-between items-center px-2">
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
            {appRole === 'parent' && (
              <NavItem 
                icon={<HeartHandshake size={22} strokeWidth={activeTab === 'community' ? 2.5 : 1.5} />} 
                label="Родители" 
                isActive={activeTab === 'community'} 
                onClick={() => setActiveTab('community')} 
              />
            )}
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
    <ProfileProvider>
      <AppContent />
    </ProfileProvider>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`opora-nav-button flex flex-col items-center gap-1 transition-all duration-200 active:scale-95 ${isActive ? 'text-opora-sage' : 'text-opora-text hover:text-opora-navy'}`}
    >
      <div className={`opora-nav-icon relative flex items-center justify-center p-2 transition-all duration-200 ${isActive ? 'bg-opora-sage/10 text-opora-sage' : 'text-opora-text/70'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-normal transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );
}
