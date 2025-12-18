
import React, { useState, useRef, useEffect } from 'react';
import { PsychTestReport, PersonalInfo } from '../types';
import { geminiService } from '../geminiService';

interface PsychTestPageProps {
  reports: PsychTestReport[];
  onAddReport: (report: PsychTestReport) => void;
  officerInfo?: PersonalInfo;
}

const PsychTestPage: React.FC<PsychTestPageProps> = ({ reports, onAddReport, officerInfo }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [round, setRound] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewTest = async () => {
    setMessages([{ role: 'model', text: `嘿，${officerInfo?.name || '伙计'}！最近工作咋样？接处警多不多？忙归忙，咱也得聊聊，别把自己绷太紧了。最近感觉怎么样？` }]);
    setRound(1);
    setIsFinished(false);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isFinished) return;
    
    const userMsg = inputValue;
    setInputValue('');
    const newMsgs = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMsgs);
    setIsTyping(true);

    try {
      const response = await geminiService.getPsychTestResponse(newMsgs, officerInfo, round + 1);
      setMessages([...newMsgs, { role: 'model', text: response }]);
      
      if (round >= 10) {
        setIsFinished(true);
        // Process final report
        const finalReport: PsychTestReport = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString(),
          score: 85, // Mock score for demo
          level: '优良',
          content: response,
          messages: [...newMsgs, { role: 'model', text: response }]
        };
        onAddReport(finalReport);
      } else {
        setRound(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div className="bg-white p-4 border border-slate-200 rounded-t-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl overflow-hidden border-2 border-blue-500">
             👮
          </div>
          <div>
            <h3 className="font-bold text-slate-800">警小伴 (AI 心理评估)</h3>
            <p className="text-xs text-slate-400">专业、亲切、懂基层的心理辅导员</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase font-bold">测评进度 {Math.min(round, 10)}/10</span>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-blue-600 transition-all duration-500" 
                style={{ width: `${(round / 10) * 100}%` }}
              ></div>
            </div>
          </div>
          <button 
            onClick={startNewTest}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 transition-colors"
          >
            新测试
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-50 border-x border-slate-200 overflow-y-auto p-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
            <div className="text-6xl grayscale opacity-20">👮</div>
            <p className="max-w-xs">点击右上角“新测试”开始一次自然的聊天评估，10轮对话后将生成专业报告。</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                m.role === 'user' 
                ? 'bg-blue-700 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        {isFinished && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center space-y-3 animate-fadeIn">
            <div className="text-3xl">✅</div>
            <h4 className="font-bold text-green-800">心理测评已完成</h4>
            <p className="text-sm text-green-700">AI 已为您生成了本次测评报告。您可以在“历史记录”中随时查阅，也可以前往“心理疏导”模块与 AI 进行深度交流。</p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 border border-slate-200 rounded-b-xl shadow-sm">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isFinished || messages.length === 0}
            placeholder={messages.length === 0 ? "点击新测试开始..." : (isFinished ? "测试已结束" : "输入您想说的...")}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isFinished || messages.length === 0 || isTyping}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/10"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default PsychTestPage;
