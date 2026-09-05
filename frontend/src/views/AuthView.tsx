import React, { useState } from 'react';
import { Shield, Lock, Mail, User as UserIcon, Eye, EyeOff, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { apiRequest, authStorage, User } from '../api/client';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBackToLanding }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Employee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA Challenge State
  const [showMFA, setShowMFA] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username_or_email: emailOrUser,
          password,
        }),
      });

      if (data.requires_mfa) {
        setMfaUserId(data.user_id);
        setShowMFA(true);
      } else {
        authStorage.setToken(data.access_token);
        authStorage.setUser(data.user);
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          email,
          username,
          password,
          role,
        }),
      });
      // Automatically login after successful registration
      setEmailOrUser(username);
      setIsLogin(true);
      setError('Registration successful! Please login with your credentials.');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/auth/verify-mfa', {
        method: 'POST',
        body: JSON.stringify({
          user_id: mfaUserId,
          code: mfaCode,
        }),
      });
      authStorage.setToken(data.access_token);
      authStorage.setUser(data.user);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'MFA validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string) => {
    setEmailOrUser(presetEmail);
    setPassword('Password@123!');
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username_or_email: presetEmail,
          password: 'Password@123!',
        }),
      });
      authStorage.setToken(data.access_token);
      authStorage.setUser(data.user);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 cyber-grid">
      <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">SecureAI Vault</h2>
          <p className="text-xs text-slate-400 font-mono">Enterprise Zero-Trust Authentication</p>
        </div>

        {/* Error / Alert banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {showMFA ? (
          /* MFA Challenge Form */
          <form onSubmit={handleMFAVerify} className="space-y-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-1">
              <KeyRound className="w-6 h-6 text-cyan-400 mx-auto" />
              <div className="text-xs font-bold text-white">MFA Authentication Required</div>
              <p className="text-[11px] text-slate-400">Enter your 6-digit TOTP authenticator code (e.g. 123456)</p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono">6-Digit Security Token</label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-900 border border-slate-800 text-center text-xl tracking-widest text-white px-4 py-2.5 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify Token & Proceed'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Standard Auth Form */
          <div>
            {/* Tabs */}
            <div className="flex p-1 bg-slate-900 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isLogin ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  !isLogin ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {isLogin ? (
              /* Login Form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">Username or Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={emailOrUser}
                      onChange={(e) => setEmailOrUser(e.target.value)}
                      placeholder="admin@secureai.local"
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-10 py-2.5 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Vault'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">Corporate Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="marcus@secureai.local"
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="marcus.v"
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">Role Designation</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                  >
                    <option value="Employee">Employee (Standard Access)</option>
                    <option value="Manager">Manager (Clearance Approvals)</option>
                    <option value="Security Admin">Security Admin (SOC Ops)</option>
                    <option value="Auditor">Auditor (Blockchain Observer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-mono">Password (min 8 chars)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-cyan-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Creating Account...' : 'Register Secure Identity'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Demo Logins */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono text-center mb-3">
                Or Instant Demo Sign-In:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@secureai.local')}
                  className="px-2 py-2 rounded-lg bg-slate-900 hover:bg-cyan-500/10 text-cyan-400 border border-slate-800 hover:border-cyan-500/30 text-[11px] font-mono font-medium transition-all text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('soc_analyst@secureai.local')}
                  className="px-2 py-2 rounded-lg bg-slate-900 hover:bg-indigo-500/10 text-indigo-400 border border-slate-800 hover:border-indigo-500/30 text-[11px] font-mono font-medium transition-all text-center"
                >
                  SOC Lead
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('john.doe@secureai.local')}
                  className="px-2 py-2 rounded-lg bg-slate-900 hover:bg-emerald-500/10 text-emerald-400 border border-slate-800 hover:border-emerald-500/30 text-[11px] font-mono font-medium transition-all text-center"
                >
                  Employee
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            onClick={onBackToLanding}
            className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-all"
          >
            ← Return to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
