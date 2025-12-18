
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

const STORAGE_KEY = 'jingxin_guardian_data_v3';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      currentUser: null,
      personalInfo: {},
      examReports: {},
      psychTestReports: {},
      talkRecords: [],
      analysisReports: {},
      systemConfig: {
        openRouterKey: '',
        preferredModel: 'gemini-3-pro-preview',
        apiBaseUrl: 'https://openrouter.ai/api/v1'
      }
    };
  });

  const [currentPath, setCurrentPath] = useState<string>(() => window.location.hash.replace('#', '') || 'login');

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
    navigate(role === UserRole.LEADER ? 'dashboard' : 'personal-info');
  };

  const updatePersonalInfo = (info: PersonalInfo) => {
    setState(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [info.policeId]: info }
    }));
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

    const policeId = 'TEST001'; 

    switch (currentPath) {
      case 'personal-info':
        return <PersonalInfoPage info={state.personalInfo[policeId]} onSave={updatePersonalInfo} />;
      case 'exam-reports':
        return (
          <ExamReportPage 
            reports={state.examReports[policeId] || []} 
            systemConfig={state.systemConfig}
            onAdd={(r) => setState(prev => ({...prev, examReports: {...prev.examReports, [policeId]: [...(prev.examReports[policeId] || []), r]}}))} 
            onDelete={(id) => setState(prev => ({...prev, examReports: {...prev.examReports, [policeId]: prev.examReports[policeId].filter(r => r.id !== id)}}))}
          />
        );
      case 'psych-test':
        return (
          <PsychTestPage 
            reports={state.psychTestReports[policeId] || []} 
            onAddReport={(r) => setState(prev => ({...prev, psychTestReports: {...prev.psychTestReports, [policeId]: [...(prev.psychTestReports[policeId] || []), r]}}))}
            officerInfo={state.personalInfo[policeId]}
            systemConfig={state.systemConfig}
          />
        );
      case 'psych-counseling':
        return (
          <PsychCounselingPage 
            officerInfo={state.personalInfo[policeId]}
            exams={state.examReports[policeId] || []}
            psychReports={state.psychTestReports[policeId] || []}
            systemConfig={state.systemConfig}
          />
        );
      case 'talk-entry':
        return (
          <TalkEntryPage 
            records={state.talkRecords} 
            onAdd={(r) => setState(prev => ({...prev, talkRecords: [...prev.talkRecords, r]}))} 
            onDelete={(id) => setState(prev => ({...prev, talkRecords: prev.talkRecords.filter(r => r.id !== id)}))}
          />
        );
      case 'dashboard':
        return <DashboardPage state={state} onNavigate={navigate} />;
      case 'analysis-report':
        return <AnalysisReportPage state={state} onSaveReport={saveAnalysisReport} />;
      default:
        return <PersonalInfoPage info={state.personalInfo[policeId]} onSave={updatePersonalInfo} />;
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
