import React, { useState, useEffect } from 'react';
import { Terminal, Search, Filter, Clock, User, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';

export const ForensicsView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/forensics/timeline');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const filtered = events.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.who?.toLowerCase().includes(term) ||
      e.what?.toLowerCase().includes(term) ||
      e.event_type?.toLowerCase().includes(term) ||
      e.where?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Digital Forensics Timeline</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Forensic Reconstruction of WHO, WHAT, WHEN, WHERE, and HOW across all platform interactions
          </p>
        </div>
        <button
          onClick={fetchTimeline}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Timeline</span>
        </button>
      </div>

      {/* Forensic Search Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by actor, filename, event type, IP..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filtered.length} reconstructed event(s)
        </span>
      </div>

      {/* Forensic Event Sequence */}
      <div className="space-y-4">
        {filtered.map((item, idx) => {
          const isHigh = item.severity === 'HIGH';
          const isInfo = item.severity === 'INFO';

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md font-mono text-xs space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    isHigh ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {item.event_type}
                  </span>
                  <span className="text-slate-400">{new Date(item.timestamp).toUTCString()}</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">{item.blockchain_status}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] font-bold block">WHO (ACTOR)</span>
                  <span className="text-white break-all">{item.who}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] font-bold block">WHERE (ORIGIN / NODE)</span>
                  <span className="text-slate-300 break-all">{item.where}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 sm:col-span-2">
                  <span className="text-slate-500 text-[10px] font-bold block">WHAT (ACTION)</span>
                  <span className="text-cyan-400">{item.what}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-slate-400 text-[11px]">
                <span className="text-slate-500 text-[10px] font-bold block">HOW (MECHANISM & TELEMETRY)</span>
                <span>{item.how}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
