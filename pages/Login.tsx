
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (username: string, role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'xiaoyuan') {
      onLogin(username, UserRole.ADMIN);
    } else if (username === 'xiaoyuantest' && password === '123456') {
      onLogin(username, UserRole.OFFICER);
    } else {
      setError('账号或密码不正确');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="bg-white/95 backdrop-blur w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="bg-[#1e3a8a] p-8 text-center text-white">
          <div className="inline-block bg-white p-3 rounded-2xl mb-4">
            <svg className="w-12 h-12 text-[#1e3a8a]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4 5V11C4 16.19 7.41 21.05 12 22.33C16.59 21.05 20 16.19 20 11V5L12 2M12 20C8.47 18.85 6 15.11 6 11V6.3L12 4.05L18 6.3V11C18 15.11 15.53 18.85 12 20M11 7H13V15H11V7M11 17H13V19H11V17Z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-widest">警心卫士</h2>
          <p className="text-blue-100 text-sm mt-2 opacity-80">警员思想动态AI分析系统</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">账号</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入账号"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#1e3a8a] hover:bg-blue-800 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transform transition-all active:scale-95"
          >
            立即登录
          </button>

          <p className="text-center text-xs text-slate-400">
            管理员: admin/xiaoyuan | 演示账号: xiaoyuantest/123456
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
