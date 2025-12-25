
import React, { useState } from 'react';
import { PhoneCall, Loader2, Zap, Target, ChevronDown, CheckCircle, MessageSquare, Copy, CheckCircle2, UserCircle, Brain, ShieldAlert, Swords } from 'lucide-react';
import { Lead } from '../types';
import { generateCloserScript } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const SalesCloser: React.FC<{ leads: Lead[] }> = ({ leads }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [tone, setTone] = useState<'consultative' | 'aggressive' | 'empathetic' | 'challenger'>('consultative');
  const [persona, setPersona] = useState<'CEO' | 'IT-Lead' | 'Sales-Manager' | 'Owner'>('CEO');
  const [focus, setFocus] = useState<'ROI' | 'Innovation' | 'Efficiency' | 'Security'>('ROI');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleGenerate = async () => {
    if (!selectedLead) return;
    setIsGenerating(true);
    setScript(null);
    setCopied(false);
    try {
        const result = await generateCloserScript(selectedLead, tone, persona, focus);
        setScript(result);
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const copyScript = () => {
      if (script) {
          navigator.clipboard.writeText(script);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar scroll-smooth pb-20">
      <header className="flex-shrink-0 flex justify-between items-center px-6 py-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg border border-rose-400/30">
                <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Sales Closer</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Psychological Battle-Card Engine</p>
            </div>
        </div>
      </header>

      <section className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl mx-6 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-end">
            <div className="lg:col-span-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Zielobjekt (Lead)</label>
                <div className="relative">
                    <Target className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <select 
                        value={selectedLeadId || ''} 
                        onChange={(e) => { setSelectedLeadId(e.target.value); setScript(null); }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-rose-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Lead wählen...</option>
                        {leads.map(lead => (
                            <option key={lead.id} value={lead.id}>{lead.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:col-span-3 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Decision Maker Persona</label>
                    <div className="relative">
                        <UserCircle className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                        <select 
                            value={persona} 
                            onChange={e => setPersona(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white font-bold appearance-none"
                        >
                            <option value="CEO">CEO / Inhaber</option>
                            <option value="IT-Lead">IT-Leiter / CTO</option>
                            <option value="Sales-Manager">Vertriebsleitung</option>
                            <option value="Owner">KMU Inhaber</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Psychologischer Fokus</label>
                    <div className="relative">
                        <Brain className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                        <select 
                            value={focus} 
                            onChange={e => setFocus(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white font-bold appearance-none"
                        >
                            <option value="ROI">ROI & Profitabilität</option>
                            <option value="Innovation">Marktführerschaft</option>
                            <option value="Efficiency">Zeit-Einsparung</option>
                            <option value="Security">Sicherheit & Trust</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Verkaufs-Stil</label>
                    <div className="relative">
                        <ShieldAlert className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                        <select 
                            value={tone} 
                            onChange={e => setTone(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white font-bold appearance-none"
                        >
                            <option value="consultative">Beratend (Swiss Trust)</option>
                            <option value="challenger">Challenger (Aggressiv)</option>
                            <option value="empathetic">Empathisch (Solution)</option>
                            <option value="aggressive">Direct Closer</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div className="mt-8 flex justify-end">
            <button 
                onClick={handleGenerate} 
                disabled={isGenerating || !selectedLeadId} 
                className="w-full md:w-auto px-16 h-16 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl transition-all disabled:opacity-30 text-sm shadow-rose-500/20 active:scale-95"
            >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
                Execution Script Generieren
            </button>
        </div>
      </section>

      <div className="px-6">
          {script ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-6 relative">
                  <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-rose-900/20 rounded-2xl flex items-center justify-center border border-rose-500/30">
                                <Swords className="w-7 h-7 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Tactical Battle-Card: {selectedLead?.name}</h3>
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mt-1">Target Persona: {persona} • Focus: {focus}</p>
                            </div>
                        </div>
                        <button 
                            onClick={copyScript}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl border border-slate-700 transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-lg"
                        >
                            {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                            {copied ? 'Kopiert' : 'Battle-Card Kopieren'}
                        </button>
                  </div>
                  <div className="prose prose-invert max-w-none sales-script-output text-slate-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {script}
                      </ReactMarkdown>
                  </div>
              </div>
          ) : (
              <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-[3rem] py-32 flex flex-col items-center justify-center text-slate-800">
                  <MessageSquare className="w-24 h-24 mb-6 opacity-5" />
                  <p className="font-black uppercase tracking-[0.5em] text-[10px] opacity-20">Analysiere Target Psychology...</p>
              </div>
          )}
      </div>
    </div>
  );
};
