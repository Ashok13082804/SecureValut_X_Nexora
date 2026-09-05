import React, { useState, useEffect } from 'react';
import {
  Link2, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2,
  Wrench, Bug, Lock, ArrowDown, Copy, Check
} from 'lucide-react';
import { apiRequest } from '../api/client';

export const BlockchainView: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/blockchain/blocks');
      setBlocks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await apiRequest('/blockchain/verify');
      setVerification(res);
    } catch (err: any) {
      alert(`Verification check error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async (blockIndex: number) => {
    try {
      await apiRequest('/blockchain/tamper', {
        method: 'POST',
        body: JSON.stringify({ block_index: blockIndex }),
      });
      await fetchBlocks();
      await handleVerify();
    } catch (err: any) {
      alert(`Tamper simulation error: ${err.message}`);
    }
  };

  const handleRepair = async () => {
    try {
      await apiRequest('/blockchain/repair', { method: 'POST' });
      await fetchBlocks();
      await handleVerify();
    } catch (err: any) {
      alert(`Repair error: ${err.message}`);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Permissioned Blockchain Audit Ledger</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Cryptographic SHA-256 Chaining • Tamper-Evident Record • Zero File Storage on Chain
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifying ? 'Verifying Hashes...' : 'Verify Blockchain Integrity'}</span>
          </button>

          <button
            onClick={() => handleSimulateTamper(blocks.length > 1 ? blocks[1].block_index : 0)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
            title="Demonstrate how unauthorized database changes are instantly caught"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Simulate Tamper</span>
          </button>

          <button
            onClick={handleRepair}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-medium flex items-center gap-1.5 transition-all"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Repair Ledger</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between backdrop-blur-md ${
          verification.is_valid
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-3">
            {verification.is_valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0 animate-pulse" />
            )}
            <div>
              <div className="text-sm font-bold font-mono">
                {verification.is_valid ? '✓ Blockchain Integrity Verified (100% Immutable)' : '⚠ Blockchain Tampering Detected!'}
              </div>
              <p className="text-xs opacity-90">{verification.message}</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            Checked {verification.total_blocks} Blocks
          </span>
        </div>
      )}

      {/* Visual Block Ledger Chain */}
      <div className="space-y-4">
        <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
          Chronological Audit Blocks ({blocks.length} Minted)
        </div>

        <div className="space-y-4">
          {blocks.map((block, idx) => {
            const isGenesis = block.block_index === 0;
            const isTampered = verification && !verification.is_valid && verification.tampered_block_index === block.block_index;

            return (
              <React.Fragment key={block.id || idx}>
                <div
                  className={`p-5 rounded-2xl bg-slate-900/70 border backdrop-blur-md font-mono text-xs transition-all space-y-3 shadow-lg shadow-black/20 ${
                    isTampered
                      ? 'border-rose-500 bg-rose-950/20 ring-2 ring-rose-500/30'
                      : isGenesis
                      ? 'border-cyan-500/30 bg-cyan-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Block Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                        Block #{block.block_index}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isGenesis ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {block.event_type}
                      </span>
                      {isTampered && (
                        <span className="px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-bold text-[10px] animate-pulse">
                          TAMPER SIGNATURE IDENTIFIED
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      Timestamp: {new Date(block.timestamp * 1000).toUTCString()}
                    </span>
                  </div>

                  {/* Hashes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-500 text-[10px]">CURRENT BLOCK HASH</span>
                      <div className="flex items-center justify-between gap-2 text-emerald-400 break-all font-mono">
                        <span>{block.current_hash}</span>
                        <button
                          onClick={() => copyHash(block.current_hash)}
                          className="text-slate-500 hover:text-white flex-shrink-0"
                        >
                          {copiedHash === block.current_hash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                      <span className="text-slate-500 text-[10px]">PREVIOUS BLOCK HASH</span>
                      <div className="flex items-center justify-between gap-2 text-slate-400 break-all font-mono">
                        <span>{block.previous_hash}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata details */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[11px] pt-1">
                    <div>
                      Actor: <span className="text-white font-semibold">{block.actor_reference}</span>
                    </div>
                    {block.file_hash && (
                      <div>
                        File SHA-256: <span className="text-cyan-400">{block.file_hash.slice(0, 16)}...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow connecting to next block */}
                {idx < blocks.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-cyan-500/40" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
