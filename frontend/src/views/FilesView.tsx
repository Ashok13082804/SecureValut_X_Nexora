import React, { useState, useEffect } from 'react';
import {
  UploadCloud, FileText, ShieldAlert, ShieldCheck, Share2,
  Download, Trash2, Eye, Lock, RefreshCw, CheckCircle2, AlertTriangle, Copy, Check
} from 'lucide-react';
import { apiRequest } from '../api/client';

interface FilesViewProps {
  onSelectFile: (fileId: string) => void;
  onOpenShareModal: (fileId: string) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({ onSelectFile, onOpenShareModal }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressStage, setUploadProgressStage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/files');
      setFiles(data);
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    // Visual animated pipeline stages
    const stages = [
      'Stage 1/8: Extension & MIME Policy Validation',
      'Stage 2/8: Generating SHA-256 Pre-Encryption Fingerprint',
      'Stage 3/8: Static Threat & Heuristic Payload Inspection',
      'Stage 4/8: Machine Learning & Anomaly Detection Inference',
      'Stage 5/8: NLP Data Loss Prevention & Credential Extraction',
      'Stage 6/8: Risk Fusion & Threat Score Synthesis',
      'Stage 7/8: AES-256-GCM Cryptographic Encryption & Storage',
      'Stage 8/8: Minting Tamper-Evident Blockchain Audit Block'
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setUploadProgressStage(stages[stageIdx]);
        stageIdx++;
      }
    }, 450);

    try {
      await apiRequest('/files/upload', {
        method: 'POST',
        body: formData,
      });
      clearInterval(interval);
      setUploadProgressStage('Secure Upload Completed Successfully!');
      setTimeout(() => {
        setUploading(false);
        setUploadProgressStage(null);
        fetchFiles();
      }, 700);
    } catch (err: any) {
      clearInterval(interval);
      alert(`Upload rejected: ${err.message}`);
      setUploading(false);
      setUploadProgressStage(null);
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const blob = await apiRequest<Blob>(`/files/${fileId}/download?watermark=true`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Download Failed: ${err.message}`);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file and record the deletion to the blockchain?')) return;
    try {
      await apiRequest(`/files/${fileId}`, { method: 'DELETE' });
      fetchFiles();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredFiles = files.filter((f) => {
    if (filter === 'SAFE') return f.threat_classification === 'Safe';
    if (filter === 'THREAT') return f.threat_classification === 'High Risk' || f.is_quarantined;
    if (filter === 'CONFIDENTIAL') return f.nlp_classification === 'Confidential' || f.nlp_classification === 'Highly Confidential';
    return true;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Secure File Repository</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            AES-256-GCM Encrypted Storage • Dynamic Watermarking • Blockchain Integrity Protected
          </p>
        </div>
        <button
          onClick={fetchFiles}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="relative border-2 border-dashed border-slate-700/80 hover:border-cyan-500/50 rounded-2xl p-8 text-center bg-slate-900/40 backdrop-blur-sm transition-all group overflow-hidden">
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />
        <div className="space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Click or drag files to securely upload & inspect</h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, DOCX, XLSX, PPTX, TXT, CSV, Images, safe ZIP up to 100MB
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Encrypted with unique per-file AES-256-GCM key before writing to disk</span>
          </div>
        </div>

        {/* Upload Animated Pipeline Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-[#090d16]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="text-center space-y-1">
              <div className="text-sm font-bold text-white font-mono">{uploadProgressStage}</div>
              <p className="text-xs text-slate-400">Zero-Trust Pipeline in Execution...</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {['ALL', 'SAFE', 'THREAT', 'CONFIDENTIAL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                filter === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab === 'ALL' ? 'All Files' : tab === 'SAFE' ? 'Verified Safe' : tab === 'THREAT' ? 'Threats / Quarantined' : 'Confidential DLP'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {filteredFiles.length} file(s)
        </span>
      </div>

      {/* Files Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">File Name & Type</th>
                <th className="p-4">SHA-256 Fingerprint</th>
                <th className="p-4">Threat Score</th>
                <th className="p-4">DLP Level</th>
                <th className="p-4">Integrity</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    No files found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const isThreat = file.threat_score >= 50 || file.is_quarantined;
                  const isSafe = file.threat_score <= 20;

                  return (
                    <tr key={file.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & Size */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 font-bold uppercase text-[11px] border border-slate-700">
                            {file.file_extension}
                          </div>
                          <div>
                            <div className="font-semibold text-white font-sans truncate max-w-xs">{file.original_name}</div>
                            <div className="text-[11px] text-slate-400">
                              {(file.file_size / 1024).toFixed(1)} KB • v{file.current_version}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hash with copy */}
                      <td className="p-4">
                        <button
                          onClick={() => copyToClipboard(file.sha256_hash)}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 group"
                          title="Copy SHA-256 hash"
                        >
                          <span>{file.sha256_hash.slice(0, 10)}...{file.sha256_hash.slice(-6)}</span>
                          {copiedHash === file.sha256_hash ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Threat Score */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isThreat
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isSafe
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isThreat ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          <span>{file.threat_score}/100 {file.threat_classification}</span>
                        </span>
                      </td>

                      {/* DLP */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          file.nlp_classification === 'Highly Confidential' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          file.nlp_classification === 'Confidential' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                          file.nlp_classification === 'Internal' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {file.nlp_classification}
                        </span>
                      </td>

                      {/* Integrity */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                          file.integrity_status === 'VERIFIED' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{file.integrity_status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectFile(file.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all"
                            title="Deep Security Inspection"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenShareModal(file.id)}
                            disabled={file.is_quarantined}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-400 transition-all disabled:opacity-40"
                            title="Create Expiring Share Link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(file.id, file.original_name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-all"
                            title="Decrypt & Download (Integrity Checked)"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                            title="Delete File"
                          >
                            <Trash2 className="w-4 h-4" />
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
