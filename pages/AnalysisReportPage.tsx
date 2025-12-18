
import React, { useState, useEffect } from 'react';
import { AppState, UserRole, AIAnalysisReport } from '../types';
import { geminiService } from '../geminiService';

interface AnalysisReportPageProps {
  state: AppState;
  onSaveReport: (report: AIAnalysisReport) => void;
}

const AnalysisReportPage: React.FC<AnalysisReportPageProps> = ({ state, onSaveReport }) => {
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const mockOfficers = [
    { policeId: 'TEST001', name: '张伟', dept: '刑侦大队', position: '副大队长' },
    { policeId: 'TEST002', name: '李强', dept: '城关派出所', position: '教导员' },
    { policeId: 'TEST003', name: '王敏', dept: '交警大队', position: '中队长' },
  ];

  const currentReport = selectedOfficerId ? state.analysisReports[selectedOfficerId] : null;

  const generateReport = async (policeId: string) => {
    setSelectedOfficerId(policeId);
    setLoading(true);
    
    try {
      const data = {
        officer: state.personalInfo[policeId] || mockOfficers.find(o => o.policeId === policeId),
        exams: state.examReports[policeId] || [],
        psychs: state.psychTestReports[policeId] || [],
        talks: state.talkRecords.filter(r => r.policeId === policeId)
      };

      const result = await geminiService.generateComprehensiveReport(data, state.systemConfig);
      
      const newReport: AIAnalysisReport = {
        policeId,
        generatedAt: new Date().toLocaleString(),
        content: result,
        editStatus: 'ai'
      };
      onSaveReport(newReport);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEditSave = () => {
    if (!selectedOfficerId || !currentReport) return;
    
    const updatedReport: AIAnalysisReport = {
      ...currentReport,
      manualEdit: editedContent,
      editStatus: 'modified',
      editorName: state.currentUser?.username
    };
    onSaveReport(updatedReport);
    setIsEditing(false);
  };

  const applyQuickCorrection = (type: string) => {
    let prefix = '';
    switch (type) {
      case 'politics': prefix = '【政治站位对标】该同志在近期工作中表现出坚定的政治立场，但在应对突发舆情时的思想敏锐度仍有提升空间。\n'; break;
      case 'risk': prefix = '【廉政风险提示】经复核，该同志在社交圈管理上存在苗头性问题，建议纳入重点观察序列。\n'; break;
      case 'care': prefix = '【组织关怀意见】针对该同志近期家庭困难，建议所在支部启动谈心谈话疏导机制，传递组织温暖。\n'; break;
    }
    setEditedContent(prefix + editedContent);
  };

  useEffect(() => {
    if (currentReport) {
      setEditedContent(currentReport.manualEdit || currentReport.content);
    }
  }, [currentReport, isEditing]);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-blue-700 pl-3">研判对象清单</h2>
          <div className="space-y-2">
            {mockOfficers.map(o => (
              <button 
                key={o.policeId}
                onClick={() => generateReport(o.policeId)}
                className={`w-full p-3 rounded-lg border text-left transition-all relative ${
                  selectedOfficerId === o.policeId 
                  ? 'bg-blue-50 border-blue-700 shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-slate-800 text-sm">{o.name}</p>
                <p className="text-[10px] text-slate-500">{o.dept} · {o.position}</p>
                {state.analysisReports[o.policeId]?.editStatus === 'modified' && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col min-h-[700px]">
          <div className="bg-[#1e3a8a] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h3 className="font-bold tracking-widest">全维度思想政治动态研判底稿</h3>
            </div>
            {currentReport && !loading && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs font-bold border border-white/20"
                >
                  {isEditing ? '取消' : '人工干预/修改'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-8 bg-[#fdfdfd] relative">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-transparent"></div>
                <p className="text-slate-500 text-sm font-bold">正在接入大数据模型进行全维度赋分...</p>
              </div>
            ) : isEditing ? (
              <div className="h-full flex flex-col gap-4 animate-fadeIn">
                <div className="flex flex-wrap gap-2 mb-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-xs font-bold text-blue-800 w-full mb-1">快捷介入选项：</span>
                  <button onClick={() => applyQuickCorrection('politics')} className="text-[10px] bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-blue-200 font-bold text-blue-700">提升政治站位</button>
                  <button onClick={() => applyQuickCorrection('risk')} className="text-[10px] bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-red-200 font-bold text-red-700">标记纪律风险</button>
                  <button onClick={() => applyQuickCorrection('care')} className="text-[10px] bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-green-200 font-bold text-green-700">增加组织关怀</button>
                </div>
                <textarea 
                  className="flex-1 w-full p-8 border-2 border-blue-50 rounded-xl focus:ring-0 outline-none font-sans text-slate-800 leading-relaxed min-h-[500px] shadow-inner"
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                />
                <div className="flex justify-end gap-3 pt-4 border-t">
                   <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100">撤销修改</button>
                   <button onClick={handleManualEditSave} className="px-8 py-2 bg-[#1e3a8a] text-white rounded-lg font-bold shadow-lg">保存最终审定版</button>
                </div>
              </div>
            ) : currentReport ? (
              <div className="animate-fadeIn max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h1 className="text-2xl font-black text-slate-900 border-b-2 border-red-600 inline-block pb-1">关于警员 ${mockOfficers.find(o => o.policeId === selectedOfficerId)?.name} 的综合研判报告</h1>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-4 uppercase font-bold">
                    <span>文档编号: JX-${currentReport.policeId}-${Date.now().toString().slice(-6)}</span>
                    <span>密级: 内部参考 (严禁外泄)</span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap font-sans leading-loose text-slate-800 text-lg">
                  {currentReport.manualEdit || currentReport.content}
                </div>
                {currentReport.editStatus === 'modified' && (
                  <div className="mt-12 pt-4 border-t border-dashed border-slate-200 text-right">
                    <p className="text-sm font-bold text-slate-600 italic">审定人签名：${currentReport.editorName || '系统默认'}</p>
                    <p className="text-xs text-slate-400 mt-1">审定日期：${currentReport.generatedAt}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                 <div className="w-24 h-24 mb-6 opacity-10">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21,5V19A2,2 0 0119,21H5A2,2 0 013,19V5A2,2 0 015,3H19A2,2 0 0121,5M19,5H5V19H19V5M17,17H7V15H17V17M17,13H7V11H17V13M17,9H7V7H17V9Z" /></svg>
                 </div>
                 <p className="font-bold text-slate-400">请选择左侧警员，启动全生命周期AI动态研判</p>
              </div>
            )}
          </div>

          {currentReport && !loading && !isEditing && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button className="px-5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-white transition-colors">导出加密文档</button>
              <button className="px-5 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-900 transition-all">打印政工备案</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReportPage;
