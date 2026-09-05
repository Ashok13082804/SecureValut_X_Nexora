import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Lock, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api/client';

interface ThreatCenterProps {
  onSelectFile: (fileId: string) => void;
}

export const ThreatCenterView: React.FC<ThreatCenterProps> = ({ onSelectFile }) => {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreats = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/threats');
      setThreats(data);
    } catch (err) {
      console.error('Failed to load threats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreats();
  }, []);

  const handleToggleQuarantine = async (fileId: string, currentQuarantine: boolean) => {
    try {
      await apiRequest(`/files/${fileId}/quarantine?quarantine=${!currentQuarantine}`, { method: 'POST' });
      fetchThreats();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Threat Defense Center</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Static Heuristics • Shannon Entropy Analysis • Automatic Sandbox Quarantine
          </p>
        </div>
        <button
          onClick={fetchThreats}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Threat Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
          <div className="flex justify-between items-center text-xs font-mono text-rose-400">
            <span>High Risk Payloads</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400">
            {threats.filter((t) => t.threat_score >= 70).length}
          </div>
          <p className="text-[11px] text-slate-400">Isolated automatically upon ingestion</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
          <div className="flex justify-between items-center text-xs font-mono text-amber-400">
            <span>Suspicious Anomalies</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {threats.filter((t) => t.threat_score >= 25 && t.threat_score < 70).length}
          </div>
          <p className="text-[11px] text-slate-400">Elevated entropy or macro indicators</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="flex justify-between items-center text-xs font-mono text-emerald-400">
            <span>Clean Baseline</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {threats.filter((t) => t.threat_score < 25).length}
          </div>
          <p className="text-[11px] text-slate-400">Safe for external sharing</p>
        </div>
      </div>

      {/* Threat Feeds Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">File Name</th>
                <th className="p-4">Threat Score</th>
                <th className="p-4">Entropy</th>
                <th className="p-4">Detected Vectors</th>
                <th className="p-4">Quarantine Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {threats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No threat records currently identified in repository.
                  </td>
                </tr>
              ) : (
                threats.map((t) => {
                  const isHigh = t.threat_score >= 70;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-semibold text-white font-sans">
                        {t.file_name}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {t.threat_score}/100 {t.classification}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {t.entropy?.toFixed(2)} / 8.0
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {t.has_macros && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                              VBA Macro
                            </span>
                          )}
                          {t.has_pdf_javascript && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                              PDF JS
                            </span>
                          )}
                          {t.suspicious_strings?.map((s: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                              {s}
                            </span>
                          ))}
                          {!t.has_macros && !t.has_pdf_javascript && t.suspicious_strings?.length === 0 && (
                            <span className="text-slate-500 text-[10px]">Clean Vectors</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.is_quarantined ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {t.is_quarantined ? 'QUARANTINED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectFile(t.file_id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all"
                            title="Inspect File Evidence"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleQuarantine(t.file_id, t.is_quarantined)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                              t.is_quarantined
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40'
                            }`}
                            title={t.is_quarantined ? 'Release from Quarantine' : 'Quarantine File'}
                          >
                            {t.is_quarantined ? 'Release' : 'Quarantine'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
