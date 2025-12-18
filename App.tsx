
import React, { useState, useEffect } from 'react';
import { UserRole, AppState, PersonalInfo, TalkRecord, ExamReport, PsychTestReport, AIAnalysisReport, SystemConfig } from './types';
import Login from './pages/Login';
import IdentitySelect from './pages/IdentitySelect';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PersonalInfoPage from './pages/PersonalInfoPage';
import ExamReportPage from './pages/ExamReportPage';
import PsychTestPage from './pages/PsychTestPage';
import PsychCounselingPage from './pages/PsychCounselingPage';
import TalkEntryPage from './pages/TalkEntryPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisReportPage from './pages/AnalysisReportPage';
import AdminSettings from './pages/AdminSettings';

const STORAGE_KEY = 'jingxin_guardian_data_v4';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      currentUser: null,
      personalInfo: {
        'TEST001': { 
          name: '演示民警', policeId: 'TEST001', department: '演示大队', position: '二级警员',
          gender: '男', age: '28', idCard: '110101199501011234', hometown: '北京市',
          address: '警苑小区', phone: '13800138000', email: 'test@police.cn', family: []
        }
      },
      examReports: {},
      psychTestReports: {},
      talkRecords: [],
      analysisReports: {},
      systemConfig: {
        openRouterKey: '',
        preferredModel: 'google/gemini-2.0-flash-001',
        apiBaseUrl: 'https://openrouter.ai/api/v1'
      }
    };
  });

  const [currentPath, setCurrentPath] = useState<string>(() => window.location.hash.replace('#', '') || 'login');
  
  // 对于管理人员，用于跟踪当前正在查看/编辑哪位民警的档案
  const [activeOfficerId, setActiveOfficerId] = useState<string>('TEST001');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.replace('#', '') || 'login');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const handleLogin = (username: string, role: UserRole) => {
    setState(prev => ({ ...prev, currentUser: { username, role } }));
    if (role === UserRole.ADMIN) {
      navigate('admin-settings');
    } else {
      navigate('identity-select');
    }
  };

  const setRole = (role: UserRole) => {
    setState(prev => ({ ...prev, currentUser: { ...prev.currentUser!, role } }));
    // 默认跳转逻辑
    if (role === UserRole.LEADER) navigate('dashboard');
    else if (role === UserRole.COMMANDER) navigate('talk-entry');
    else navigate('personal-info');
  };

  const updatePersonalInfo = (info: PersonalInfo) => {
    setState(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [info.policeId]: info }
    }));
  };

  const handleAddTalkRecord = (record: TalkRecord) => {
    setState(prev => {
      const newState = { ...prev, talkRecords: [...prev.talkRecords, record] };
      // 关键逻辑：如果该警员在人员库中不存在，则自动创建一个基础档案以便领导研判
      if (!prev.personalInfo[record.policeId]) {
        newState.personalInfo[record.policeId] = {
          name: record.officerName,
          policeId: record.policeId,
          department: '待定',
          position: '待定',
          gender: '男',
          age: '',
          idCard: '',
          hometown: '',
          address: '',
          phone: '',
          email: '',
          family: []
        };
      }
      return newState;
    });
  };

  const saveAnalysisReport = (report: AIAnalysisReport) => {
    setState(prev => ({
      ...prev,
      analysisReports: { ...prev.analysisReports, [report.policeId]: report }
    }));
  };

  const updateSystemConfig = (config: SystemConfig) => {
    setState(prev => ({ ...prev, systemConfig: config }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    navigate('login');
  };

  const renderContent = () => {
    if (!state.currentUser) return <Login onLogin={handleLogin} />;
    if (currentPath === 'identity-select') return <IdentitySelect onSelect={setRole} />;
    if (currentPath === 'admin-settings') return <AdminSettings config={state.systemConfig} onSave={updateSystemConfig} />;

    // 确定当前上下文 ID
    const effectiveId = (state.currentUser.role === UserRole.OFFICER) ? 'TEST001' : activeOfficerId;

    switch (currentPath) {
      case 'personal-info':
        return <PersonalInfoPage info={state.personalInfo[effectiveId]} onSave={updatePersonalInfo} />;
      case 'exam-reports':
        return (
          <ExamReportPage 
            reports={state.examReports[effectiveId] || []} 
            systemConfig={state.systemConfig}
            onAdd={(r) => setState(prev => ({...prev, examReports: {...prev.examReports, [effectiveId]: [...(prev.examReports[effectiveId] || []), r]}}))} 
            onDelete={(id) => setState(prev => ({...prev, examReports: {...prev.examReports, [effectiveId]: prev.examReports[effectiveId].filter(r => r.id !== id)}}))}
          />
        );
      case 'psych-test':
        return (
          <PsychTestPage 
            reports={state.psychTestReports[effectiveId] || []} 
            onAddReport={(r) => setState(prev => ({...prev, psychTestReports: {...prev.psychTestReports, [effectiveId]: [...(prev.psychTestReports[effectiveId] || []), r]}}))}
            officerInfo={state.personalInfo[effectiveId]}
            systemConfig={state.systemConfig}
          />
        );
      case 'psych-counseling':
        return (
          <PsychCounselingPage 
            officerInfo={state.personalInfo[effectiveId]}
            exams={state.examReports[effectiveId] || []}
            psychReports={state.psychTestReports[effectiveId] || []}
            systemConfig={state.systemConfig}
          />
        );
      case 'talk-entry':
        return (
          <TalkEntryPage 
            records={state.talkRecords} 
            onAdd={handleAddTalkRecord} 
            onDelete={(id) => setState(prev => ({...prev, talkRecords: prev.talkRecords.filter(r => r.id !== id)}))}
          />
        );
      case 'dashboard':
        return <DashboardPage state={state} onNavigate={(path) => navigate(path)} />;
      case 'analysis-report':
        return <AnalysisReportPage state={state} onSaveReport={saveAnalysisReport} />;
      default:
        return <PersonalInfoPage info={state.personalInfo[effectiveId]} onSave={updatePersonalInfo} />;
    }
  };

  const showSidebar = state.currentUser && currentPath !== 'identity-select';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {state.currentUser && (
        <Header 
          user={state.currentUser} 
          onBack={() => window.history.back()} 
          onLogout={logout} 
          showBack={currentPath !== 'identity-select' && currentPath !== 'login'}
        />
      )}
      <div className="flex flex-1 overflow-hidden relative">
        {showSidebar && <Sidebar role={state.currentUser.role} currentPath={currentPath} onNavigate={navigate} />}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
