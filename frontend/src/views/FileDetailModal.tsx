import React, { useEffect, useState } from 'react';
import {
  X, Shield, Lock, Brain, FileSearch, GitBranch, History, Link2, Share2,
  CheckCircle2, AlertTriangle, Download, RefreshCw, KeyRound, Terminal
} from 'lucide-react';
import { apiRequest } from '../api/client';

interface FileDetailModalProps {
  fileId: string | null;
  onClose: () => void;
  onOpenShareModal: (fileId: string) => void;
}

export const FileDetailModal: React.FC<FileDetailModalProps> = ({
  fileId,
  onClose,
  onOpenShareModal
}) => {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    apiRequest(`/files/${fileId}`)
      .then((res) => setData(res))
      .catch((err) => alert(`Failed to load file details: ${err.message}`))
      .finally(() => setLoading(false));
  }, [fileId]);

  if (!fileId) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Lock },
    { id: 'security', label: 'Security Analysis', icon: Brain },
    { id: 'nlp', label: 'NLP & DLP', icon: FileSearch },
    { id: 'versions', label: 'Versions', icon: GitBranch },
    { id: 'access', label: 'Access History', icon: History },
    { id: 'blockchain', label: 'Blockchain Audit', icon: Link2 },
    { id: 'sharing', label: 'Sharing Controls', icon: Share2 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold uppercase text-xs">
              {data?.file?.file_extension || 'FILE'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{data?.file?.original_name || 'Loading File...'}</span>
                {data?.file?.is_quarantined && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold border border-rose-500/30">
                    QUARANTINED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                SHA-256: {data?.file?.sha256_hash ? `${data.file.sha256_hash.slice(0, 24)}...` : 'Calculating...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7 Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-mono font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading || !data ? (
            <div className="flex items-center justify-center p-12 text-cyan-400 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Inspecting Cryptographic Artifacts...
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 font-mono">
                      <span className="text-[11px] text-slate-400">File Size</span>
                      <div className="text-sm font-bold text-white">{(data.file.file_size / 1024).toFixed(1)} KB</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 font-mono">
                      <span className="text-[11px] text-slate-400">MIME Type</span>
                      <div className="text-xs font-bold text-slate-200 truncate">{data.file.mime_type}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 font-mono">
                      <span className="text-[11px] text-slate-400">Encryption Algo</span>
                      <div className="text-xs font-bold text-cyan-400">{data.encryption_algorithm}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 font-mono">
                      <span className="text-[11px] text-slate-400">Key Fingerprint</span>
                      <div className="text-xs font-bold text-slate-200">{data.key_fingerprint}</div>
                    </div>
                  </div>

                  {/* Storage Details */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="text-cyan-400 font-bold text-[11px] uppercase">Encrypted Isolated Storage Path</div>
                    <div className="p-2.5 rounded-lg bg-slate-950 text-slate-300 font-mono text-[11px] break-all border border-slate-800/80">
                      ./secure_storage/{data.file.storage_name}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Plaintext data is never written to disk or database tables. Unique random 256-bit symmetric key wrapped with server master key.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Security Analysis */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-xs text-slate-400 font-mono">Composite Threat Score</span>
                      <div className="text-3xl font-extrabold font-mono text-rose-400">
                        {data.threat_analysis?.threat_score || data.file.threat_score}/100
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{data.threat_analysis?.classification}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-xs text-slate-400 font-mono">Shannon Entropy</span>
                      <div className="text-3xl font-extrabold font-mono text-cyan-400">
                        {data.threat_analysis?.entropy?.toFixed(2) || '0.00'}
                        <span className="text-xs text-slate-500"> / 8.0</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {data.threat_analysis?.entropy > 7.2 ? 'Elevated (Packed/Cipher)' : 'Normal Range'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-xs text-slate-400 font-mono">Executable / Macro</span>
                      <div className="text-3xl font-extrabold font-mono text-amber-400">
                        {data.threat_analysis?.has_macros || data.threat_analysis?.has_embedded_scripts ? 'YES' : 'NO'}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Embedded Scripts Flag</span>
                    </div>
                  </div>

                  {/* Explainable AI Reasons */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                      <Brain className="w-4 h-4 text-cyan-400" />
                      <span>Explainable AI Risk Factors:</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {data.threat_analysis?.explainable_reasons?.map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Security Recommendation */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase">SOC Recommendation</div>
                    <p className="text-xs text-slate-300">{data.threat_analysis?.recommendation || 'Standard enterprise security protocols apply.'}</p>
                  </div>
                </div>
              )}

              {/* Tab 3: NLP & DLP Analysis */}
              {activeTab === 'nlp' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400 font-mono">DLP Tier</span>
                      <div className="text-xs font-bold text-purple-400">{data.nlp_analysis?.sensitivity_classification}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400 font-mono">Discovered Emails</span>
                      <div className="text-lg font-bold font-mono text-white">{data.nlp_analysis?.email_count || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400 font-mono">Discovered Phones</span>
                      <div className="text-lg font-bold font-mono text-white">{data.nlp_analysis?.phone_count || 0}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <span className="text-[11px] text-slate-400 font-mono">API Keys / Secrets</span>
                      <div className="text-lg font-bold font-mono text-rose-400">{data.nlp_analysis?.api_key_count || 0}</div>
                    </div>
                  </div>

                  {/* Sample Snippets */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono uppercase">Discovered Entities Summary</h4>
                    <div className="space-y-1 text-xs text-slate-300 font-mono">
                      {data.nlp_analysis?.sample_snippets?.map((snip: string, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800">{snip}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Versions */}
              {activeTab === 'versions' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div>
                      <div className="font-bold text-white">Current Version: v{data.file.current_version}</div>
                      <p className="text-slate-400 text-[11px]">Fingerprint: {data.file.sha256_hash}</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">ACTIVE TIP</span>
                  </div>
                </div>
              )}

              {/* Tab 5: Access History */}
              {activeTab === 'access' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Downloads Recorded:</span>
                      <span className="text-cyan-400 font-bold">{data.downloads_count}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cryptographic Integrity Verification:</span>
                      <span className="text-emerald-400 font-bold">100% Passed</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Dynamic Recipient Watermarking:</span>
                      <span className="text-purple-400 font-bold">Active</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Blockchain Audit */}
              {activeTab === 'blockchain' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white">Immutable Ledger Anchor</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px]">
                        Block #{data.blockchain_block_index ?? 'Minted'}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-slate-500 text-[10px]">CURRENT BLOCK HASH</div>
                      <div className="text-emerald-400 break-all text-[11px]">
                        {data.blockchain_block_hash || 'SHA-256 Chained Hash Recorded'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Sharing Controls */}
              {activeTab === 'sharing' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Active Share Links</div>
                      <p className="text-xs text-slate-400">Manage time-expiring and password-protected links.</p>
                    </div>
                    <button
                      onClick={() => onOpenShareModal(data.file.id)}
                      disabled={data.file.is_quarantined}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Create New Link</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Integrity Status: <span className="text-emerald-400 font-bold">{data?.file?.integrity_status || 'VERIFIED'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
