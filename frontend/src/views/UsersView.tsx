import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (err: any) {
      alert(`Role update failed: ${err.message}`);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      await apiRequest(`/users/${userId}/toggle-active`, { method: 'PATCH' });
      fetchUsers();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">User Governance & RBAC</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Role-Based Access Control • Account Lockout Protection • Multi-Factor Status
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">MFA Protected</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 font-sans border border-slate-700">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-white font-sans">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs px-2.5 py-1 rounded-lg focus:outline-none"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Security Admin">Security Admin</option>
                      <option value="Organization Admin">Organization Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Employee">Employee</option>
                      <option value="Auditor">Auditor</option>
                      <option value="Guest">Guest</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.mfa_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {u.mfa_enabled ? 'MFA ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {u.is_active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleActive(u.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        u.is_active
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {u.is_active ? 'Disable' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
