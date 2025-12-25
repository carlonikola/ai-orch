
import React, { useState } from 'react';
import { Share2, Sparkles, Loader2, Copy, CheckCircle2, FileText, Zap } from 'lucide-react';
import { KnowledgeDocument } from '../types';
import { generateLinkedInAuthorityContent } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const LinkedInEngine: React.FC<{ documents: KnowledgeDocument[] }> = ({ documents }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCopied(false);
    try {
        const res = await generateLinkedInAuthorityContent(documents);
        setResult(res);
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const copyToClipboard = () => {
      if (result) {
          navigator.clipboard.writeText(result);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar scroll-smooth pb-20">
      <header className="flex-shrink-0 flex justify-between items-center px-6 py-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-400/30">
                <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">LinkedIn Authority</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authority Content Engine</p>
            </div>
        </div>
      </header>

      <section className="flex-shrink-0 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl mx-6 mb-10">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4 text-slate-400">
                <FileText className="w-10 h-10 text-indigo-400/30" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Basis-Wissen</p>
                    <p className="text-sm font-bold text-white">{documents.length} Dokumente indexiert</p>
                </div>
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={isGenerating || documents.length === 0} 
              className="w-full md:w-auto h-[52px] px-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-30 text-xs"
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-current" />}
                Batch Erzeugen
            </button>
        </div>
      </section>

      <div className="px-6">
          {result ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Generierter Experten-Content</h3>
                        </div>
                        <button 
                            onClick={copyToClipboard}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl border border-slate-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                            {copied ? 'Kopiert' : 'Inhalt Kopieren'}
                        </button>
                  </div>
                  <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result}
                      </ReactMarkdown>
                  </div>
              </div>
          ) : (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] py-20 flex flex-col items-center justify-center text-slate-700">
                  <Share2 className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-xs">Warte auf Content-Trigger</p>
              </div>
          )}
      </div>
    </div>
  );
};
