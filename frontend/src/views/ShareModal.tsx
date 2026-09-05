import React, { useState } from 'react';
import { X, Share2, Copy, Check, Lock, ShieldCheck, Clock, Download } from 'lucide-react';
import { apiRequest } from '../api/client';

interface ShareModalProps {
  fileId: string | null;
  onClose: () => void;
  onShareCreated?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ fileId, onClose, onShareCreated }) => {
  const [shareType, setShareType] = useState('link');
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [downloadLimit, setDownloadLimit] = useState(5);
  const [expiresHours, setExpiresHours] = useState(24);
  const [password, setPassword] = useState('');
  const [watermark, setWatermark] = useState(true);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);

  const [createdShare, setCreatedShare] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!fileId) return null;

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiRequest('/shares', {
        method: 'POST',
        body: JSON.stringify({
          file_id: fileId,
          share_type: shareType,
          target_identifier: targetIdentifier || null,
          download_limit: downloadLimit,
          expires_in_hours: expiresHours,
          password: password || null,
          watermark_enabled: watermark,
          requires_mfa: requiresMfa,
          view_only: viewOnly,
          allow_download: !viewOnly
        })
      });
      setCreatedShare(data);
      if (onShareCreated) onShareCreated();
    } catch (err: any) {
      alert(`Share creation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    if (!createdShare) return;
    const fullUrl = `${window.location.origin}${createdShare.share_url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Generate Secure Expiring Share</h3>
              <p className="text-xs text-slate-400">Zero-Trust access with cryptographic download limits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdShare ? (
          /* Share Link Created Output */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Secure Share Link Active</h4>
              <p className="text-xs text-slate-300">
                Link expires in {expiresHours}h or after {downloadLimit} download(s).
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">Encrypted Share URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${createdShare.share_url}`}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-cyan-400 px-3 py-2.5 rounded-xl font-mono"
                />
                <button
                  onClick={copyShareLink}
                  className="px-3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs text-slate-400 font-mono">
              <div>• Watermarking: {watermark ? 'Enforced (Recipient Stamped)' : 'Off'}</div>
              <div>• Password Protection: {password ? 'Enabled' : 'Disabled'}</div>
              <div>• Blockchain Event: Recorded as FILE_SHARED</div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all mt-2"
            >
              Done
            </button>
          </div>
        ) : (
          /* Creation Form */
          <form onSubmit={handleCreateShare} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">Expires After</label>
                <select
                  value={expiresHours}
                  onChange={(e) => setExpiresHours(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                >
                  <option value={1}>1 Hour</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">Max Downloads</label>
                <select
                  value={downloadLimit}
                  onChange={(e) => setDownloadLimit(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                >
                  <option value={1}>1 Single Download</option>
                  <option value={3}>3 Downloads</option>
                  <option value={5}>5 Downloads</option>
                  <option value={20}>20 Downloads</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono">Optional Password Protection</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for public token access"
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={watermark}
                  onChange={(e) => setWatermark(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <span>Apply Dynamic Recipient Watermark on Download</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={viewOnly}
                  onChange={(e) => setViewOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
                <span>View Only (Prohibit Raw Binary Download)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Minting Share Token...' : 'Generate Expiring Share Link'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
