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

  toast.success(isLogin ? 'Welcome back! 🎮' : 'Account created! 🎉');

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

toast.success(`Playing as ${randomName} 🎮`);


};

return ( <div className="min-h-screen flex items-center justify-center p-4">
{/* Background */} <div className="fixed inset-0 overflow-hidden pointer-events-none"> <div className="absolute top-20 left-10 text-8xl opacity-10 animate-bounce-slow">🎴</div> <div className="absolute top-40 right-20 text-6xl opacity-10 animate-bounce-slow delay-300">🔴</div> <div className="absolute bottom-20 left-1/4 text-7xl opacity-10 animate-bounce-slow delay-700">🟢</div> <div className="absolute bottom-40 right-1/3 text-5xl opacity-10 animate-bounce-slow delay-500">🔵</div> </div>


  <div className="glass w-full max-w-md p-8 animate-fade-in relative z-10">
    {/* Logo */}
    <div className="text-center mb-8">
      <h1 className="text-5xl font-black bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 bg-clip-text text-transparent">
        UNO
      </h1>
      <p className="text-2xl font-bold text-red-500 mt-1 tracking-widest">
        NO MERCY 🔥
      </p>
      <p className="text-gray-400 text-sm mt-2">
        The ultimate card game experience
      </p>
    </div>

    {/* Toggle */}
    <div className="flex bg-white/5 rounded-xl p-1 mb-6">
      <button
        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300
          ${isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        onClick={() => setIsLogin(true)}
      >
        Login
      </button>
      <button
        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300
          ${!isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        onClick={() => setIsLogin(false)}
      >
        Register
      </button>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <div className="animate-slide-down">
          <label className="block text-sm text-gray-400 mb-1">Username</label>
          <input
            type="text"
            className="input-field"
            placeholder="Enter username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required={!isLogin}
          />
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-1">Email</label>
        <input
          type="email"
          className="input-field"
          placeholder="Enter email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="Enter password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {isLogin ? '🎮 Login' : '🚀 Register'}
          </>
        )}
      </button>
    </form>

    {/* Divider */}
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-gray-500 text-sm">OR</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>

    {/* Quick Play */}
    <button
      onClick={handleQuickPlay}
      className="w-full py-3 px-8 bg-white/5 border border-white/10 rounded-xl 
                 text-gray-300 font-semibold hover:bg-white/10 hover:text-white 
                 transition-all duration-300 hover:scale-105 active:scale-95"
    >
      ⚡ Quick Play (No Account)
    </button>
  </div>
</div>


);
};

export default AuthPage;
