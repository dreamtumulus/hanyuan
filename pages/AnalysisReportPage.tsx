
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

      const result = await geminiService.generateComprehensiveReport(data);
      
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
    let suffix = '';
    switch (type) {
      case 'professional': suffix = '\n\n[管理员注：以上内容需进一步对照《公安机关人民警察职业道德规范》进行政治站位深度对标。]'; break;
      case 'stricter': suffix = '\n\n[人工复核：鉴于该警员处于一线敏感岗位，建议加强底线思维考核，严防违纪风险。]'; break;
      case 'soften': suffix = '\n\n[领导寄语：工作压力在所难免，重点在于做好情绪剥离，组织上将给予充分支持。]'; break;
    }
    setEditedContent(prev => prev + suffix);
  };

  useEffect(() => {
    if (currentReport) {
      setEditedContent(currentReport.manualEdit || currentReport.content);
    }
  }, [currentReport, isEditing]);

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">全队研判名录</h2>
          <div className="space-y-3">
            {mockOfficers.map(o => (
              <button 
                key={o.policeId}
                onClick={() => generateReport(o.policeId)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedOfficerId === o.policeId 
                  ? 'bg-blue-50 border-blue-600 shadow-md translate-x-2' 
                  : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800">{o.name}</p>
                    <p className="text-xs text-slate-500">{o.dept} · {o.position}</p>
                    <div className="flex items-center gap-2 mt-2">
                       {state.analysisReports[o.policeId]?.editStatus === 'modified' && (
                         <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">已人工修改</span>
                       )}
                    </div>
                  </div>
                  <div className="bg-slate-100 p-2 rounded-lg text-lg">👮</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
          <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-700">全维度思想研判报告</h3>
              {currentReport && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  currentReport.editStatus === 'ai' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {currentReport.editStatus === 'ai' ? 'AI 原生' : '已人工复核'}
                </span>
              )}
            </div>
            
            {(state.currentUser?.role === UserRole.LEADER || state.currentUser?.role === UserRole.COMMANDER) && currentReport && !loading && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline"
              >
                {isEditing ? '取消修改' : '✎ 人工介入修改'}
              </button>
            )}
          </div>
          
          <div className="flex-1 p-8">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-700 border-t-transparent"></div>
                <div className="text-slate-500 font-bold animate-pulse">正在调取档案、研判语义并生成专业政工报告...</div>
              </div>
            ) : isEditing ? (
              <div className="h-full flex flex-col gap-4 animate-fadeIn">
                <div className="flex gap-2 mb-2">
                  <button onClick={() => applyQuickCorrection('professional')} className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md border font-bold">+ 增加道德规范对标</button>
                  <button onClick={() => applyQuickCorrection('stricter')} className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-100 font-bold">+ 强化纪律红线</button>
                  <button onClick={() => applyQuickCorrection('soften')} className="text-[10px] bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-md border border-green-100 font-bold">+ 注入人文关怀</button>
                </div>
                <textarea 
                  className="flex-1 w-full p-6 border-2 border-blue-100 rounded-xl focus:ring-0 outline-none font-sans text-slate-700 leading-relaxed min-h-[400px]"
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                   <button onClick={() => setIsEditing(false)} className="px-6 py-2 border rounded-lg font-bold text-slate-600">舍弃修改</button>
                   <button onClick={handleManualEditSave} className="px-8 py-2 bg-blue-700 text-white rounded-lg font-bold shadow-lg">确认保存人工报告</button>
                </div>
              </div>
            ) : currentReport ? (
              <div className="animate-fadeIn prose prose-blue max-w-none">
                <div className="text-xs text-slate-400 mb-4 border-b pb-2 flex justify-between">
                  <span>生成时间: {currentReport.generatedAt}</span>
                  {currentReport.editorName && <span>人工复核人: {currentReport.editorName}</span>}
                </div>
                <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-700">
                  {currentReport.manualEdit || currentReport.content}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                 <svg className="w-24 h-24 opacity-10 mb-6" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M14,17H7V15H14V17M17,13H7V11H17V13M17,9H7V7H17V9M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 005,21H19A2,2 0 0021,19V5C21,3.89 20.1,3 19,3Z" />
                 </svg>
                 <p className="text-lg">请在左侧点击警员姓名以开启 AI 全维度动态研判</p>
              </div>
            )}
          </div>

          {currentReport && !loading && !isEditing && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white">导出研判底稿</button>
              <button className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-bold shadow-md">正式打印下发</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReportPage;
