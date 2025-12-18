
import React, { useState } from 'react';
import { ExamReport } from '../types';
import { geminiService } from '../geminiService';

interface ExamReportPageProps {
  reports: ExamReport[];
  onAdd: (report: ExamReport) => void;
  onDelete: (id: string) => void;
}

const ExamReportPage: React.FC<ExamReportPageProps> = ({ reports, onAdd, onDelete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ExamReport | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Simulate reading and AI analysis
      const analysis = await geminiService.analyzeExamReport(
        `这份体检报告属于 ${file.name}。模拟分析：血压145/95，轻度脂肪肝，心电图正常。`,
        reports.map(r => r.analysis).join('\n---\n')
      );

      const newReport: ExamReport = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        fileName: file.name,
        analysis,
        status: 'completed'
      };
      onAdd(newReport);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">体检报告 AI 研判</h2>
        <p className="text-slate-500 text-sm mt-1">上传 PDF 或 Word 格式报告，AI 将自动分析健康风险并对比历史趋势</p>
        
        <div className="mt-6 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-10 bg-slate-50">
          <label className="cursor-pointer text-center group">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📄</div>
            <span className="text-blue-700 font-bold">点击上传文件</span>
            <span className="text-slate-400 block text-xs mt-1">支持 PDF, Word, JPG (最大 10MB)</span>
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
        {isUploading && (
          <div className="mt-4 flex items-center gap-3 text-blue-600 text-sm font-medium">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            AI 正在深度研判中，请稍候...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50">历史上传记录</div>
          <div className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">暂无报告记录</div>
            ) : reports.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📑</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.fileName}</p>
                    <p className="text-xs text-slate-500">{r.date}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedReport(r)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold">查看分析</button>
                  <button onClick={() => onDelete(r.id)} className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50">AI 分析详情</div>
          <div className="p-6 prose prose-slate">
            {selectedReport ? (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-blue-600">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  研判日期: {selectedReport.date}
                </div>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.analysis}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <svg className="w-16 h-16 opacity-20 mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 006,22H18A2,2 0 0020,20V8L14,2H6Z" />
                </svg>
                <p>点击列表中的“查看分析”以显示详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamReportPage;
