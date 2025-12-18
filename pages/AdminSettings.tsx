
import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { geminiService } from '../geminiService';

interface AdminSettingsProps {
  config: SystemConfig;
  onSave: (config: SystemConfig) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<SystemConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{msg: string, type: 'success' | 'error' | 'none'}>({msg: '', type: 'none'});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const cleanedConfig: SystemConfig = {
      openRouterKey: formData.openRouterKey.trim(),
      apiBaseUrl: formData.apiBaseUrl.trim(),
      preferredModel: formData.preferredModel.trim(),
    };

    await new Promise(resolve => setTimeout(resolve, 600));
    
    onSave(cleanedConfig);
    setFormData(cleanedConfig);
    setIsSaving(false);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult({msg: '正在建立连接...', type: 'none'});
    
    try {
      // 这里的 result 如果返回了 "[系统报警]" 字符串，说明根本没发出去
      const result = await geminiService.callAI("Connectivity test. Reply exactly with 'CONNECTED'.", formData, "You are a connectivity tester.");
      
      if (result.includes("CONNECTED") || (result.length > 5 && !result.includes("[系统") && !result.includes("[鉴权") && !result.includes("[接口"))) {
        setTestResult({msg: '连接成功！API Key 响应正常。', type: 'success'});
      } else {
        setTestResult({msg: result, type: 'error'});
      }
    } catch (err: any) {
      setTestResult({msg: '连接异常: ' + err.message, type: 'error'});
    } finally {
      setIsTesting(false);
    }
  };

  const commonModels = [
    'google/gemini-3-flash-preview',
    'google/gemini-2.0-flash-001',
    'google/gemini-pro-1.5',
    'anthropic/claude-3.5-sonnet',
    'deepseek/deepseek-chat'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg text-sm">ADMIN</span>
              系统后台管理
            </h2>
            <p className="text-slate-400 text-sm mt-1">配置 OpenRouter 接口以启用 AI 全维度研判功能</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              API 接入配置
              <div className="h-px flex-1 bg-slate-100"></div>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">OpenRouter API Key</label>
                <div className="relative">
                  <input 
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none font-mono text-sm transition-all"
                    value={formData.openRouterKey}
                    onChange={e => setFormData({...formData, openRouterKey: e.target.value})}
                    placeholder="sk-or-v1-..."
                  />
                  <button 
                    type="button"
                    onClick={testConnection}
                    disabled={isTesting || !formData.openRouterKey}
                    className="absolute right-2 top-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded-lg border transition-all"
                  >
                    {isTesting ? '测试中...' : '测试连接'}
                  </button>
                </div>
                {testResult.type !== 'none' && (
                  <p className={`text-[10px] font-bold mt-1 ${testResult.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.type === 'success' ? '●' : '●'} {testResult.msg}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">接口地址</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none text-sm transition-all"
                  value={formData.apiBaseUrl}
                  onChange={e => setFormData({...formData, apiBaseUrl: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">首选 AI 模型标识</label>
              <input 
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none font-mono text-blue-700 font-bold"
                value={formData.preferredModel}
                onChange={e => setFormData({...formData, preferredModel: e.target.value})}
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase py-1">常用模型推荐:</span>
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
                  ✓ 配置已同步并存入浏览器缓存
                </span>
              )}
            </div>
            <button 
              type="submit"
              disabled={isSaving}
              className={`px-10 py-3 rounded-xl font-black text-white shadow-xl transition-all active:scale-95 ${
                isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1e3a8a] hover:bg-blue-800'
              }`}
            >
              {isSaving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
        <span className="text-2xl">🛡️</span>
        <div>
          <h4 className="text-sm font-bold text-blue-900">配置建议</h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            1. 如果在心理测评页面仍看到异常，请在“系统设置”页面重新点击一次“保存配置”。<br/>
            2. 确保您的 Key 在 OpenRouter 后台处于 Active 状态并拥有足够的 Credits。<br/>
            3. 您目前使用的模型为：<b>google/gemini-3-flash-preview</b>。
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
