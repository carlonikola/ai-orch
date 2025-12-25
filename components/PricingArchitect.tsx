
import React, { useState } from 'react';
import { Coins, Loader2, Zap, Target, ChevronDown, CheckCircle, FileSpreadsheet, Users, Layers, ShieldCheck, Gauge } from 'lucide-react';
import { Lead } from '../types';
import { calculatePricingAndComplexity } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const PricingArchitect: React.FC<{ leads: Lead[] }> = ({ leads }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [requirements, setRequirements] = useState('');
  const [users, setUsers] = useState(5);
  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [sla, setSla] = useState<'standard' | 'priority' | 'critical'>('priority');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleCalculate = async () => {
    if (!selectedLead) return;
    setIsCalculating(true);
    setResult(null);
    try {
        const fullOutput = await calculatePricingAndComplexity(selectedLead, requirements, users, complexity, sla);
        setResult(fullOutput);
    } catch (e) { console.error(e); } finally { setIsCalculating(false); }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar scroll-smooth pb-20">
      <header className="flex-shrink-0 flex justify-between items-center px-6 py-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30">
                <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Pricing Architect</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enterprise Quote Engine</p>
            </div>
        </div>
      </header>

      <section className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mx-6 mb-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Lead auswählen</label>
                    <div className="relative">
                        <Target className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                        <select 
                            value={selectedLeadId || ''} 
                            onChange={(e) => { setSelectedLeadId(e.target.value); setResult(null); }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Lead wählen...</option>
                            {leads.map(lead => (
                                <option key={lead.id} value={lead.id}>{lead.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-600 pointer-events-none" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Anzahl Agents</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                            <input 
                                type="number" 
                                value={users} 
                                onChange={e => setUsers(parseInt(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white font-bold"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Support (SLA)</label>
                        <div className="relative">
                            <ShieldCheck className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                            <select 
                                value={sla} 
                                onChange={e => setSla(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white font-bold appearance-none"
                            >
                                <option value="standard">Standard</option>
                                <option value="priority">Priority (24/7)</option>
                                <option value="critical">Critical (Managed)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Implementierungs-Komplexität</label>
                    <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => setComplexity(level)}
                                className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${complexity === level ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Spezielle Anforderungen / Workflows</label>
                    <textarea 
                        value={requirements}
                        onChange={e => setRequirements(e.target.value)}
                        placeholder="z.B. Integration in Abacus CRM, spezifische Call-Flows, Voice-Cloning..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold h-40 resize-none shadow-inner"
                    />
                </div>
                <button 
                  onClick={handleCalculate} 
                  disabled={isCalculating || !selectedLeadId} 
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl transition-all disabled:opacity-30 text-sm shadow-indigo-500/20"
                >
                    {isCalculating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Gauge className="w-6 h-6" />}
                    Kalkulations-Matrix Erstellen
                </button>
            </div>
        </div>
      </section>

      <div className="px-6">
          {result ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 relative">
                  <div className="absolute top-0 right-0 p-8">
                      <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Ready for Signature
                      </div>
                  </div>
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black">
                            {selectedLead?.name.charAt(0)}
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">Enterprise Proposal: {selectedLead?.name}</h3>
                  </div>
                  <div className="prose prose-invert max-w-none pricing-output">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result}
                      </ReactMarkdown>
                  </div>
              </div>
          ) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] py-24 flex flex-col items-center justify-center text-slate-700">
                  <FileSpreadsheet className="w-20 h-20 mb-6 opacity-10" />
                  <p className="font-black uppercase tracking-[0.4em] text-[10px]">Kalkulations-Engine Bereit</p>
              </div>
          )}
      </div>
    </div>
  );
};
