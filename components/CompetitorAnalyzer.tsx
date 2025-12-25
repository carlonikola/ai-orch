
import React, { useState } from 'react';
import { ShieldAlert, Search, Loader2, Zap, Swords, TrendingUp, CheckCircle, Map, Globe, Table as TableIcon } from 'lucide-react';
import { runCompetitorAnalyzer } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const CompetitorAnalyzer: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketAnalysis, setMarketAnalysis] = useState<string | null>(null);

  const handleScanSwissMarket = async () => {
    setIsAnalyzing(true);
    try {
        const result = await runCompetitorAnalyzer();
        setMarketAnalysis(result);
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
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg border border-rose-400/30">
                <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Competitor Scout</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Swiss Market Superiority Unit</p>
            </div>
        </div>
      </header>

      <section className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl mx-6 mb-10 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Map className="w-80 h-80 text-white" />
        </div>
        
        <div className="max-w-3xl relative z-10">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Vairon Markt-Hoheit</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-2xl">
                Automatischer Scan der Schweizer KI-Telefonie-Landschaft. Identifikation von direkten Mitbewerbern und Extraktion deren Schwachstellen. Erstellung von taktischen Battlecards basierend auf Vairons ROI-Vorteilen (88% Ersparnis, &lt;200ms Latenz).
            </p>
            
            <button 
              onClick={handleScanSwissMarket} 
              disabled={isAnalyzing} 
              className="px-12 h-16 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl transition-all disabled:opacity-30 text-sm shadow-rose-500/20 active:scale-95"
            >
                {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Swords className="w-6 h-6" />}
                Schweizer Markt Scannen & Battlecards Erstellen
            </button>
        </div>
      </section>

      <div className="px-6">
          {marketAnalysis ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 flex flex-wrap justify-end gap-3 pointer-events-none">
                      <div className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm">
                          <TrendingUp className="w-4 h-4" /> Market Dominance Ready
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm">
                          <CheckCircle className="w-4 h-4" /> Data Verified
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
                        <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 font-black">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Competitive Intelligence Dossier</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Swiss AI Infrastructure Analysis</p>
                        </div>
                  </div>
                  
                  {/* WRAPPER FOR MARKDOWN TO ENSURE TABLES DONT BREAK LAYOUT */}
                  <div className="max-w-full overflow-hidden">
                    <div className="prose prose-invert max-w-none competitor-output overflow-x-auto custom-scrollbar pb-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {marketAnalysis}
                        </ReactMarkdown>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            <TableIcon className="w-4 h-4" /> Analyse-Sektionen wurden automatisch strukturiert
                        </div>
                        <button onClick={() => window.print()} className="text-[10px] font-black text-rose-400 hover:text-white uppercase tracking-widest transition-colors">Export as PDF</button>
                  </div>
              </div>
          ) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] py-32 flex flex-col items-center justify-center text-slate-700">
                  {isAnalyzing ? (
                      <>
                        <div className="relative mb-8">
                            <Globe className="w-20 h-20 text-rose-500 animate-pulse opacity-20" />
                            <Loader2 className="w-12 h-12 absolute inset-0 m-auto animate-spin text-rose-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="font-black uppercase tracking-[0.4em] text-[12px] text-rose-500">System scannt Schweizer Branchen...</p>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Wettbewerbsvorteile werden kalkuliert</p>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 opacity-40">
                            <Search className="w-10 h-10" />
                        </div>
                        <p className="font-black uppercase tracking-[0.5em] text-[10px] opacity-40">Bereit für operative Markt-Intelligence</p>
                      </>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};
