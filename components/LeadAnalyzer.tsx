
import React, { useState, useEffect } from 'react';
import { Microscope, BrainCircuit, Globe, Loader2, Target, Zap, ChevronDown, CheckCircle } from 'lucide-react';
import { Lead, KnowledgeDocument } from '../types';
import { analyzeLeadStrategic } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LeadAnalyzerProps {
  leads: Lead[];
  documents: KnowledgeDocument[];
  preselectedLeadId?: string;
  updateLead: (lead: Lead) => void;
  switchToCRM: () => void;
}

export const LeadAnalyzer: React.FC<LeadAnalyzerProps> = ({ 
    leads, documents, preselectedLeadId, updateLead, switchToCRM 
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(preselectedLeadId || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
      if (preselectedLeadId) setSelectedLeadId(preselectedLeadId);
  }, [preselectedLeadId]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleAnalysis = async () => {
      if (!selectedLead) return;
      setIsAnalyzing(true);
      
      try {
          const analysisResult = await analyzeLeadStrategic(selectedLead, documents);
          const updatedLead = { ...selectedLead, analysis: analysisResult };
          updateLead(updatedLead);
      } catch (e) {
          console.error(e);
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar scroll-smooth pb-20">
      <header className="flex-shrink-0 flex justify-between items-center px-6 py-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30">
                <Microscope className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Strategic Analyzer</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deep Intelligence Audit</p>
            </div>
        </div>
      </header>

      <section className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mx-6 mb-10">
        <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Lead auswählen</label>
                <div className="relative">
                    <Target className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <select 
                        value={selectedLeadId || ''} 
                        onChange={(e) => setSelectedLeadId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Lead wählen...</option>
                        {leads.map(lead => (
                            <option key={lead.id} value={lead.id}>{lead.name} {lead.analysis ? '✓' : ''}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
            </div>
            <button 
              onClick={handleAnalysis} 
              disabled={isAnalyzing || !selectedLeadId} 
              className="w-full md:w-auto h-[52px] px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-30 text-xs"
            >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                Deep-Scan Starten
            </button>
        </div>
      </section>

      <div className="px-6">
          {!selectedLead ? (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-slate-700">
                  <BrainCircuit className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-xs">Warte auf Auswahl</p>
              </div>
          ) : selectedLead.analysis ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Audit-Ergebnisse für {selectedLead.name}</h3>
                        </div>
                        <div className="prose prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedLead.analysis}
                            </ReactMarkdown>
                        </div>
                  </div>
              </div>
          ) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-slate-700">
                  {isAnalyzing ? (
                      <>
                          <Loader2 className="w-16 h-16 mb-4 animate-spin text-indigo-500" />
                          <p className="font-black uppercase tracking-widest text-xs text-indigo-400">Analysiere digitale DNA...</p>
                      </>
                  ) : (
                      <>
                          <Zap className="w-16 h-16 mb-4 opacity-10" />
                          <p className="font-black uppercase tracking-widest text-xs">Bereit für Analyse</p>
                      </>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};
