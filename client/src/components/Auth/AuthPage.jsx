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

const handleSubmit = async (e) => {
e.preventDefault();


// ✅ Basic validation
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

  // ✅ Store token
  localStorage.setItem('token', data.token);

  toast.success(isLogin ? 'Welcome back' : 'Account created');

  onAuth(data.user);
} catch (err) {
  toast.error(err.message);
} finally {
  setLoading(false);
}


};

// ⚡ Quick Play
const handleQuickPlay = () => {
const randomName = `Player_${Math.random().toString(36).substring(2, 6)}`;


onAuth({
  id: Date.now(),
  username: randomName,
  isGuest: true,
});

toast.success(`Playing as ${randomName}`);


};

return (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="glass w-full max-w-md p-8 animate-fade-in relative z-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">UNO No Mercy</h1>
        <p className="text-slate-400 text-sm mt-2">Sign in to join a room and start playing</p>
      </div>

      <div className="flex bg-slate-800/70 rounded-lg p-1 mb-6">
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${isLogin ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${!isLogin ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setIsLogin(false)}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="animate-slide-down">
            <label className="block text-sm text-slate-400 mb-1">Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required={!isLogin}
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-1">Email</label>
          <input
            type="email"
            className="input-field"
            placeholder="Enter email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1">Password</label>
          <input
            type="password"
            className="input-field"
            placeholder="Enter password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-500 border-t-slate-100 rounded-full animate-spin" />
          ) : (
            isLogin ? 'Login' : 'Register'
          )}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-slate-500 text-sm">OR</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <button
        onClick={handleQuickPlay}
        className="w-full py-3 px-8 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-medium hover:bg-slate-800 transition-all duration-200"
      >
        Quick Play (No Account)
      </button>
    </div>
  </div>
);
};

export default AuthPage;
