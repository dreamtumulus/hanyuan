
import React, { useState } from 'react';
import { SystemConfig } from '../types';

interface AdminSettingsProps {
  config: SystemConfig;
  onSave: (config: SystemConfig) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<SystemConfig>(config);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="p-2 bg-slate-100 rounded-lg">⚙️</span>
          全局系统设置
        </h2>
        <p className="text-slate-500 mt-2">管理员专用：配置 AI 模型接口、API 密钥及系统运行参数</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">OpenRouter API Key</label>
              <input 
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                value={formData.openRouterKey}
                onChange={e => setFormData({...formData, openRouterKey: e.target.value})}
                placeholder="sk-or-v1-..."
              />
              <p className="text-xs text-slate-400">用于接入第三方大模型平台（OpenRouter）</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">API 基础路径 (Base URL)</label>
              <input 
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.apiBaseUrl}
                onChange={e => setFormData({...formData, apiBaseUrl: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">首选模型名称</label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.preferredModel}
                onChange={e => setFormData({...formData, preferredModel: e.target.value})}
              >
                <option value="gemini-3-pro-preview">Gemini 3 Pro (推荐)</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash (快速)</option>
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="openai/gpt-4o">GPT-4o</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-between">
            <div className={`text-sm font-bold text-green-600 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
              ✓ 配置已成功持久化至后端
            </div>
            <button 
              type="submit"
              className="bg-[#1e3a8a] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-800 transition-all"
            >
              更新全局配置
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
        <div className="text-2xl">💡</div>
        <div className="text-sm text-blue-800 leading-relaxed">
          <p className="font-bold mb-1">提示：</p>
          系统将优先读取此处配置。若 API Key 为空，系统将回退至环境变量中预置的默认密钥运行。
          所有修改将立即对全队“AI 研判报告”生成逻辑生效。
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
