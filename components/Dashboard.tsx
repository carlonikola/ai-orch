
import React from 'react';
import { Target, Database, PlayCircle, Activity, ArrowUpRight, Briefcase } from 'lucide-react';
import { KnowledgeDocument, TaskLog, ViewState } from '../types';

interface DashboardProps {
  documents: KnowledgeDocument[];
  tasks: TaskLog[];
  changeView: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ documents, tasks, changeView }) => {
  const stats = [
    { 
      label: 'Lead Pipeline', 
      value: 'Aktiv', 
      icon: Target, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10', 
      border: 'border-indigo-500/20',
      action: 'lead-scout' as ViewState
    },
    { 
      label: 'CRM Pipeline', 
      value: 'Aktiv', 
      icon: Briefcase, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20',
      action: 'crm' as ViewState
    },
    { 
      label: 'Wissens-Assets', 
      value: documents.length, 
      icon: Database, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/20',
      action: 'knowledge' as ViewState
    },
  ];

  return (
    <div className="space-y-8 h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="animate-in fade-in duration-700">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Vairon Kommandozentrale</h2>
        <p className="text-slate-500 mt-2 font-medium tracking-wide">Operativer Status Ihres Schweizer KI-Systems.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button 
                key={stat.label}
                onClick={() => changeView(stat.action)}
                className={`text-left p-6 rounded-[2rem] border-2 ${stat.border} ${stat.bg} hover:bg-opacity-20 transition-all group shadow-2xl backdrop-blur-sm`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl bg-slate-950/80 border border-slate-800 ${stat.color} shadow-inner`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="p-2 bg-slate-900 rounded-full border border-slate-800 group-hover:bg-indigo-600 transition-colors">
                  <ArrowUpRight className={`w-4 h-4 text-slate-500 group-hover:text-white transition-colors`} />
                </div>
              </div>
              <div className="text-4xl font-black text-white mb-1 tabular-nums tracking-tighter">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-6 duration-700 delay-100">
        {/* Full Width Activity Stream */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-slate-300 flex items-center gap-3 uppercase tracking-[0.2em]">
                <Activity className="w-5 h-5 text-amber-500 animate-pulse" /> System-Aktivität
              </h3>
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800">
                System Batch: Stable
              </div>
           </div>
           
           <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.slice(-5).reverse().map(t => (
                  <div key={t.id} className="p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex items-center justify-between hover:border-indigo-500/30 transition-all group/item shadow-inner">
                      <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 font-black text-xs">
                              V
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">System</span>
                                <span className="text-[9px] font-bold text-slate-600">{new Date(t.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-sm text-slate-300 font-medium italic line-clamp-1 group-hover/item:text-white transition-colors">"{t.prompt}"</div>
                          </div>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {t.status}
                      </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 group-hover:opacity-30 transition-opacity">
                    <PlayCircle className="w-16 h-16 mb-4 text-slate-500" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Keine aktuellen System-Events</p>
                </div>
              )}
           </div>
        </div>
      </div>
      
      <div className="pt-12 pb-8 flex flex-col items-center opacity-30">
          <div className="w-12 h-1 bg-slate-800 rounded-full mb-6"></div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Vairon Operating System • Swiss AI Cluster</p>
      </div>
    </div>
  );
};
