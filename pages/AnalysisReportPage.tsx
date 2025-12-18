
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

  const applyProfessionalInstruction = (instruction: string) => {
    let text = editedContent;
    switch (instruction) {
      case 'politics': 
        text = "【政治定性】该同志在大是大非面前头脑清醒，政治立场坚定，能够自觉做到“两个维护”。\n" + text;
        break;
      case 'warning':
        text = text + "\n\n【风险警示】鉴于该同志近期存在苗头性作风问题，建议列入“重点关注”对象，暂缓配枪资格。";
        break;
      case 'care':
        text = text + "\n\n【关怀建议】建议所在单位领导适时开展“家访”活动，协助解决其家庭实际困难，传递组织温度。";
        break;
    }
    setEditedContent(text);
  };

  useEffect(() => {
    if (currentReport) {
      setEditedContent(currentReport.manualEdit || currentReport.content);
    }
  }, [currentReport, isEditing]);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-700 rounded-full"></span>
            研判档案库
          </h2>
          <div className="space-y-3">
            {mockOfficers.map(o => (
              <button 
                key={o.policeId}
                onClick={() => generateReport(o.policeId)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${
                  selectedOfficerId === o.policeId 
                  ? 'border-blue-700 bg-blue-50 shadow-md translate-x-1' 
                  : 'border-slate-50 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-black text-sm ${selectedOfficerId === o.policeId ? 'text-blue-900' : 'text-slate-800'}`}>{o.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{o.dept}</p>
                  </div>
                  {state.analysisReports[o.policeId]?.editStatus === 'modified' && (
                    <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-200">人修</span>
                  )}
                </div>
                {selectedOfficerId === o.policeId && (
                   <div className="absolute right-0 bottom-0 opacity-10 translate-x-2 translate-y-2">
                     <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                   </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col min-h-[800px] overflow-hidden">
          <div className="bg-[#1e3a8a] text-white p-6 flex items-center justify-between shadow-lg relative z-20">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              </div>
              <div>
                <h3 className="font-black tracking-[0.2em] text-lg">全维度思想研判分析底稿</h3>
                <p className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Digital Analysis & Political Appraisal</p>
              </div>
            </div>
            {currentReport && !loading && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-5 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                    isEditing ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/10 border-white/20 hover:bg-white/30'
                  }`}
                >
                  {isEditing ? '取消修改' : '✍️ 编辑审定'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-12 bg-[#fafafa] relative overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-700 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-blue-900 font-black text-xl animate-pulse">深度调取警员全维度档案...</p>
                  <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Cross-referencing Medical, Psych & Work data</p>
                </div>
              </div>
            ) : isEditing ? (
              <div className="h-full flex flex-col gap-6 animate-fadeIn">
                <div className="bg-blue-900/5 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <span className="text-xs font-black text-blue-900 uppercase">辅助编写工具：</span>
                     <div className="flex gap-2">
                       <button onClick={() => applyProfessionalInstruction('politics')} className="text-[10px] bg-white px-3 py-1.5 rounded-lg border border-blue-200 font-bold hover:bg-blue-700 hover:text-white transition-all shadow-sm">插入政治定性</button>
                       <button onClick={() => applyProfessionalInstruction('warning')} className="text-[10px] bg-white px-3 py-1.5 rounded-lg border border-red-200 font-bold hover:bg-red-700 hover:text-white transition-all shadow-sm">追加风险预警</button>
                       <button onClick={() => applyProfessionalInstruction('care')} className="text-[10px] bg-white px-3 py-1.5 rounded-lg border border-green-200 font-bold hover:bg-green-700 hover:text-white transition-all shadow-sm">添加组织关怀</button>
                     </div>
                   </div>
                   <span className="text-[10px] text-slate-400 font-bold italic">研判权限：{state.currentUser?.role}</span>
                </div>
                <textarea 
                  className="flex-1 w-full p-10 border-2 border-slate-100 rounded-3xl focus:border-blue-500 focus:ring-8 focus:ring-blue-50 focus:bg-white transition-all outline-none font-serif text-slate-800 leading-loose text-xl shadow-inner min-h-[500px]"
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  placeholder="在此修改 AI 生成的判语..."
                />
                <div className="flex justify-end gap-4 pt-6">
                   <button onClick={() => setIsEditing(false)} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">放弃修改</button>
                   <button onClick={handleManualEditSave} className="px-12 py-3 bg-[#1e3a8a] text-white rounded-xl font-black shadow-2xl hover:bg-blue-900 active:scale-95 transition-all">完成审定并定稿</button>
                </div>
              </div>
            ) : currentReport ? (
              <div className="animate-fadeIn max-w-4xl mx-auto font-serif relative">
                <div className="absolute -top-6 -left-6 border-2 border-red-500 text-red-500 text-[10px] font-black px-2 py-0.5 rounded rotate-[-5deg] opacity-70">
                  内部参考 · 严禁扩散
                </div>
                
                <div className="text-center mb-12 border-b-2 border-red-600 pb-8">
                  <h1 className="text-4xl font-black text-red-600 tracking-[0.1em] mb-4">关于 ${mockOfficers.find(o => o.policeId === selectedOfficerId)?.name} 同志的身心研判报告</h1>
                  <div className="flex justify-between items-end text-xs text-slate-500 font-bold">
                    <div className="text-left space-y-1">
                      <p>编号：JX-ANALYSIS-${currentReport.policeId}-${Date.now().toString().slice(-6)}</p>
                      <p>密级：机密 (CONFIDENTIAL)</p>
                    </div>
                    <div className="text-right">
                      <p>研判日期：{currentReport.generatedAt}</p>
                      <p>系统环境：{state.systemConfig.preferredModel}</p>
                    </div>
                  </div>
                </div>
                
                <div className="whitespace-pre-wrap leading-[2.5] text-slate-900 text-2xl tracking-tight mb-20 px-4">
                  {currentReport.manualEdit || currentReport.content}
                </div>

                <div className="mt-24 pt-12 border-t-2 border-slate-100 flex justify-between items-end">
                  <div className="relative">
                    <div className="absolute -top-12 -left-4 w-32 h-32 opacity-20 rotate-[-15deg] pointer-events-none">
                       <svg viewBox="0 0 200 200" fill="red">
                         <circle cx="100" cy="100" r="80" fill="none" stroke="red" strokeWidth="4"/>
                         <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="bold">研判专用章</text>
                       </svg>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase mb-4 tracking-widest">审定部门确认</p>
                    <p className="text-2xl font-black italic text-slate-800 border-b-2 border-slate-200 px-6 pb-2 min-w-[200px]">
                      {currentReport.editStatus === 'modified' ? currentReport.editorName : 'AI 自动化生成'}
                    </p>
                  </div>
                  <div className="text-right text-slate-400">
                    <p className="text-[10px] font-bold uppercase tracking-widest">Verified by Digital Guardian System</p>
                    <p className="text-[10px] mt-1 font-medium">数据完整性校验码：${Math.random().toString(36).substring(7).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-200">
                 <div className="w-32 h-32 mb-10 opacity-5">
                    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                 </div>
                 <p className="font-black text-slate-300 text-2xl tracking-[0.5em] mb-4">待选研判对象</p>
                 <p className="text-sm text-slate-300 font-bold opacity-50 uppercase tracking-widest text-center max-w-xs">Select an officer from the left to start comprehensive dynamic appraisal</p>
              </div>
            )}
          </div>

          {currentReport && !loading && !isEditing && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center z-20">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${currentReport.editStatus === 'ai' ? 'bg-blue-400' : 'bg-green-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {currentReport.editStatus === 'ai' ? 'RAW AI OUTPUT' : 'HUMAN REVIEWED & FINALIZED'}
                </span>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">导出绝密加密包</button>
                <button className="px-8 py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-black shadow-xl hover:shadow-blue-900/30 active:scale-95 transition-all">打印政工备案原件</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReportPage;
