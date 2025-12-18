
import React, { useState } from 'react';
import { TalkRecord } from '../types';

interface TalkEntryPageProps {
  records: TalkRecord[];
  onAdd: (record: TalkRecord) => void;
  onDelete: (id: string) => void;
}

const TalkEntryPage: React.FC<TalkEntryPageProps> = ({ records, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<TalkRecord>>({
    officerName: '', policeId: '', interviewer: '', participants: '',
    date: new Date().toISOString().split('T')[0], location: '', 
    entryTime: new Date().toLocaleString(), armedUnit: '',
    hasFamilyConflict: false, familyConflictDetail: '',
    hasMajorChange: false, majorChangeDetail: '',
    hasDebt: false, debtDetail: '',
    hasAlcoholIssue: false, alcoholDetail: '',
    hasRelationshipIssue: false, relationshipDetail: '',
    hasComplexSocial: false, complexSocialDetail: '',
    isUnderInvestigation: false, investigationDetail: '',
    hasMentalIssue: false, mentalIssueDetail: '',
    otherInfo: '', thoughtDynamic: '', realityPerformance: '',
    mentalStatus: '', canCarryGun: '适宜'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, id: Date.now().toString() } as TalkRecord);
    setShowModal(false);
  };

  const renderToggleField = (label: string, field: keyof TalkRecord, detailField: keyof TalkRecord) => (
    <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        <div className="flex bg-white rounded-md border p-1">
          <button 
            type="button"
            onClick={() => setFormData({...formData, [field]: true})}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${formData[field] ? 'bg-red-600 text-white' : 'text-slate-400'}`}
          >是</button>
          <button 
            type="button"
            onClick={() => setFormData({...formData, [field]: false})}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${!formData[field] ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >否</button>
        </div>
      </div>
      {formData[field] && (
        <textarea 
          placeholder="请说明具体情况..." 
          className="w-full p-2 text-sm border rounded-md" 
          value={formData[detailField] as string}
          onChange={e => setFormData({...formData, [detailField]: e.target.value})}
        />
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">谈心谈话记录录入</h2>
          <p className="text-slate-500 text-sm">记录与下属警员的谈话内容，作为思想研判的重要依据</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800"
        >
          + 新增谈话
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">警员姓名</th>
              <th className="px-6 py-3 text-left">谈话时间</th>
              <th className="px-6 py-3 text-left">谈话地点</th>
              <th className="px-6 py-3 text-left">负责人</th>
              <th className="px-6 py-3 text-left">风险项</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">暂无录入记录</td>
              </tr>
            ) : records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{r.officerName}</td>
                <td className="px-6 py-4">{r.date}</td>
                <td className="px-6 py-4">{r.location}</td>
                <td className="px-6 py-4">{r.interviewer}</td>
                <td className="px-6 py-4">
                  {[r.hasFamilyConflict, r.hasMajorChange, r.hasDebt, r.hasAlcoholIssue, r.hasRelationshipIssue, r.hasComplexSocial, r.isUnderInvestigation, r.hasMentalIssue].filter(Boolean).length > 0 ? (
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">高风险</span>
                  ) : (
                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold">正常</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => onDelete(r.id)} className="text-red-500 hover:text-red-700 p-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
            <div className="bg-[#1e3a8a] p-4 text-white flex items-center justify-between">
              <h3 className="font-bold">新增谈心谈话记录</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:opacity-70">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">被谈话人姓名</label>
                  <input required className="w-full px-3 py-2 border rounded-md" value={formData.officerName} onChange={e => setFormData({...formData, officerName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">警号</label>
                  <input required className="w-full px-3 py-2 border rounded-md" value={formData.policeId} onChange={e => setFormData({...formData, policeId: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">谈话负责人</label>
                  <input required className="w-full px-3 py-2 border rounded-md" value={formData.interviewer} onChange={e => setFormData({...formData, interviewer: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">参与人</label>
                  <input className="w-full px-3 py-2 border rounded-md" value={formData.participants} onChange={e => setFormData({...formData, participants: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">谈话时间</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-md" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">谈话地点</label>
                  <input className="w-full px-3 py-2 border rounded-md" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderToggleField('是否有家庭矛盾', 'hasFamilyConflict', 'familyConflictDetail')}
                {renderToggleField('是否有重大变故', 'hasMajorChange', 'majorChangeDetail')}
                {renderToggleField('是否有债务缠身', 'hasDebt', 'debtDetail')}
                {renderToggleField('是否有酗酒滋事', 'hasAlcoholIssue', 'alcoholDetail')}
                {renderToggleField('个人情感纠纷', 'hasRelationshipIssue', 'relationshipDetail')}
                {renderToggleField('对外交往复杂', 'hasComplexSocial', 'complexSocialDetail')}
                {renderToggleField('接受审讯调查', 'isUnderInvestigation', 'investigationDetail')}
                {renderToggleField('是否有精神疾病', 'hasMentalIssue', 'mentalIssueDetail')}
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">思想动态</label>
                  <textarea className="w-full p-3 border rounded-md h-24" value={formData.thoughtDynamic} onChange={e => setFormData({...formData, thoughtDynamic: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">现实表现</label>
                  <textarea className="w-full p-3 border rounded-md h-24" value={formData.realityPerformance} onChange={e => setFormData({...formData, realityPerformance: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">心理健康状况 (谈话人视角)</label>
                  <textarea className="w-full p-3 border rounded-md h-24" value={formData.mentalStatus} onChange={e => setFormData({...formData, mentalStatus: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">适宜配枪情况</label>
                  <select className="w-full px-3 py-2 border rounded-md" value={formData.canCarryGun} onChange={e => setFormData({...formData, canCarryGun: e.target.value})}>
                    <option>适宜</option>
                    <option>建议观察</option>
                    <option>建议暂停</option>
                    <option>不适宜</option>
                  </select>
                </div>
              </div>
            </form>
            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg text-slate-600 font-bold">取消</button>
              <button onClick={handleSubmit} className="px-8 py-2 bg-blue-700 text-white rounded-lg font-bold">保存并提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalkEntryPage;
