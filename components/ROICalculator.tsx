
import React, { useState } from 'react';
import { Calculator, Users, PhoneCall, Loader2, Target, ChevronDown, Zap, Coins } from 'lucide-react';
import { Lead } from '../types';
import { calculateLeadROI } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ROICalculatorProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({ leads, onUpdateLead }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [employees, setEmployees] = useState(10);
  const [salary, setSalary] = useState(85000);
  const [calls, setCalls] = useState(500);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleCalculate = async () => {
    if (!selectedLead) return;
    setIsCalculating(true);
    try {
        const res = await calculateLeadROI(selectedLead, employees, salary, calls);
        setResult(res);
    } catch (e) {
        console.error(e);
    } finally {
        setIsCalculating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar scroll-smooth pb-20">
      <header className="flex-shrink-0 flex justify-between items-center px-6 py-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30">
                <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">ROI Kalkulator</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business Case Engine</p>
            </div>
        </div>
      </header>

      <section className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mx-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="w-full">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Lead</label>
                <div className="relative">
                    <Target className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <select 
                        value={selectedLeadId || ''} 
                        onChange={(e) => { setSelectedLeadId(e.target.value); setResult(null); }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Wählen...</option>
                        {leads.map(lead => (
                            <option key={lead.id} value={lead.id}>{lead.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Mitarbeiter</label>
                <input type="number" value={employees} onChange={e => setEmployees(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold" />
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-2">Ø Gehalt (CHF)</label>
                <input type="number" value={salary} onChange={e => setSalary(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all font-bold" />
            </div>
            <button 
              onClick={handleCalculate} 
              disabled={isCalculating || !selectedLeadId} 
              className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-30 text-xs"
            >
                {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                Berechnung Starten
            </button>
        </div>
      </section>

      <div className="px-6">
          {result ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800">
                        <Coins className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Einsparungspotenzial für {selectedLead?.name}</h3>
                  </div>
                  <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result}
                      </ReactMarkdown>
                  </div>
              </div>
          ) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-slate-700">
                  <Calculator className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-xs">Warte auf Trigger</p>
              </div>
          )}
      </div>
    </div>
  );
};
