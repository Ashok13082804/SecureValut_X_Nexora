import React from 'react';
import {
  Shield, LayoutDashboard, FileText, Share2, AlertTriangle,
  Brain, FileSearch, Link2, Users, LifeBuoy, Activity,
  Sliders, Database, FileCheck, Terminal
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  userRole: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, userRole }) => {
  const navItems = [
    { id: 'dashboard', label: 'SOC Command', icon: LayoutDashboard, badge: null },
    { id: 'files', label: 'Secure Files', icon: FileText, badge: null },
    { id: 'shares', label: 'Secure Sharing', icon: Share2, badge: null },
    { id: 'threats', label: 'Threat Center', icon: AlertTriangle, badge: 'ALERT' },
    { id: 'ai-ml', label: 'AI & ML Defense', icon: Brain, badge: null },
    { id: 'nlp', label: 'NLP & DLP Shield', icon: FileSearch, badge: null },
    { id: 'blockchain', label: 'Blockchain Ledger', icon: Link2, badge: 'AUDIT' },
    { id: 'ueba', label: 'User Behavior (UEBA)', icon: Activity, badge: null },
    { id: 'incidents', label: 'Incident Response', icon: LifeBuoy, badge: null },
    { id: 'forensics', label: 'Digital Forensics', icon: Terminal, badge: null },
    { id: 'policies', label: 'Security Policies', icon: Sliders, badge: null },
    { id: 'audit', label: 'Audit Logs', icon: FileCheck, badge: null },
    { id: 'users', label: 'User Governance', icon: Users, badge: null },
    { id: 'settings', label: 'System Health', icon: Database, badge: null },
  ];

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800/80 flex flex-col flex-shrink-0 z-20">
      {/* Brand Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-wide text-white">SecureAI</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-semibold border border-cyan-500/30">
              VAULT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Protect. Detect. Trust.</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Cyber Defense
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  item.badge === 'ALERT'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Tag */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOC Node Active</span>
          </div>
          <span className="text-[10px] text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
