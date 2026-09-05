import React from 'react';
import {
  Shield, Lock, Brain, FileSearch, Link2, Activity,
  ArrowRight, CheckCircle2, ChevronRight, Terminal, Eye, Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onQuickDemoLogin: (role: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onQuickDemoLogin }) => {
  const features = [
    {
      icon: Lock,
      title: 'AES-256-GCM Cryptography',
      desc: 'Authenticated symmetric encryption with unique per-file keys, PBKDF2 wrapping, and dynamic recipient watermarking.',
      badge: 'Zero-Knowledge'
    },
    {
      icon: Brain,
      title: 'AI/ML Threat Inspection',
      desc: 'Ensemble Random Forest & Isolation Forest scanning byte entropy, macro payloads, and PDF JavaScript exploits.',
      badge: '96.8% Accuracy'
    },
    {
      icon: FileSearch,
      title: 'NLP Data Loss Prevention',
      desc: 'Automated entity recognition detecting embedded API keys, credentials, PII, and corporate confidential markers.',
      badge: 'Deep DLP'
    },
    {
      icon: Link2,
      title: 'Blockchain Audit Ledger',
      desc: 'Tamper-evident permissioned blockchain chaining every upload, share, and access into an immutable SHA-256 ledger.',
      badge: 'Tamper-Proof'
    },
    {
      icon: Activity,
      title: 'User Behavior Analytics',
      desc: 'UEBA anomaly engine establishing baseline download velocities and instantly halting data exfiltration spikes.',
      badge: 'Real-Time'
    },
    {
      icon: Terminal,
      title: 'Digital Forensics & SOC',
      desc: 'End-to-end incident response reconstructing WHO, WHAT, WHEN, WHERE, and HOW across every security event.',
      badge: 'Forensics Ready'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide text-white">SecureAI</span>
            <span className="text-xs px-2 py-0.5 ml-1.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold border border-cyan-500/30">
              VAULT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onQuickDemoLogin('admin')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-mono"
          >
            Demo Sign-In
          </button>
          <button
            onClick={onEnterApp}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Cybersecurity & Blockchain Auditability</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Secure Every File. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Detect Every Threat.
          </span> <br />
          Trust Every Transaction.
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          A production-grade cybersecurity software platform combining authenticated AES-256-GCM encryption,
          multi-factor machine learning threat detection, NLP data-loss prevention, and a tamper-evident blockchain audit ledger.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onEnterApp}
            className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-xl shadow-cyan-500/25"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onQuickDemoLogin('admin')}
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
          >
            <span>Explore Demo SOC</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Quick Demo Credential Bar */}
        <div className="pt-6">
          <div className="inline-flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="text-slate-500 font-medium">Quick Credentials:</span>
            <button
              onClick={() => onQuickDemoLogin('admin')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 hover:border-cyan-500/30 border border-transparent transition-all"
            >
              Super Admin
            </button>
            <button
              onClick={() => onQuickDemoLogin('analyst')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-500/20 text-indigo-400 hover:border-indigo-500/30 border border-transparent transition-all"
            >
              SOC Analyst
            </button>
            <button
              onClick={() => onQuickDemoLogin('employee')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 hover:border-emerald-500/30 border border-transparent transition-all"
            >
              Employee
            </button>
            <span className="text-slate-500 text-[11px]">| Password: Password@123!</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-bold text-white">Defense-in-Depth Architecture</h2>
          <p className="text-xs text-slate-400 font-mono">Six interconnected security modules engineered for zero-trust protection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 group hover:-translate-y-1 shadow-lg shadow-black/40"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-all">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <p>SecureAI Vault • Production Cybersecurity Software Platform • Protect. Detect. Trust.</p>
      </footer>
    </div>
  );
};
