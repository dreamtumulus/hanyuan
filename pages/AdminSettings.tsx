
import React, { useState } from 'react';
import { SystemConfig } from '../types';

interface AdminSettingsProps {
  config: SystemConfig;
  onSave: (config: SystemConfig) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<SystemConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // 强制清理配置中的非法字符（如中文空格等）
    const cleanedConfig: SystemConfig = {
      openRouterKey: formData.openRouterKey.replace(/[^\x00-\x7F]/g, "").trim(),
      apiBaseUrl: formData.apiBaseUrl.replace(/[^\x00-\x7F]/g, "").trim(),
      preferredModel: formData.preferredModel.replace(/[^\x00-\x7F]/g, "").trim(),
    };

    // 模拟后端存储延迟
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onSave(cleanedConfig);
    setFormData(cleanedConfig); // 反馈清理后的结果到 UI
    setIsSaving(false);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const commonModels = [
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-pro-exp-02-05:free',
    'anthropic/claude-3.5-sonnet',
    'deepseek/deepseek-r1',
    'meta-llama/llama-3.3-70b-instruct'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg text-sm">ADMIN</span>
              系统全局后台管理
            </h2>
            <p className="text-slate-400 text-sm mt-1">此处的修改将自动清理非法字符并应用于全系统</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'success' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Engine</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              核心模型接入 (OpenRouter)
              <div className="h-px flex-1 bg-slate-100"></div>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">OpenRouter API Key</label>
                <input 
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                  value={formData.openRouterKey}
                  onChange={e => setFormData({...formData, openRouterKey: e.target.value})}
                  placeholder="sk-or-v1-..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">API 基础路径</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none text-sm transition-all"
                  value={formData.apiBaseUrl}
                  onChange={e => setFormData({...formData, apiBaseUrl: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">自定义模型标识 (Model ID)</label>
              <input 
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none font-mono text-blue-700 font-bold"
                value={formData.preferredModel}
                onChange={e => setFormData({...formData, preferredModel: e.target.value})}
                placeholder="例如: google/gemini-2.0-flash-001"
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase py-1">快速选择:</span>
                {commonModels.map(m => (
                  <button 
                    key={m}
                    type="button"
                    onClick={() => setFormData({...formData, preferredModel: m})}
                    className="text-[10px] bg-slate-50 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-full border border-slate-200 transition-all font-bold"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="pt-6 border-t flex items-center justify-between">
            <div>
              {saveStatus === 'success' && (
                <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                  ✓ 配置已安全存储并即时生效
                </span>
              )}
            </div>
            <button 
              type="submit"
              disabled={isSaving}
              className={`px-10 py-3 rounded-xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center gap-2 ${
                isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1e3a8a] hover:bg-blue-800'
              }`}
            >
              {isSaving ? '正在清理并保存...' : '保存全局配置'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
        <span className="text-2xl">💡</span>
        <div>
          <h4 className="text-sm font-bold text-amber-900">故障排查技巧</h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            如果保存后仍提示“非 ISO-8859-1 字符”，请尝试清空 API Key 输入框，手动重新输入前几个字符后再粘贴，以确保没有隐藏的富文本格式干扰。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
