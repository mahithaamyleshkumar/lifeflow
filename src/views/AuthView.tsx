import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Flame, Shield, ArrowRight, CheckCircle, User as UserIcon, Mail, Lock } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seedSample, setSeedSample] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !email.trim()) {
      setError('Please enter your name to sign in');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(name.trim(), email.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please complete all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password.trim(), seedSample);
    } catch (err: any) {
      setError(err.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10131a] text-[#e1e2ec] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-600 p-[1px] glow-cyan mb-4">
            <div className="w-full h-full bg-[#10131a] rounded-[15px] flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-2xl leading-none">∞</span>
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-headline font-bold text-white tracking-tight">
            LifeFlow
          </h1>
          <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
            Plan your life. Track your progress. Become your best self.
          </p>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#191b23] border border-white/10 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-[#10131a] p-1 border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'signup'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Your Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. Mahithaa)"
                    autoComplete="name"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                    required
                  />
                  <UserIcon className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase text-white/60">
                    Email Address
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">optional</span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase text-white/60">
                    Password
                  </label>
                  <span className="text-[10px] text-white/40 font-mono">optional</span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Signing In to LifeFlow...</span>
                ) : (
                  <>
                    <span>Sign In & Enter LifeFlow</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Full Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mahithaa"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                    required
                  />
                  <UserIcon className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                    required
                  />
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                  Password <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#10131a] border border-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-colors"
                    required
                  />
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-white/70 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={seedSample}
                  onChange={(e) => setSeedSample(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-[#10131a] text-cyan-400 focus:ring-0 focus:ring-offset-0"
                />
                <span>Include optional starter templates & habit framework</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-black font-semibold text-xs transition-all shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Setting Up Your Flow...</span>
                ) : (
                  <>
                    <span>Create Account & Start</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security / Persistence reassurance footer */}
        <div className="flex items-center justify-center gap-2 text-center text-[11px] text-white/40 mt-6 font-mono">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Persistent PostgreSQL Authentication • Secure Session Token</span>
        </div>
      </div>
    </div>
  );
};
