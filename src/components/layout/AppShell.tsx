import React, { useState } from 'react';
import {
  Heart,
  Droplet,
  Shield,
  Bell,
  User as UserIcon,
  LogOut,
  Hospital,
  AlertTriangle,
  Layers,
  ChevronDown,
  Menu,
  X,
  Compass,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../NotificationDropdown';
import { LifeLinkLogo } from '../brand/LifeLinkLogo';
import { BloodCirculationCanvas } from '../background/BloodCirculationCanvas';
import { UserRole } from '../../types';

interface AppShellProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (role?: UserRole) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
  children
}) => {
  const { user, userProfile, hospitalProfile, role, isAdmin, signOut, switchSimulatedPersona, activeSimulatedRole } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  // Page titles and descriptions for top nav breadcrumbs
  const getPageMeta = () => {
    switch (currentTab) {
      case 'home':
        return { title: 'Network Command Overview', subtitle: 'Public rescue platform & donor coordination' };
      case 'hospital':
        return { title: 'Hospital Operations Command', subtitle: hospitalProfile?.hospitalName || 'Clinical Requisitions, Smart Matching & Blood Bank Reserves' };
      case 'donor':
        return { title: 'Donor Rescue Portal', subtitle: 'Personal profile, active availability, and matched hospital requests' };
      case 'emergencies':
        return { title: 'Emergency Triage Radar', subtitle: 'Real-time monitoring of urgent regional blood requisitions' };
      case 'compatibility':
        return { title: 'ABO/Rh Compatibility Matrix', subtitle: 'Preliminary red blood cell serological matching reference' };
      case 'admin':
        return { title: 'System Administration & Audits', subtitle: 'Hospital facility verification & regulatory compliance ledger' };
      default:
        return { title: 'LifeLink Command', subtitle: 'Smart Blood Rescue Network' };
    }
  };

  const pageMeta = getPageMeta();

  const navItems = [
    { id: 'home', label: 'Network Overview', icon: Compass },
    { id: 'compatibility', label: 'Compatibility Matrix', icon: Droplet },
    { id: 'emergencies', label: 'Emergency Radar', icon: AlertTriangle, badge: 'LIVE' },
    ...(role === 'HOSPITAL' ? [{ id: 'hospital', label: 'Hospital Command', icon: Hospital }] : []),
    ...(role === 'DONOR' ? [{ id: 'donor', label: 'Donor Portal', icon: Heart }] : []),
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Oversight', icon: Shield }] : [])
  ];

  return (
    <div className="min-h-screen lifelink-ambient-bg text-[#F3F5F9] flex flex-col font-sans relative overflow-x-hidden">
      {/* Cinematic Layered Background Canvas: Stylized Floating Erythrocytes & Circulation Streams */}
      <BloodCirculationCanvas intensity={currentTab === 'home' ? 'full' : 'subtle'} />

      {/* Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/75 backdrop-blur-md flex">
          <div className="w-72 bg-[#101827] border-r border-white/10 h-full shadow-2xl flex flex-col justify-between p-4 animate-in slide-in-from-left duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <LifeLinkLogo size="sm" showTagline={false} />
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="mt-5 space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-[#C62845]/20 text-[#E63950] border border-[#C62845]/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#E63950]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E63950]/20 text-[#E63950] border border-[#E63950]/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom User Area */}
            <div className="pt-4 border-t border-white/10">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C62845] to-[#E63950] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{userProfile?.displayName || user.displayName || 'Member'}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 rounded-xl text-xs font-semibold text-[#E63950] hover:bg-red-950/30 border border-red-900/30"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal('DONOR');
                    setMobileDrawerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] text-white font-bold text-xs text-center shadow-md shadow-red-900/30"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Shell */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Persistent Desktop Sidebar with Midnight Navy & Burgundy Theme */}
        <aside
          className={`hidden lg:flex flex-col justify-between bg-[#101827]/90 backdrop-blur-xl border-r border-white/10 transition-all duration-300 z-30 select-none ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div>
            {/* Brand Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              <div
                className="cursor-pointer overflow-hidden"
                onClick={() => setCurrentTab('home')}
              >
                <LifeLinkLogo size="sm" showTagline={!sidebarCollapsed} />
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Sidebar Navigation */}
            <div className="p-3 space-y-1.5">
              {!sidebarCollapsed && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Command Navigation
                </p>
              )}

              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      sidebarCollapsed ? 'justify-center py-3' : 'justify-between px-3.5 py-2.5'
                    } rounded-xl text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-[#C62845]/20 text-white border border-[#C62845]/40 shadow-sm shadow-[#C62845]/20'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#E63950]' : 'text-slate-400'}`} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E63950]/20 text-[#E63950] border border-[#E63950]/30 animate-pulse">
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#E63950] rounded-r-md shadow-sm shadow-[#E63950]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Bottom Profile Summary */}
          <div className="p-3 border-t border-white/10 bg-[#101827]/60">
            {user ? (
              <div className="space-y-2">
                <div
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'space-x-2.5 px-2'
                  } py-1.5`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C62845] to-[#E63950] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                    {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{userProfile?.displayName || user.displayName || 'Member'}</p>
                      <p className="text-[10px] text-[#E63950] truncate uppercase font-bold tracking-wider">{role || 'DONOR'}</p>
                    </div>
                  )}
                </div>

                {!sidebarCollapsed && (
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-[#E63950] hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                {!sidebarCollapsed ? (
                  <button
                    onClick={() => openAuthModal('DONOR')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C62845] to-[#E63950] hover:from-[#8E1B1B] hover:to-[#C62845] text-white font-bold text-xs text-center transition-all shadow-md shadow-red-950/40"
                  >
                    Sign In / Register
                  </button>
                ) : (
                  <button
                    onClick={() => openAuthModal('DONOR')}
                    className="w-full py-2 flex justify-center text-[#E63950]"
                    title="Sign In"
                  >
                    <UserIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Content Column (Top Nav + Main View) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Navigation Bar with Midnight Navy & Glass Styling */}
          <header className="sticky top-0 z-30 bg-[#101827]/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Left: Mobile hamburger & Breadcrumbs */}
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">LifeLink Command</span>
                    <span className="text-xs text-slate-500 hidden sm:inline">/</span>
                    <h1 className="text-sm sm:text-base font-bold text-white truncate">
                      {pageMeta.title}
                    </h1>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate hidden md:block">
                    {pageMeta.subtitle}
                  </p>
                </div>
              </div>

              {/* Right: Evaluator Switcher, Notifications Bell, Profile Menu */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Evaluator Quick Role Switcher */}
                <div className="relative">
                  <button
                    onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-all shadow-xs"
                    title="Switch persona for evaluation/demo walkthrough"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#E63950]" />
                    <span className="hidden sm:inline text-slate-400">Persona:</span>
                    <span className="font-bold text-[#E63950]">{activeSimulatedRole || role || 'Visitor'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showPersonaMenu && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#162032] border border-white/10 shadow-2xl py-2 z-50 text-xs">
                      <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                          Evaluator Persona Switcher
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <button
                        onClick={() => {
                          switchSimulatedPersona('DONOR', 'donor_marcus_chen');
                          setCurrentTab('donor');
                          setShowPersonaMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <p className="font-bold text-[#E63950]">Marcus Chen (Donor, O-)</p>
                        <p className="text-[11px] text-slate-400">Review pending emergency matches</p>
                      </button>
                      <button
                        onClick={() => {
                          switchSimulatedPersona('HOSPITAL', 'hosp_st_jude_trauma');
                          setCurrentTab('hospital');
                          setShowPersonaMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <p className="font-bold text-white">St. Jude Trauma (Hospital)</p>
                        <p className="text-[11px] text-slate-400">Requisitions, inventory, wave matching</p>
                      </button>
                      <button
                        onClick={() => {
                          switchSimulatedPersona('ADMIN');
                          setCurrentTab('admin');
                          setShowPersonaMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <p className="font-bold text-indigo-300">System Administrator</p>
                        <p className="text-[11px] text-slate-400">Verify hospitals & inspect regulatory logs</p>
                      </button>
                      {activeSimulatedRole && (
                        <button
                          onClick={() => {
                            switchSimulatedPersona(null);
                            setShowPersonaMenu(false);
                          }}
                          className="w-full text-left px-3.5 py-2 border-t border-white/10 text-rose-400 font-semibold hover:bg-red-950/20 mt-1"
                        >
                          Reset to Authenticated Identity
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Notifications Bell */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors relative"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E63950] ring-2 ring-[#101827]" />
                    </button>
                    {showNotifications && (
                      <NotificationDropdown
                        onClose={() => setShowNotifications(false)}
                        onNavigate={(tab) => {
                          setCurrentTab(tab);
                          setShowNotifications(false);
                        }}
                      />
                    )}
                  </div>
                )}

                {/* User Dropdown Menu */}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C62845] to-[#E63950] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#162032] border border-white/10 shadow-2xl py-2 z-50 text-xs">
                        <div className="px-4 py-2.5 border-b border-white/10">
                          <p className="font-bold text-white truncate">{userProfile?.displayName || user.displayName || 'Member'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-[#C62845]/20 text-[#E63950]">
                            {role || 'DONOR'}
                          </span>
                        </div>

                        {role === 'DONOR' && (
                          <button
                            onClick={() => {
                              setCurrentTab('donor');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200 font-medium flex items-center space-x-2"
                          >
                            <Heart className="w-4 h-4 text-[#E63950]" />
                            <span>Donor Dashboard</span>
                          </button>
                        )}

                        {role === 'HOSPITAL' && (
                          <button
                            onClick={() => {
                              setCurrentTab('hospital');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200 font-medium flex items-center space-x-2"
                          >
                            <Hospital className="w-4 h-4 text-[#E63950]" />
                            <span>Hospital Command</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setCurrentTab('admin');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200 font-medium flex items-center space-x-2"
                          >
                            <Shield className="w-4 h-4 text-indigo-400" />
                            <span>Admin Console</span>
                          </button>
                        )}

                        <div className="border-t border-white/10 my-1" />

                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                            setCurrentTab('home');
                          }}
                          className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-950/20 font-semibold flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openAuthModal('DONOR')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => openAuthModal('DONOR')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#C62845] to-[#E63950] hover:from-[#8E1B1B] hover:to-[#C62845] text-white shadow-sm shadow-red-950/40 transition-all"
                    >
                      Become a Donor
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto relative z-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
