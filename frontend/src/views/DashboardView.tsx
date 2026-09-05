import React, { useEffect, useState } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, FileText, Share2, Download,
  AlertTriangle, CheckCircle2, ArrowUpRight, TrendingUp, Activity,
  Lock, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { apiRequest } from '../api/client';

export const DashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const data = await apiRequest('/analytics/metrics');
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-cyan-400 font-mono text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Initializing SOC Analytics Stream...
      </div>
    );
  }

  const cards = [
    { label: 'Total Files Monitored', value: metrics?.total_files || 0, icon: FileText, color: 'text-cyan-400', border: 'border-cyan-500/20' },
    { label: 'Verified Clean Files', value: metrics?.secure_files || 0, icon: ShieldCheck, color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { label: 'Threats Detected', value: metrics?.threats_detected || 0, icon: AlertTriangle, color: 'text-rose-400', border: 'border-rose-500/20' },
    { label: 'Suspicious / Low Risk', value: metrics?.suspicious_files || 0, icon: ShieldAlert, color: 'text-amber-400', border: 'border-amber-500/20' },
    { label: 'Active Secure Shares', value: metrics?.active_shares || 0, icon: Share2, color: 'text-indigo-400', border: 'border-indigo-500/20' },
    { label: 'Downloads Today', value: metrics?.downloads_today || 0, icon: Download, color: 'text-sky-400', border: 'border-sky-500/20' },
    { label: 'Blocked Attacks', value: metrics?.blocked_requests || 0, icon: Lock, color: 'text-purple-400', border: 'border-purple-500/20' },
    { label: 'Organization Score', value: `${metrics?.security_score || 92}/100`, icon: Shield, color: 'text-emerald-400', border: 'border-emerald-500/30' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">SOC Command Center</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Live telemetry • Real-time Threat Intelligence • Blockchain Audit Node
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* 8 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-xl bg-slate-900/60 border ${c.border} backdrop-blur-md space-y-2 hover:-translate-y-0.5 transition-all shadow-md shadow-black/20`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className={`text-2xl font-extrabold font-mono ${c.color}`}>{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Security Score Breakdown Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="text-center lg:text-left space-y-2 lg:border-r border-slate-800 lg:pr-6">
          <span className="text-[11px] font-mono uppercase text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            {metrics?.security_breakdown?.status_level || 'SECURE POSTURE'}
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white mt-2">
            {metrics?.security_score || 92}
            <span className="text-xl text-slate-500">/100</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Composite score derived from authenticated encryption, static threat heuristics, DLP classification, and tamper-evident blockchain verification.
          </p>
        </div>

        {/* Component Scores Progress Bars */}
        <div className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { name: 'Authentication (MFA)', val: metrics?.security_breakdown?.authentication_score || 95 },
              { name: 'Threat Engine', val: metrics?.security_breakdown?.threat_detection_score || 88 },
              { name: 'Cryptographic Integrity', val: metrics?.security_breakdown?.file_integrity_score || 98 },
              { name: 'DLP Data Protection', val: metrics?.security_breakdown?.dlp_score || 92 },
              { name: 'Blockchain Verification', val: metrics?.security_breakdown?.blockchain_score || 100 },
              { name: 'UEBA Behavior Score', val: metrics?.security_breakdown?.ueba_score || 90 },
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{item.name}</span>
                  <span className="text-cyan-400 font-bold">{item.val}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations list */}
          <div className="mt-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-1">Key Action Recommendations:</div>
            <ul className="text-xs text-slate-400 space-y-1">
              {metrics?.security_breakdown?.recommendations?.map((r: string, idx: number) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threats Over Time Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Threats Over Time</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Last 7 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.charts?.threats_over_time || []}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClean" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
                <Area type="monotone" dataKey="threats" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" name="Threat Detections" />
                <Area type="monotone" dataKey="clean" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorClean)" name="Clean Files" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Categories Donut */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Threat Vectors Distribution</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Classification Breakdown</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.charts?.threat_categories || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(metrics?.charts?.threat_categories || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono">
            {(metrics?.charts?.threat_categories || []).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-slate-300">{c.name}</span>
                <span className="text-slate-500 font-bold">({c.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
