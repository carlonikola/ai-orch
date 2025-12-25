
import React, { useState, Component, ReactNode, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KnowledgeBase } from './components/KnowledgeBase';
import { CRM } from './components/CRM';
import { LeadGenerator } from './components/LeadGenerator';
import { LeadAnalyzer } from './components/LeadAnalyzer';
import { ROICalculator } from './components/ROICalculator';
import { WorkflowDesigner } from './components/WorkflowDesigner';
import { TechScout } from './components/TechScout';
import { LinkedInEngine } from './components/LinkedInEngine';
import { PricingArchitect } from './components/PricingArchitect';
import { SalesCloser } from './components/SalesCloser';
import { CompetitorAnalyzer } from './components/CompetitorAnalyzer';
import { KnowledgeDocument, TaskLog, Client, Lead, ViewState } from './types';
import { AlertTriangle, Loader2 } from 'lucide-react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  public state = { hasError: false, error: undefined };
  public static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 p-10 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-6" />
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">Vairon UI Recovery</h2>
          <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase shadow-xl">Kernel Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [tasks, setTasks] = useState<TaskLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  const [scoutedLeads, setScoutedLeads] = useState<Lead[]>([]);
  const [selectedLeadIdForAnalysis, setSelectedLeadIdForAnalysis] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const addDocument = (doc: KnowledgeDocument) => setDocuments(prev => [...prev, doc]);
  const removeDocument = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));
  
  const addTask = (task: TaskLog) => setTasks(prev => [...prev, task]);
  const updateTaskStatus = (id: string, status: TaskLog['status'], response: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, response } : t));
  };

  const addClient = (client: Client) => setClients(prev => [...prev, client]);
  const addLead = (lead: Lead) => {
    if (!leads.find(l => l.name === lead.name)) {
        setLeads(prev => [...prev, lead]);
    }
  };
  const removeLead = (id: string) => setLeads(prev => prev.filter(l => l.id !== id));
  const updateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard documents={documents} tasks={tasks} changeView={setCurrentView} />;
      case 'knowledge': return <KnowledgeBase documents={documents} addDocument={addDocument} removeDocument={removeDocument} />;
      case 'crm': return (
        <CRM 
          clients={clients} 
          leads={leads} 
          addClient={addClient} 
          addLead={addLead} 
          removeLead={removeLead} 
          updateLead={updateLead}
          onAnalyzeLead={(id) => { setSelectedLeadIdForAnalysis(id); setCurrentView('analyzer'); }} 
        />
      );
      case 'lead-scout': return (
        <LeadGenerator 
            documents={documents} 
            addLead={addLead} 
            allLeads={leads} 
            scoutedLeads={scoutedLeads} 
            setScoutedLeads={setScoutedLeads} 
        />
      );
      case 'analyzer': return <LeadAnalyzer leads={leads} documents={documents} preselectedLeadId={selectedLeadIdForAnalysis} updateLead={updateLead} switchToCRM={() => setCurrentView('crm')} />;
      case 'roi-calculator': return <ROICalculator leads={leads} onUpdateLead={updateLead} />;
      case 'workflow-designer': return <WorkflowDesigner leads={leads} />;
      case 'tech-scout': return <TechScout leads={leads} />;
      case 'pricing-architect': return <PricingArchitect leads={leads} />;
      case 'sales-closer': return <SalesCloser leads={leads} />;
      case 'competitor-analyzer': return <CompetitorAnalyzer />;
      case 'linkedin-engine': return <LinkedInEngine documents={documents} />;
      default: return <Dashboard documents={documents} tasks={tasks} changeView={setCurrentView} />;
    }
  };

  if (!isReady) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Vairon OS Booting...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen bg-slate-950 overflow-hidden">
        <Sidebar currentView={currentView} setView={setCurrentView} />
        <main className="flex-1 ml-64 p-8 relative overflow-hidden flex flex-col">
          {renderView()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;
