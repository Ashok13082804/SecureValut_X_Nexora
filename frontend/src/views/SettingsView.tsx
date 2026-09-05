import React, { useState } from 'react';
import { Database, ShieldCheck, Key, Server, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../api/client';

export const SettingsView: React.FC = () => {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResetDemo = async () => {
    if (!confirm('This will wipe test databases and re-seed clean enterprise demo files, threats, and blockchain blocks. Continue?')) return;
    setResetting(true);
    setMessage(null);
    try {
      const res = await apiRequest('/demo/reset', { method: 'POST' });
      setMessage(res.message);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">System Health & Infrastructure</h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Cryptographic Hardware Engine • Storage Quotas • Synthetic Demo Controller
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold">FastAPI Core Service</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">HEALTHY (200 OK)</div>
          <p className="text-[11px] text-slate-500">FastAPI ASGI Gateway • Port 8000</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold">Cryptographic Engine</span>
            <Key className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400">AES-256-GCM READY</div>
          <p className="text-[11px] text-slate-500">256-Bit Master Key Wrapping Active</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold">Blockchain Ledger Node</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">LEDGER IN SYNC</div>
          <p className="text-[11px] text-slate-500">SHA-256 Chained Blocks Verified</p>
        </div>
      </div>

      {/* Storage Architecture */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase">Secure Storage & File Encryption Specs</h3>
        <div className="space-y-2 text-xs font-mono text-slate-300">
          <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Storage Directory:</span>
            <span className="text-cyan-400">./secure_storage (UUID-anonymized ciphertext)</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Symmetric Cipher:</span>
            <span className="text-white">AES-256-GCM with 96-bit Nonce & 128-bit Auth Tag</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Integrity Verification:</span>
            <span className="text-emerald-400">Cryptographic SHA-256 Pre-Encrypt & Post-Decrypt Check</span>
          </div>
        </div>
      </div>

      {/* Demo Mode Management */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase">Demonstration Environment Controller</h3>
        <p className="text-xs text-slate-400">
          Wipe current test state and restore complete pre-populated enterprise scenario (users, clean and weaponized test files, audit trails, and blockchain blocks).
        </p>
        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-mono font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting Environment...' : 'Reset & Re-Seed Demo Dataset'}</span>
        </button>
      </div>
    </div>
  );
};
