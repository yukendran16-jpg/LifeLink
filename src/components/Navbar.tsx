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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (role?: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal
}) => {
  const { user, userProfile, role, isAdmin, signOut, switchSimulatedPersona, activeSimulatedRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setCurrentTab('home')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-teal-600 shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
              <Droplet className="w-3 h-3 text-red-100 absolute -bottom-0.5 right-1" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-white">LifeLink</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  RESCUE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Smart Blood Rescue Network
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentTab === 'home'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Public Overview
            </button>
            <button
              onClick={() => setCurrentTab('compatibility')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                currentTab === 'compatibility'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Compatibility Matrix
            </button>
            <button
              onClick={() => setCurrentTab('emergencies')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                currentTab === 'emergencies'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Emergency Radar</span>
            </button>

            {/* Role-Specific Portal Links */}
            {role === 'DONOR' && (
              <button
                onClick={() => setCurrentTab('donor')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentTab === 'donor'
                    ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Heart className="w-4 h-4 text-teal-400" />
                <span>Donor Dashboard</span>
              </button>
            )}

            {role === 'HOSPITAL' && (
              <button
                onClick={() => setCurrentTab('hospital')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentTab === 'hospital'
                    ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Hospital className="w-4 h-4 text-teal-400" />
                <span>Hospital Portal</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Admin Portal</span>
              </button>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Quick Evaluator Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700 transition-all shadow-sm"
                title="Switch persona for evaluation/demo walkthrough"
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Role: {activeSimulatedRole || role || 'Visitor'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800 flex items-center justify-between">
                    <span>Evaluator Role Switcher</span>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </div>
                  <button
                    onClick={() => {
                      switchSimulatedPersona('DONOR', 'donor_marcus_chen');
                      setCurrentTab('donor');
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-teal-300">Marcus Chen (Donor, O-)</p>
                      <p className="text-[11px] text-slate-400">View pending emergency matches</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      switchSimulatedPersona('HOSPITAL', 'hosp_st_jude_trauma');
                      setCurrentTab('hospital');
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-blue-300">St. Jude Trauma (Hospital)</p>
                      <p className="text-[11px] text-slate-400">Manage requests & inventory</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      switchSimulatedPersona('ADMIN');
                      setCurrentTab('admin');
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-indigo-300">System Administrator</p>
                      <p className="text-[11px] text-slate-400">Verify hospitals & inspect audits</p>
                    </div>
                  </button>
                  {activeSimulatedRole && (
                    <button
                      onClick={() => {
                        switchSimulatedPersona(null);
                        setShowPersonaMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 text-rose-300 border-t border-slate-800 mt-1"
                    >
                      Reset to Authenticated Identity
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Notifications Dropdown Toggle */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-slate-900" />
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

            {/* Account Controls */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-medium text-white truncate">
                        {userProfile?.displayName || user.displayName || 'Member'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50">
                        {role || 'DONOR'}
                      </span>
                    </div>

                    {role === 'DONOR' && (
                      <button
                        onClick={() => {
                          setCurrentTab('donor');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
                      >
                        <UserIcon className="w-4 h-4 text-teal-400" />
                        <span>Donor Profile</span>
                      </button>
                    )}

                    {role === 'HOSPITAL' && (
                      <button
                        onClick={() => {
                          setCurrentTab('hospital');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
                      >
                        <Hospital className="w-4 h-4 text-teal-400" />
                        <span>Hospital Dashboard</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setCurrentTab('admin');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
                      >
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span>Admin Console</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                        setCurrentTab('home');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 text-rose-400 flex items-center space-x-2"
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
                  className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('DONOR')}
                  className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all"
                >
                  Register Donor
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
