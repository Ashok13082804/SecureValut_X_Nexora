import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Plus, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';

export const PoliciesView: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditionType, setConditionType] = useState('DLP_RULE');
  const [conditionExpr, setConditionExpr] = useState('contains_api_keys == true');
  const [action, setAction] = useState('BLOCK');

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/policies');
      setPolicies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleToggle = async (policyId: string) => {
    try {
      await apiRequest(`/policies/${policyId}/toggle`, { method: 'PATCH' });
      fetchPolicies();
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/policies', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          condition_type: conditionType,
          condition_expression: conditionExpr,
          action,
        }),
      });
      setShowCreate(false);
      setName('');
      setDescription('');
      fetchPolicies();
    } catch (err: any) {
      alert(`Create failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Security Policy Engine</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Automated Rules • Conditional Containment • DLP & Threat Interception
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
        >
          <Plus className="w-4 h-4" />
          <span>New Policy Rule</span>
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((pol) => (
          <div
            key={pol.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{pol.name}</span>
              <button
                onClick={() => handleToggle(pol.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all ${
                  pol.is_active
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {pol.is_active ? 'ACTIVE' : 'DISABLED'}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{pol.description}</p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Condition Type:</span>
                <span className="text-cyan-400">{pol.condition_type}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Expression:</span>
                <span className="text-amber-400">{pol.condition_expression}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Enforced Action:</span>
                <span className="text-rose-400 font-bold">{pol.action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Policy Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-mono">Create Security Policy Rule</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Policy Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Block API Key Exfiltration"
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Disallow sharing documents containing raw AWS or OpenAI tokens"
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Condition Expression</label>
                  <input
                    type="text"
                    value={conditionExpr}
                    onChange={(e) => setConditionExpr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                  >
                    <option value="BLOCK">BLOCK</option>
                    <option value="QUARANTINE">QUARANTINE</option>
                    <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL</option>
                    <option value="ALERT">ALERT</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
