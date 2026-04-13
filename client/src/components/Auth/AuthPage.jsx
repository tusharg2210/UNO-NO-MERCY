import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../utils/serverUrl.js';

const AuthPage = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [quickPlayName, setQuickPlayName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error('Please fill all required fields');
    }
    if (!isLogin && !formData.username) {
      return toast.error('Username is required');
    }
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Server error. Please try again.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      localStorage.setItem('token', data.token);
      toast.success(isLogin ? 'Welcome back' : 'Account created');
      onAuth(data.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPlay = () => {
    const name = quickPlayName.trim();
    if (!name) {
      toast.error('Enter your name to use Quick Play');
      return;
    }
    if (name.length > 32) {
      toast.error('Name must be 32 characters or less');
      return;
    }
    onAuth({
      id: Date.now(),
      username: name,
      isGuest: true,
    });
    toast.success(`Playing as ${name}`);
  };

  return (
    <div
      className="auth-shell flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-8"
      style={{
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full min-w-0 max-w-md">
        <div className="mx-auto mb-10 h-px w-12 bg-zinc-700" />

        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
            Stack · Draw · No mercy
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-tight">
            UNO <span className="text-zinc-400">No Mercy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-zinc-500 sm:text-[15px]">
            Open a room, share a code, play in the browser.
          </p>
        </div>

        <div className="auth-card p-6 sm:p-8">
          <div className="flex gap-1 rounded-xl bg-zinc-950/80 p-1 ring-1 ring-zinc-800/80">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/80'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/80'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Username</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Your name on the table"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Email</label>
              <input
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="auth-btn-primary w-full">
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900" />
                  Hang tight…
                </span>
              ) : isLogin ? (
                'Enter the lobby'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">or</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/30 p-5 sm:p-6">
            <label htmlFor="quick-play-name" className="mb-1.5 block text-xs font-medium text-zinc-500">
              Quick play
            </label>
            <input
              id="quick-play-name"
              type="text"
              className="auth-input mb-3"
              placeholder="Display name"
              value={quickPlayName}
              onChange={(e) => setQuickPlayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleQuickPlay();
                }
              }}
              maxLength={32}
              autoComplete="nickname"
            />
            <p className="mb-4 text-xs leading-relaxed text-zinc-600">
              No password. You can register later if you want an account.
            </p>
            <button type="button" onClick={handleQuickPlay} className="auth-btn-secondary w-full">
              Continue as guest
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] font-medium text-zinc-700">
          Draw stacks add up fast. Have fun.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
