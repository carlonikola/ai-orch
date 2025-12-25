
import React, { useState, useRef } from 'react';
import { Briefcase, Database, Plus, Trash2, Phone, Mail, Globe, X, Microscope, Upload, Download, Layers, CheckCircle2, AlertCircle, PhoneOff, FileSpreadsheet, Loader2, Sparkles, MapPin, Building2, User, Zap } from 'lucide-react';
import { Client, Lead } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import { parseImportedData } from '../services/geminiService';

interface CRMProps {
  clients: Client[];
  leads: Lead[];
  addClient: (client: Client) => void;
  addLead: (lead: Lead) => void;
  removeLead: (id: string) => void;
  updateLead: (lead: Lead) => void;
  onAnalyzeLead: (leadId: string) => void;
}

export const CRM: React.FC<CRMProps> = ({ clients, leads, addClient, addLead, removeLead, updateLead, onAnalyzeLead }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'leads'>('leads');
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states für manuelles Anlegen
  const [name, setName] = useState('');
  const [segment, setSegment] = useState(''); 
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [summary, setSummary] = useState('');
  const [mrr, setMrr] = useState('');

  const handleExport = () => {
    const currentData = activeTab === 'leads' ? leads : clients;
    if (currentData.length === 0) {
      alert("Keine Daten zum Exportieren vorhanden.");
      return;
    }

    // Vollständiger Daten-Export inkl. aller Metadaten
    const exportData = currentData.map((l: any) => ({
      'ID': l.id,
      'Unternehmen': l.name,
      'Ansprechpartner': (l as Lead).contactPerson || 'N/A',
      'E-Mail': (l as Lead).email || 'N/A',
      'Telefon': (l as Lead).phone || 'N/A',
      'Webseite': (l as Lead).website || 'N/A',
      'Region': (l as Lead).region || 'N/A',
      'Branche/Segment': (l as Lead).segment || (l as Client).industry || 'N/A',
      'Status': l.status,
      'Potential (%)': (l as Lead).confidence || 'N/A',
      'MRR (CHF)': (l as Client).mrr || 0,
      'Multi-Standort': (l as Lead).isMultiLocation ? 'Ja' : 'Nein',
      'Standorte': (l as Lead).locations?.join(', ') || '',
      'KI-Zusammenfassung': (l as Lead).summary || '',
      'Analyse-Dossier': (l as Lead).analysis || '',
      'ROI Kalkulation': (l as Lead).roiCalculation || '',
      'Tech-Stack': (l as Lead).techStackAudit || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `VAIRON_${activeTab.toUpperCase()}`);
    
    const wscols = [
      {wch: 20}, {wch: 30}, {wch: 25}, {wch: 25}, {wch: 20}, {wch: 30}, 
      {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 30}, {wch: 50}
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, `VAIRON_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            if (data.length === 0) {
              alert("Die Datei scheint leer zu sein.");
              return;
            }

            setIsProcessing(true);
            const enrichedData = await parseImportedData(data, activeTab);
            setImportPreview(enrichedData);
        } catch (err) {
            console.error("Import Error:", err);
            alert("Fehler beim Verarbeiten der Datei.");
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    if (!importPreview) return;
    
    importPreview.forEach(item => {
        const newLead: Lead = {
            id: crypto.randomUUID(),
            name: item.company || item.name || 'Unbekannt',
            segment: item.segment || item.industry || 'Importiert',
            contactPerson: item.contactPerson || 'N/A',
            phone: item.phone || '',
            email: item.email || '',
            website: item.website || '',
            summary: item.summary || item.briefing || 'KI-generiertes Profil aus Import.',
            status: 'New',
            confidence: item.potential || 50,
            isMultiLocation: item.isMultiLocation || false,
            locations: item.locations || [],
            region: item.region || ''
        };
        addLead(newLead);
    });
    
    setImportPreview(null);
  };

  const handleCreateManual = () => {
    if (!name) return;
    
    if (activeTab === 'clients') {
      addClient({
        id: crypto.randomUUID(),
        name,
        industry: segment,
        agentType: 'AI Call Agent',
        status: 'Onboarding',
        mrr: Number(mrr) || 0
      });
    } else {
      addLead({
        id: crypto.randomUUID(),
        name,
        segment,
        contactPerson,
        phone,
        email,
        website,
        summary: summary || 'Manuell angelegter Lead.',
        status: 'New',
        confidence: 50
      });
    }
    
    setShowForm(false);
    setName(''); setSegment(''); setContactPerson(''); setPhone(''); setEmail(''); setWebsite(''); setSummary(''); setMrr('');
  };

  const setStatus = (lead: Lead, status: Lead['status']) => {
      updateLead({ ...lead, status });
      if (selectedLead?.id === lead.id) {
          setSelectedLead({ ...lead, status });
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar pb-20 scroll-smooth">
      <header className="flex justify-between items-center px-6 py-6 flex-shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30 shadow-indigo-500/20">
                <Database className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Vairon Pipeline</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enterprise Asset Management</p>
            </div>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner">
          <button onClick={() => setActiveTab('clients')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Kunden</button>
          <button onClick={() => setActiveTab('leads')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'leads' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Leads</button>
        </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mx-6 mb-10">
        <div className="flex flex-wrap justify-between items-center gap-6">
            <h3 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                {activeTab === 'clients' ? 'Master Client Registry' : 'Active Lead Flow Pipeline'}
            </h3>
            <div className="flex items-center gap-4">
                <button 
                  onClick={handleExport} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-700 transition-all shadow-lg active:scale-95"
                >
                    <Download className="w-4 h-4 text-emerald-400"/> Export Data
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isProcessing}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-700 transition-all shadow-lg"
                >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-indigo-400"/>}
                    AI Data Import
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls,.csv" />
                <button 
                  onClick={() => setShowForm(true)} 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-4 h-4"/> Manueller Eintrag
                </button>
            </div>
        </div>
      </section>

      <div className="px-6 space-y-6">
          {activeTab === 'leads' ? (
              leads.length > 0 ? (
                  leads.map(lead => (
                      <div key={lead.id} onClick={() => setSelectedLead(lead)} className={`bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-500/50 transition-all group flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl cursor-pointer ${lead.status === 'Cold Call Failed' ? 'opacity-50 grayscale' : ''}`}>
                          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0 w-full">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-2xl border ${lead.status === 'Cold Call Failed' ? 'bg-rose-950/30 text-rose-500 border-rose-500/20' : 'bg-slate-950 border-slate-800 text-slate-700 group-hover:text-indigo-500 group-hover:border-indigo-500/30 transition-all shadow-inner'}`}>
                                  {lead.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0 w-full">
                                  <div className="flex flex-wrap items-center gap-3 mb-2">
                                      <h4 className="font-black text-slate-100 text-xl truncate uppercase tracking-tight">{lead.name}</h4>
                                      {lead.isMultiLocation && (
                                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] px-2 py-1 rounded-md font-black uppercase tracking-widest flex items-center gap-1">
                                              <Layers className="w-3 h-3" /> Multi-Standort
                                          </span>
                                      )}
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded border ${lead.status === 'Cold Call Failed' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'}`}>{lead.status}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                      <span className="flex items-center gap-2 truncate"><User className="w-3.5 h-3.5 text-indigo-400" /> {lead.contactPerson}</span>
                                      <span className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {lead.email || 'N/A'}</span>
                                      <span className="flex items-center gap-2 truncate"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {lead.phone || 'N/A'}</span>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
                              <div className={`px-6 py-3 rounded-2xl border-2 flex flex-col items-center justify-center min-w-[100px] border-indigo-500/20 bg-indigo-500/10`}>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 opacity-60">Confidence</span>
                                  <span className="text-xl font-black text-indigo-400">{lead.confidence}%</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); onAnalyzeLead(lead.id); }} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-600 hover:text-indigo-400 shadow-inner transition-all"><Microscope className="w-5 h-5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); removeLead(lead.id); }} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-600 hover:text-rose-500 shadow-inner transition-all"><Trash2 className="w-5 h-5" /></button>
                              </div>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="py-32 flex flex-col items-center justify-center opacity-10">
                      <FileSpreadsheet className="w-20 h-20 mb-4" />
                      <p className="font-black uppercase tracking-[0.5em] text-xs">Pipeline Leer</p>
                  </div>
              )
          ) : (
              clients.length > 0 ? (
                  clients.map(client => (
                      <div key={client.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:border-emerald-500/50 transition-all group flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
                          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0 w-full">
                              <div className="w-16 h-16 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 font-black text-2xl shadow-inner">
                                  {client.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0 w-full">
                                  <div className="flex flex-wrap items-center gap-3 mb-2">
                                      <h4 className="font-black text-slate-100 text-xl truncate uppercase tracking-tight">{client.name}</h4>
                                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] px-3 py-1 rounded-md font-black uppercase tracking-widest">Active Client</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                      <span className="flex items-center gap-2 truncate"><Building2 className="w-3.5 h-3.5 text-emerald-500" /> {client.industry}</span>
                                      <span className="flex items-center gap-2 truncate"><Zap className="w-3.5 h-3.5 text-emerald-500" /> {client.agentType}</span>
                                  </div>
                              </div>
                          </div>
                          <div className="text-right w-full lg:w-auto">
                              <div className="text-2xl font-black text-white tabular-nums">CHF {client.mrr.toLocaleString()}</div>
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Monthly Recurring Revenue</span>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="py-32 flex flex-col items-center justify-center opacity-10">
                      <Briefcase className="w-20 h-20 mb-4" />
                      <p className="font-black uppercase tracking-[0.5em] text-xs">Keine Kunden gelistet</p>
                  </div>
              )
          )}
      </div>

      {/* AI IMPORT PREVIEW MODAL */}
      {importPreview && (
          <div className="fixed inset-0 z-[500] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                      <div>
                          <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                              <Sparkles className="text-indigo-400 w-7 h-7 animate-pulse" /> AI-Import-Vorschau
                          </h2>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Strukturierte Daten-Validierung durch VAIRON Intelligence Unit</p>
                      </div>
                      <button onClick={() => setImportPreview(null)} className="p-4 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-2xl"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                          <thead className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                              <tr>
                                  <th className="pb-6 px-4">Unternehmen</th>
                                  <th className="pb-6 px-4">Kontakt</th>
                                  <th className="pb-6 px-4">Potential</th>
                                  <th className="pb-6 px-4">Typ</th>
                                  <th className="pb-6 px-4">KI-Zusammenfassung</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm">
                              {importPreview.map((item, i) => (
                                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                      <td className="py-6 px-4 font-bold text-slate-100">{item.company || item.name}</td>
                                      <td className="py-6 px-4 text-slate-400 text-xs">
                                          <div className="font-bold text-slate-200">{item.contactPerson}</div>
                                          <div className="opacity-50">{item.email}</div>
                                      </td>
                                      <td className="py-6 px-4">
                                          <span className="font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">{item.potential || 70}%</span>
                                      </td>
                                      <td className="py-6 px-4">
                                          {item.isMultiLocation ? <Layers className="w-4 h-4 text-amber-500" /> : <div className="text-[10px] text-slate-600 font-black uppercase">Single</div>}
                                      </td>
                                      <td className="py-6 px-4 text-slate-500 italic text-[10px] max-w-xs truncate leading-tight">
                                          {item.summary || item.briefing || 'Strukturierte Daten-Extraktion aktiv...'}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-10 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-6">
                      <button onClick={() => setImportPreview(null)} className="text-slate-500 font-black uppercase tracking-widest text-xs px-8 hover:text-white transition-colors">Abbrechen</button>
                      <button 
                        onClick={confirmImport} 
                        className="bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-500 flex items-center gap-3 transition-all shadow-indigo-500/20 active:scale-95"
                      >
                          <CheckCircle2 className="w-5 h-5" /> Import in Pipeline Bestätigen
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MANUAL ENTRY MODAL */}
      {showForm && (
          <div className="fixed inset-0 z-[500] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-10 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{activeTab === 'clients' ? 'Kunden-Registrierung' : 'Lead-Erfassung'}</h2>
                      <button onClick={() => setShowForm(false)} className="p-3 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-2xl"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unternehmen</label>
                              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" placeholder="Firmenname" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Branche / Segment</label>
                              <input value={segment} onChange={e => setSegment(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" placeholder="Zahnärzte, Logistik, etc." />
                          </div>
                          {activeTab === 'leads' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ansprechpartner</label>
                                    <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" placeholder="Vorname Nachname" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-Mail</label>
                                    <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" placeholder="mail@firma.ch" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefon</label>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" placeholder="+41 ..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Webseite</label>
                                    <input value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" placeholder="https://..." />
                                </div>
                            </>
                          ) : (
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monatlicher Umsatz (MRR in CHF)</label>
                                <input value={mrr} type="number" onChange={e => setMrr(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all shadow-inner font-bold" placeholder="0.00" />
                            </div>
                          )}
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notizen / KI-Briefing</label>
                          <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-indigo-500 outline-none transition-all h-28 resize-none shadow-inner font-bold" placeholder="Spezifische Informationen für die KI-Agenten..." />
                      </div>
                  </div>
                  <div className="p-10 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-6">
                      <button onClick={() => setShowForm(false)} className="px-8 py-3 text-slate-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors">Abbrechen</button>
                      <button onClick={handleCreateManual} className="bg-indigo-600 text-white px-12 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Eintrag Erstellen</button>
                  </div>
              </div>
          </div>
      )}

      {/* LEAD DOSSIER MODAL */}
      {selectedLead && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/98 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-10 border-b border-slate-800 bg-slate-800/30 flex justify-between items-start">
                      <div className="flex gap-8">
                          <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl font-black text-indigo-400 shadow-inner">{selectedLead.name.charAt(0)}</div>
                          <div>
                              <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{selectedLead.name}</h2>
                              <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mt-3">{selectedLead.segment} • Pipeline Status: {selectedLead.status}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedLead(null)} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors shadow-lg"><X className="w-8 h-8 text-slate-500" /></button>
                  </div>
                  <div className="p-12 space-y-12 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Kontakt-Dossier</label>
                                <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 space-y-6 shadow-inner">
                                    <div className="flex items-center gap-5 text-sm text-slate-200 font-bold"><Phone className="w-6 h-6 text-indigo-500" /> {selectedLead.phone || 'N/A'}</div>
                                    <div className="flex items-center gap-5 text-sm text-slate-200 font-bold"><Mail className="w-6 h-6 text-indigo-500" /> {selectedLead.email || 'N/A'}</div>
                                    <div className="flex items-center gap-5 text-sm text-indigo-400 font-bold"><Globe className="w-6 h-6" /> {selectedLead.website || 'N/A'}</div>
                                    {selectedLead.region && <div className="flex items-center gap-5 text-sm text-slate-400 font-bold"><MapPin className="w-6 h-6 text-slate-600" /> {selectedLead.region}</div>}
                                </div>
                             </div>
                             <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">Operative Steuerung</label>
                                <div className="flex flex-wrap gap-4">
                                    {(['New', 'Qualified', 'Proposal', 'Closed', 'Cold Call Failed'] as const).map(status => (
                                        <button 
                                            key={status}
                                            onClick={() => setStatus(selectedLead, status)} 
                                            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${
                                                selectedLead.status === status 
                                                ? (status === 'Cold Call Failed' ? 'bg-rose-600 border-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/20')
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {status === 'Cold Call Failed' && <PhoneOff className="w-4 h-4" />}
                                            {status}
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-6">
                                    <div className="flex justify-between items-end mb-3">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Confidence Score</span>
                                        <span className="text-lg font-black text-indigo-400">{selectedLead.confidence}%</span>
                                    </div>
                                    <div className="bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden shadow-inner">
                                        <div className="bg-indigo-500 h-full shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-1000" style={{ width: `${selectedLead.confidence}%` }}></div>
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-slate-800 shadow-inner">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 block flex items-center gap-3">
                                 <Sparkles className="w-5 h-5" /> KI-Audit & Zusammenfassung
                             </label>
                             <div className="prose prose-invert prose-slate max-w-none text-base leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedLead.summary}</ReactMarkdown>
                             </div>
                        </div>
                        {selectedLead.analysis && (
                            <div className="bg-indigo-950/10 p-10 rounded-[2.5rem] border border-indigo-500/20">
                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 block">Strategisches Enterprise Dossier</label>
                                <div className="prose prose-invert prose-indigo max-w-none text-sm">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedLead.analysis}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                  </div>
                  <div className="p-10 bg-slate-800/90 border-t border-slate-800 flex justify-end gap-6 flex-shrink-0">
                      <button onClick={() => setSelectedLead(null)} className="text-slate-500 font-black uppercase tracking-widest text-xs px-10 hover:text-white transition-colors">Dossier Schließen</button>
                      <button onClick={() => onAnalyzeLead(selectedLead.id)} className="bg-indigo-600 text-white px-12 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-indigo-500 transition-all shadow-indigo-500/20 active:scale-95"><Microscope className="w-6 h-6" /> Deep Intelligence Scan</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
