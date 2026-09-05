import React, { useState, useEffect } from 'react';
import { FileCheck, Search, ShieldCheck, RefreshCw, Key } from 'lucide-react';
import { apiRequest } from '../api/client';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/audit');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (
      l.action?.toLowerCase().includes(t) ||
      l.actor_name?.toLowerCase().includes(t) ||
      l.target_type?.toLowerCase().includes(t)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Cryptographic Audit Logs</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tamper-Evident Signatures • Immutable Operation History • Compliance Traceability
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, actor, or target..."
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filtered.length} audit record(s)
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Timestamp (UTC)</th>
                <th className="p-4">Operation Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">Status</th>
                <th className="p-4">Cryptographic Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-sans">
                      {log.actor_name || 'System'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {log.target_type}: {log.target_id ? log.target_id.slice(0, 8) : 'General'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-[10px]">
                      {log.hash_signature ? `${log.hash_signature.slice(0, 16)}...` : 'Signed'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
