
import React from 'react';
import { AppState, UserRole } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardPageProps {
  state: AppState;
  onNavigate: (path: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ state, onNavigate }) => {
  const data = [
    { name: '优良', value: 75, color: '#10b981' },
    { name: '平稳', value: 15, color: '#2563eb' },
    { name: '关注', value: 8, color: '#f59e0b' },
    { name: '高危', value: 2, color: '#dc2626' },
  ];

  const barData = [
    { name: '情绪稳定', score: 85 },
    { name: '冲动控制', score: 92 },
    { name: '抗压韧性', score: 78 },
    { name: '职业认同', score: 82 },
    { name: '社会支持', score: 70 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">全队心理健康态势仪表盘</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">实有警力</p>
          <p className="text-3xl font-black text-slate-800">128 <span className="text-sm font-normal text-slate-400">人</span></p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">已测人员</p>
          <p className="text-3xl font-black text-blue-600">115 <span className="text-sm font-normal text-slate-400">人</span></p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">预警人员</p>
          <p className="text-3xl font-black text-orange-500">12 <span className="text-sm font-normal text-slate-400">人</span></p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-red-600">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">高危风险</p>
          <p className="text-3xl font-black text-red-600">2 <span className="text-sm font-normal text-slate-400">人</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-6">全队健康态势分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-xs text-slate-600">{d.name} ({d.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-6">核心维度平均评分</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="score" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-red-600 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            高危风险名单 (建议立即约谈)
          </h3>
          <button 
            onClick={() => onNavigate('analysis-report')}
            className="text-sm text-blue-700 font-bold hover:underline"
          >
            查看全队分析清单 →
          </button>
        </div>
        <div className="space-y-3">
          {[
            { name: '张*军', id: '230101', dept: '巡警大队', score: 58, risk: '债务压力、心理倦怠' },
            { name: '李*强', id: '230115', dept: '刑侦支队', score: 62, risk: '严重失眠、家庭重大变故' }
          ].map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-red-200 text-red-700 rounded-full flex items-center justify-center font-black text-xl">{p.name[0]}</div>
                <div>
                  <p className="font-bold text-slate-800">{p.name} <span className="text-xs text-slate-400 font-normal">警号: {p.id}</span></p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.dept} | 关键指标: {p.risk}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-red-600">{p.score} <span className="text-xs font-normal">分</span></p>
                <button className="mt-1 text-xs bg-white text-red-600 border border-red-200 px-3 py-1 rounded-lg font-bold hover:bg-red-600 hover:text-white transition-all">立即研判报告</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
