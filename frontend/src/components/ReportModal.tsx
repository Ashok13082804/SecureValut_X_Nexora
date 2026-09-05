import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle2, ShieldAlert } from 'lucide-react';
import { apiRequest } from '../api/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (type: 'pdf' | 'json' | 'threats_csv' | 'incidents_csv') => {
    setDownloading(type);
    try {
      let endpoint = '';
      let filename = '';

      if (type === 'pdf') {
        endpoint = '/reports/export/pdf';
        filename = `SecureAI_Audit_Report_${Date.now()}.pdf`;
      } else if (type === 'json') {
        endpoint = '/reports/export/json';
        filename = `SecureAI_Telemetry_${Date.now()}.json`;
      } else if (type === 'threats_csv') {
        endpoint = '/reports/export/csv?target=threats';
        filename = `SecureAI_Threats_${Date.now()}.csv`;
      } else if (type === 'incidents_csv') {
        endpoint = '/reports/export/csv?target=incidents';
        filename = `SecureAI_Incidents_${Date.now()}.csv`;
      }

      const blob = await apiRequest<Blob>(endpoint);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Generate Cybersecurity Audit Reports</h3>
              <p className="text-xs text-slate-400">Export verified compliance & threat intelligence records</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* PDF Formal Report */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Executive SOC Audit Report (PDF)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">FORMAL</span>
              </div>
              <p className="text-xs text-slate-400">Complete cryptographic audit summary, threat matrices, and incident telemetry.</p>
            </div>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading === 'pdf'}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === 'pdf' ? 'Exporting...' : 'Download'}</span>
            </button>
          </div>

          {/* JSON Telemetry */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between hover:border-indigo-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Raw SOC Telemetry (JSON)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">SIEM READY</span>
              </div>
              <p className="text-xs text-slate-400">Structured JSON feed suitable for integration with Splunk, Elastic, or Sentinel.</p>
            </div>
            <button
              onClick={() => handleDownload('json')}
              disabled={downloading === 'json'}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 transition-all border border-slate-700 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{downloading === 'json' ? 'Exporting...' : 'JSON'}</span>
            </button>
          </div>

          {/* CSV Detections */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('threats_csv')}
              disabled={downloading === 'threats_csv'}
              className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-all group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400">Threats Dataset (CSV)</div>
              <p className="text-[11px] text-slate-500 mt-1">Entropy, static vectors, and classifications.</p>
            </button>
            <button
              onClick={() => handleDownload('incidents_csv')}
              disabled={downloading === 'incidents_csv'}
              className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-left transition-all group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400">Incidents Log (CSV)</div>
              <p className="text-[11px] text-slate-500 mt-1">Status, analysts, and evidence trails.</p>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
