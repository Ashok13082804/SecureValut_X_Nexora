import React, { useState, useEffect } from 'react';
import { Shield, Lock, Download, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { apiRequest } from '../api/client';

interface PublicSharePortalProps {
  token: string;
  onBackToHome: () => void;
}

export const PublicSharePortal: React.FC<PublicSharePortalProps> = ({ token, onBackToHome }) => {
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest(`/shares/public/${token}`)
      .then((data) => setShareInfo(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setError(null);
    try {
      const blob = await apiRequest<Blob>(`/shares/public/${token}/download`, {
        method: 'POST',
        body: JSON.stringify({ token, password: password || null }),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = shareInfo?.file_name || 'downloaded_file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh share info for updated download count
      const updated = await apiRequest(`/shares/public/${token}`);
      setShareInfo(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 cyber-grid selection:bg-cyan-500 selection:text-white">
      <div className="w-full max-w-md bg-[#0f172a]/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Secure Expiring Download</h2>
          <p className="text-xs text-slate-400 font-mono">Zero-Trust Encrypted Transfer Portal</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center p-6 text-cyan-400 font-mono text-xs animate-pulse">
            Validating Cryptographic Share Token...
          </div>
        ) : shareInfo ? (
          <form onSubmit={handleDownload} className="space-y-4">
            {/* File Details Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold uppercase text-xs">
                  {shareInfo.file_extension}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white truncate">{shareInfo.file_name}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {(shareInfo.file_size / 1024).toFixed(1)} KB • AES-256-GCM
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Downloads Left:</span>
                <span className="text-cyan-400 font-bold">{shareInfo.downloads_remaining}</span>
              </div>
            </div>

            {shareInfo.watermark_enabled && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>Security Notice: Dynamic watermark stamped upon download.</span>
              </div>
            )}

            {shareInfo.has_password && (
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Access Password Required</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter link password"
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={downloading || shareInfo.downloads_remaining <= 0}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Decrypting & Verifying...' : 'Decrypt & Download File'}</span>
            </button>
          </form>
        ) : null}

        <div className="text-center pt-2">
          <button
            onClick={onBackToHome}
            className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-all"
          >
            ← Return to SecureAI Vault Home
          </button>
        </div>
      </div>
    </div>
  );
};
