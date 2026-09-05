import React, { useState, useEffect } from 'react';
import { FileSearch, Shield, Key, Mail, Phone, Lock, Play, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';

export const NLPView: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Live NLP scan test state
  const [testFilename, setTestFilename] = useState('internal_memo.txt');
  const [testText, setTestText] = useState(
    'CONFIDENTIAL: AWS Secret Key AKIAIOSFODNN7EXAMPLE and OpenAI token sk-abc1234567890abcdef1234567890. Email contact: compliance@defense.org, Phone: +1-555-019-4820.'
  );
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    apiRequest('/nlp/summary')
      .then((data) => setSummary(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTestScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true);
    try {
      const res = await apiRequest('/nlp/test-scan', {
        method: 'POST',
        body: JSON.stringify({
          filename: testFilename,
          content_text: testText,
        }),
      });
      setScanResult(res);
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">NLP & Data Loss Prevention (DLP)</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Named Entity Recognition • API Key / Credential Pattern Scanning • Automated Document Classification
          </p>
        </div>
      </div>

      {/* Sensitive Data KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Documents Analyzed</span>
            <FileSearch className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{summary?.total_documents_analyzed || 4}</div>
          <p className="text-[10px] text-slate-500 font-sans">Full text ingested & parsed</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>API Keys Discovered</span>
            <Key className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{summary?.discovered_api_tokens_count || 0}</div>
          <p className="text-[10px] text-slate-500 font-sans">AWS, OpenAI, GitHub tokens</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>PII Email Addresses</span>
            <Mail className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{summary?.discovered_emails_count || 2}</div>
          <p className="text-[10px] text-slate-500 font-sans">Extracted corporate identities</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Confidential Tier</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400">{summary?.confidential_documents_count || 2}</div>
          <p className="text-[10px] text-slate-500 font-sans">Clearance required for share</p>
        </div>
      </div>

      {/* Document Classification Distribution */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white font-mono uppercase">Repository Classification Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Public', count: summary?.classifications_breakdown?.Public || 1, color: 'text-slate-300', bg: 'bg-slate-800/60', border: 'border-slate-700' },
            { label: 'Internal', count: summary?.classifications_breakdown?.Internal || 1, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
            { label: 'Confidential', count: summary?.classifications_breakdown?.Confidential || 1, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
            { label: 'Highly Confidential', count: summary?.classifications_breakdown?.['Highly Confidential'] || 1, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
          ].map((c, i) => (
            <div key={i} className={`p-4 rounded-xl ${c.bg} border ${c.border} text-center space-y-1 font-mono`}>
              <span className={`text-xs font-bold ${c.color}`}>{c.label}</span>
              <div className="text-2xl font-extrabold text-white">{c.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live DLP Scanner Testing Tool */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Interactive DLP Inspection Sandbox</h3>
        </div>
        <p className="text-xs text-slate-400">
          Paste unstructured document text or configuration snippets to simulate real-time DLP redaction and confidentiality classification.
        </p>

        <form onSubmit={handleTestScan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono text-slate-400">Target Document Name</label>
              <input
                type="text"
                value={testFilename}
                onChange={(e) => setTestFilename(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-mono text-slate-400">Document Text Payload</label>
              <textarea
                rows={3}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={scanning}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <span>{scanning ? 'Analyzing Text...' : 'Run DLP Inspection'}</span>
              <Play className="w-3.5 h-3.5 fill-slate-950" />
            </button>
          </div>
        </form>

        {scanResult && (
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs mt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-400">Classification Outcome:</span>
              <span className={`font-bold px-2.5 py-1 rounded text-xs ${
                scanResult.sensitivity_classification === 'Highly Confidential' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                scanResult.sensitivity_classification === 'Confidential' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {scanResult.sensitivity_classification} ({(scanResult.confidence * 100).toFixed(1)}% Confidence)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px]">API Keys:</span>
                <div className="text-sm font-bold text-rose-400">{scanResult.api_key_count}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px]">Emails:</span>
                <div className="text-sm font-bold text-amber-400">{scanResult.email_count}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px]">Phones:</span>
                <div className="text-sm font-bold text-sky-400">{scanResult.phone_count}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px]">Keywords:</span>
                <div className="text-sm font-bold text-purple-400">{scanResult.confidential_terms_count}</div>
              </div>
            </div>

            {scanResult.detected_entities?.tokens?.length > 0 && (
              <div className="space-y-1 pt-2">
                <span className="text-slate-400 text-[11px] font-bold">Masked Token Detections:</span>
                <div className="space-y-1">
                  {scanResult.detected_entities.tokens.map((t: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-rose-400 flex justify-between">
                      <span>{t.type}</span>
                      <span>{t.preview}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
