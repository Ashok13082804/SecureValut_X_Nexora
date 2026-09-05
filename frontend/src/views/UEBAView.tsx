import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, ShieldCheck, UserCheck, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api/client';

export const UEBAView: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUEBA = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/ueba/users');
      setProfiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUEBA();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">User & Entity Behavior Analytics (UEBA)</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Download Velocity Tracking • Baseline Anomaly Detection • Insider Threat Defense
          </p>
        </div>
        <button
          onClick={fetchUEBA}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Baselines</span>
        </button>
      </div>

      {/* Behavioral Profiles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((p) => {
          const isHigh = p.current_risk >= 70;
          const isElevated = p.current_risk >= 35 && p.current_risk < 70;

          return (
            <div
              key={p.user_id}
              className={`p-6 rounded-2xl bg-slate-900/60 border backdrop-blur-md space-y-4 transition-all ${
                isHigh ? 'border-rose-500/40 bg-rose-950/10' : isElevated ? 'border-amber-500/40' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{p.full_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">@{p.username}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                  isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  isElevated ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {p.status}
                </span>
              </div>

              {/* Risk comparison meter */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Baseline Risk:</span>
                  <span className="text-slate-300 font-bold">{p.baseline_risk}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Assessed Risk:</span>
                  <span className={`font-bold ${isHigh ? 'text-rose-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {p.current_risk}/100
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh ? 'bg-rose-500' : isElevated ? 'bg-amber-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${p.current_risk}%` }}
                  />
                </div>
              </div>

              {/* Velocity & Anomalies */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Recent Download Velocity:</span>
                  <span className="text-cyan-400 font-bold">{p.recent_downloads_count} files / 10 min</span>
                </div>

                {p.anomalies?.length > 0 ? (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 space-y-1 text-[11px]">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Detected Deviations:</span>
                    </div>
                    {p.anomalies.map((a: string, i: number) => (
                      <p key={i}>• {a}</p>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>User behavior within normal baseline threshold.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
