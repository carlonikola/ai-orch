
import React from 'react';
import { LayoutDashboard, Database, Briefcase, Target, Microscope, Calculator, Workflow, Zap, Share2, Coins, PhoneCall, Cpu, ShieldAlert } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const mainNav = [
    { id: 'dashboard', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'crm', label: 'CRM & Pipeline', icon: Briefcase }, 
    { id: 'knowledge', label: 'Wissensdatenbank', icon: Database },
  ];

  const scoutNav = [
    { id: 'lead-scout', label: 'Vairon Lead Scout', icon: Target },
    { id: 'analyzer', label: 'Strategic Analyzer', icon: Microscope },
    { id: 'competitor-analyzer', label: 'Competitor Scout', icon: ShieldAlert },
  ];

  const strategicSuite = [
    { id: 'roi-calculator', label: 'ROI Kalkulator', icon: Calculator },
    { id: 'workflow-designer', label: 'Workflow Designer', icon: Workflow },
    { id: 'tech-scout', label: 'Integration Scout', icon: Zap },
    { id: 'pricing-architect', label: 'Pricing Architect', icon: Coins },
    { id: 'sales-closer', label: 'Sales Closer', icon: PhoneCall },
    { id: 'linkedin-engine', label: 'LinkedIn Authority', icon: Share2 },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
          <Cpu className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 tracking-tight">VAIRON OS</h1>
          <span className="text-xs text-indigo-400 font-medium tracking-wider">SWISS AI CORE</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Main Core</p>
          {mainNav.map((item) => (
            <NavItem key={item.id} item={item} currentView={currentView} setView={setView} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Intelligence</p>
          {scoutNav.map((item) => (
            <NavItem key={item.id} item={item} currentView={currentView} setView={setView} />
          ))}
        </div>

        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Strategic Suite</p>
          {strategicSuite.map((item) => (
            <NavItem key={item.id} item={item} currentView={currentView} setView={setView} />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-emerald-400 font-medium">Vairon Core Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ item, currentView, setView }: any) => {
  const Icon = item.icon;
  const isActive = currentView === item.id;
  return (
    <button
      onClick={() => setView(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-sm'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
      <span className="text-sm font-medium">{item.label}</span>
    </button>
  );
};
