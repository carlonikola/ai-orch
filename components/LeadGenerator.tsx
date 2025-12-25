
import React, { useState, useEffect } from 'react';
import { Target, Save, Loader2, MapPin, CheckCircle2, Globe, Layers, CheckSquare, Square, Building2, User, Zap, Mail, Phone, Link as LinkIcon, PhoneOff } from 'lucide-react';
import { KnowledgeDocument, Lead } from '../types';
import { runLeadScoutAgent } from '../services/geminiService';

interface LeadGeneratorProps {
  documents: KnowledgeDocument[];
  addLead: (lead: Lead) => void;
  allLeads: Lead[]; 
  scoutedLeads: Lead[]; 
  setScoutedLeads: (leads: Lead[]) => void;
}

export const LeadGenerator: React.FC<LeadGeneratorProps> = ({ 
    documents, addLead, allLeads, scoutedLeads, setScoutedLeads 
}) => {
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [amount, setAmount] = useState<number | string>(10);
  
  // Alle Filter standardmässig auf TRUE
  const [onlyMultiLocation, setOnlyMultiLocation] = useState(true);
  const [mustHaveEmail, setMustHaveEmail] = useState(true);
  const [mustHavePhone, setMustHavePhone] = useState(true);
  const [mustHaveWebsite, setMustHaveWebsite] = useState(true);

  const [isScouting, setIsScouting] = useState(false);
  const [addedLeads, setAddedLeads] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);

  // Verhindere Re-Scraping von bestehenden Leads ODER Failed Calls
  const forbiddenNames = allLeads.map(l => l.name);

  const handleScout = async () => {
    let finalAmount = parseInt(amount.toString());
    if (isNaN(finalAmount) || !industry.trim() || !region.trim()) return;
    
    setIsScouting(true);
    setScoutedLeads([]);
    setSources([]);

    try {
        const { leads: rawLeads, sources: rawSources } = await runLeadScoutAgent(
            industry, 
            region, 
            finalAmount, 
            forbiddenNames
        );
        
        let processedLeads: Lead[] = rawLeads.map((r: any) => ({
            id: r.id || crypto.randomUUID(),
            name: r.company || r.name,
            contactPerson: r.contactPerson || 'N/A',
            phone: r.phone || '',
            email: r.email || '',
            website: r.website || '',
            summary: r.summary || '',
            companySize: r.companySize || 'N/A',
            segment: industry,
            status: 'New',
            confidence: r.potential || 70,
            region: r.region || region,
            isMultiLocation: r.isMultiLocation || false,
            locations: r.locations || [],
            isScraped: true
        }));

        // STRIKTE STANDORT LOGIK:
        // Wenn Toggle AUS -> Entferne alle Multi-Standort Unternehmen (Userwunsch: "niemals irgendwas mit multi standort")
        if (!onlyMultiLocation) {
            processedLeads = processedLeads.filter(l => !l.isMultiLocation);
        }

        if (mustHaveEmail) processedLeads = processedLeads.filter(l => l.email && l.email.includes('@'));
        if (mustHavePhone) processedLeads = processedLeads.filter(l => l.phone && l.phone.length > 5);
        if (mustHaveWebsite) processedLeads = processedLeads.filter(l => l.website && l.website.length > 3);
        
        setScoutedLeads(processedLeads);
        setSources(rawSources);
    } catch (e) {
        console.error(e);
    } finally {
        setIsScouting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar pb-20">
      <header className="px-6 py-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30 shadow-indigo-500/20">
              <Target className="w-6 h-6 text-white" />
          </div>
          <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Vairon Lead Scout</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retell AI Prospecting Engine</p>
          </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mx-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Ziel-Branche</label>
                <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="z.B. Zahnärzte" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white font-bold focus:border-indigo-500 outline-none transition-all" />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Region</label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                    <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="z.B. Zürich" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white font-bold focus:border-indigo-500 outline-none transition-all" />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Batch-Grösse</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white font-bold focus:border-indigo-500 outline-none transition-all" />
            </div>
            <button onClick={handleScout} disabled={isScouting || !industry || !region} className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-xl shadow-indigo-500/20">
                {isScouting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                Scan Starten
            </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-8 items-center">
            <button onClick={() => setOnlyMultiLocation(!onlyMultiLocation)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${onlyMultiLocation ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}>
                {onlyMultiLocation ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />} <Layers className="w-4 h-4" /> Multi-Standort
            </button>
            <button onClick={() => setMustHaveEmail(!mustHaveEmail)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mustHaveEmail ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}>
                {mustHaveEmail ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />} <Mail className="w-4 h-4" /> Mit E-Mail
            </button>
            <button onClick={() => setMustHavePhone(!mustHavePhone)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mustHavePhone ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}>
                {mustHavePhone ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />} <Phone className="w-4 h-4" /> Mit Telefon
            </button>
            <button onClick={() => setMustHaveWebsite(!mustHaveWebsite)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mustHaveWebsite ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}>
                {mustHaveWebsite ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />} <Globe className="w-4 h-4" /> Mit Website
            </button>
        </div>
      </section>

      {scoutedLeads.length > 0 && (
          <div className="px-6 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{scoutedLeads.length} Neue Potentiale identifiziert</span>
          </div>
      )}

      <div className="px-6 space-y-6">
          {scoutedLeads.map((lead) => (
              <div key={lead.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-500/50 transition-all group flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0 w-full">
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-500/30 transition-all shadow-inner">
                          <Building2 className="w-8 h-8 text-slate-700 group-hover:text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                              <h4 className="font-black text-slate-100 text-xl truncate uppercase tracking-tight">{lead.name}</h4>
                              {lead.isMultiLocation && (
                                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] px-2 py-1 rounded-md font-black uppercase tracking-widest flex items-center gap-1">
                                      <Layers className="w-3 h-3" /> Multi-Standort
                                  </span>
                              )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                              <span className="flex items-center gap-2 truncate"><User className="w-3.5 h-3.5 text-indigo-400" /> {lead.contactPerson}</span>
                              <span className="flex items-center gap-2 truncate font-mono text-indigo-400/80"><Globe className="w-3.5 h-3.5" /> {lead.website || 'N/A'}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
                      <div className={`px-6 py-3 rounded-2xl border-2 flex flex-col items-center justify-center min-w-[100px] border-indigo-500/20 bg-indigo-500/10`}>
                          <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 opacity-60">Potential</span>
                          <span className="text-xl font-black text-indigo-400">{lead.confidence}%</span>
                      </div>
                      <button 
                          onClick={(e) => { 
                              addLead(lead); 
                              setAddedLeads(prev => new Set(prev).add(lead.id)); 
                          }}
                          className={`p-4 rounded-2xl border transition-all ${addedLeads.has(lead.id) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500 shadow-lg'}`}
                      >
                          {addedLeads.has(lead.id) ? <CheckCircle2 className="w-6 h-6" /> : <Save className="w-6 h-6" />}
                      </button>
                  </div>
              </div>
          ))}
          
          {scoutedLeads.length === 0 && !isScouting && (
              <div className="py-20 flex flex-col items-center justify-center opacity-10">
                  <Target className="w-20 h-20 mb-4" />
                  <p className="font-black uppercase tracking-[0.5em] text-xs">Ready for Acquisition</p>
              </div>
          )}
      </div>
    </div>
  );
};
