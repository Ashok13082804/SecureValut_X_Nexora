import React, { useState, useEffect } from 'react';
import { Share2, Lock, Copy, Check, Trash2, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { apiRequest } from '../api/client';

export const SharesView: React.FC = () => {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/shares');
      setShares(data);
    } catch (err) {
      console.error('Failed to load shares', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const copyUrl = (token: string, id: string) => {
    const full = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(full);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (shareId: string) => {
    if (!confirm('Revoke this share link immediately? Recipient will no longer be able to access the file.')) return;
    try {
      await apiRequest(`/shares/${shareId}`, { method: 'DELETE' });
      fetchShares();
    } catch (err: any) {
      alert(`Revoke failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Active Secure Shares</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Expiring links • Download thresholds • Zero-Trust revocable access
          </p>
        </div>
        <button
          onClick={fetchShares}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Target File</th>
                <th className="p-4">Share Token</th>
                <th className="p-4">Downloads Used</th>
                <th className="p-4">Password / Watermark</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shares.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No active share links created yet. Click Share on any file in the repository to generate one.
                  </td>
                </tr>
              ) : (
                shares.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white font-sans">
                      {s.file_name}
                    </td>
                    <td className="p-4">
                      <span className="text-cyan-400">{s.access_token.slice(0, 12)}...</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300">
                        {s.download_count} / {s.download_limit}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-x-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.has_password ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                          {s.has_password ? 'Password Protected' : 'No Password'}
                        </span>
                        {s.watermark_enabled && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400">
                            Watermark
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.approval_status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {s.approval_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyUrl(s.access_token, s.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all"
                          title="Copy Share Link"
                        >
                          {copiedId === s.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {s.approval_status === 'APPROVED' && (
                          <button
                            onClick={() => handleRevoke(s.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                            title="Revoke Share Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
