import React, { useState, useEffect } from 'react';
import { LifeBuoy, AlertTriangle, ShieldCheck, Clock, User, CheckCircle2, RefreshCw, MessageSquare } from 'lucide-react';
import { apiRequest } from '../api/client';

export const IncidentsView: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/incidents');
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setUpdating(true);
    try {
      await apiRequest(`/incidents/${selectedIncident.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus || selectedIncident.status,
          investigation_notes: newNotes,
        }),
      });
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Incident Response Management</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Automated Escalations • SOC Analyst Workflow • Containment & Forensic Notes
          </p>
        </div>
        <button
          onClick={fetchIncidents}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.map((inc) => {
          const isCrit = inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
          const isOpen = inc.status === 'OPEN';

          return (
            <div
              key={inc.id}
              className={`p-6 rounded-2xl bg-slate-900/70 border backdrop-blur-md space-y-3 transition-all ${
                isCrit ? 'border-rose-500/30' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-400">{inc.incident_number}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isCrit ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {inc.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isOpen ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {inc.status}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">{inc.title}</h3>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Category:</span>
                  <span className="text-slate-200">{inc.category}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Risk Score:</span>
                  <span className="text-rose-400 font-bold">{inc.risk_score}/100</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Lead Analyst:</span>
                  <span className="text-cyan-400">{inc.assigned_analyst}</span>
                </div>
              </div>

              {inc.investigation_notes && (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Investigation Notes:</span>
                  <p className="leading-relaxed">{inc.investigation_notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setSelectedIncident(inc);
                    setNewStatus(inc.status);
                    setNewNotes(inc.investigation_notes || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/40 text-xs font-mono transition-all"
                >
                  Manage Incident
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incident Edit Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-mono">Update {selectedIncident.incident_number}</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Containment Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono"
                >
                  <option value="OPEN">OPEN (Under Alert)</option>
                  <option value="INVESTIGATING">INVESTIGATING (Forensics Active)</option>
                  <option value="CONTAINED">CONTAINED (Isolated / Blocked)</option>
                  <option value="RESOLVED">RESOLVED (Mitigated)</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE (Dismissed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Analyst Notes & Actions Taken</label>
                <textarea
                  rows={4}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Record containment actions, sandbox results, user interviews..."
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  {updating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
