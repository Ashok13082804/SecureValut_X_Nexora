import React from 'react';
import {
  Search, Bell, ShieldCheck, DownloadCloud,
  LogOut, User as UserIcon, RefreshCw, Eye
} from 'lucide-react';
import { User } from '../api/client';

interface HeaderProps {
  user: User | null;
  securityScore: number;
  onOpenReportModal: () => void;
  onToggleNotifications: () => void;
  onLogout: () => void;
  onSwitchToLanding: () => void;
  unreadAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  securityScore,
  onOpenReportModal,
  onToggleNotifications,
  onLogout,
  onSwitchToLanding,
  unreadAlertsCount
}) => {
  return (
    <header className="h-16 bg-[#090d16]/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between z-10">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Global search files, threats, SHA-256 hashes, incidents..."
            className="w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 placeholder:text-slate-500 font-mono transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Security Score Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div className="text-right font-mono">
            <span className="text-xs font-bold text-emerald-400">{securityScore}/100</span>
            <span className="text-[10px] text-emerald-300 ml-1.5 uppercase font-medium">SOC RATED</span>
          </div>
        </div>

        {/* Export Report Action */}
        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium hover:border-slate-600 transition-all shadow-sm"
        >
          <DownloadCloud className="w-4 h-4 text-cyan-400" />
          <span>Export Audit</span>
        </button>

        {/* Public Landing View Toggle */}
        <button
          onClick={onSwitchToLanding}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs transition-all"
          title="View Landing Page"
        >
          <Eye className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Landing</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onToggleNotifications}
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#090d16] animate-pulse" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user?.full_name || 'Administrator'}</p>
            <p className="text-[10px] font-mono text-cyan-400">{user?.role || 'Super Admin'}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-cyan-500/30">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
