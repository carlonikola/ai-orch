import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { KnowledgeDocument, TaskLog, WorkerProfile } from '../types';
import { executeWorkerTask } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Define the "Super Worker" profile locally
const GENERAL_ASSISTANT_PROFILE: WorkerProfile = {
    id: 'vairon-core-assistant',
    name: 'Vairon Core',
    role: 'General Intelligence Unit',
    instructions: `
        Du bist Vairon Core, die zentrale künstliche Intelligenz des Vairon Operating Systems.
        Deine Aufgabe ist es, dem Nutzer bei ALLEN Anfragen zu helfen. 
        Du hast Zugriff auf die gesamte Wissensdatenbank und bist nicht auf eine Rolle beschränkt.
        
        Prinzipien:
        1. Allwissend (im Kontext der hochgeladenen Dokumente): Nutze bereitgestelltes Wissen intensiv.
        2. Proaktiv & Lösungsorientiert: Schlage konkrete Lösungen vor.
        3. Vairon Identity: Professionell, Schweizer Qualität, Präzise.
        
        Du kannst Code schreiben, Texte analysieren, Strategien entwickeln und Leads bewerten.
    `,
    avatarColor: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    createdAt: 0
};

// Added missing interface for GeneralAssistant props
interface GeneralAssistantProps {
  documents: KnowledgeDocument[];
  tasks: TaskLog[];
  addTask: (task: TaskLog) => void;
  updateTaskStatus: (id: string, status: TaskLog['status'], response: string) => void;
}

export const GeneralAssistant: React.FC<GeneralAssistantProps> = ({ documents, tasks, addTask, updateTaskStatus }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set(documents.map(d => d.id))); // Select all by default
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter tasks strictly for this assistant
  const assistantTasks = tasks.filter(t => t.workerId === GENERAL_ASSISTANT_PROFILE.id);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [assistantTasks, isProcessing]);

  const toggleDoc = (id: string) => {
    const newSet = new Set(selectedDocIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocIds(newSet);
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const taskId = crypto.randomUUID();
    const newTask: TaskLog = {
      id: taskId,
      workerId: GENERAL_ASSISTANT_PROFILE.id,
      workerName: GENERAL_ASSISTANT_PROFILE.name,
      prompt: prompt,
      response: '',
      timestamp: Date.now(),
      status: 'pending'
    };

    addTask(newTask);
    setPrompt('');
    setIsProcessing(true);

    const relevantDocs = documents.filter(d => selectedDocIds.has(d.id));

    try {
      const response = await executeWorkerTask(GENERAL_ASSISTANT_PROFILE, newTask.prompt, relevantDocs);
      updateTaskStatus(taskId, 'completed', response);
    } catch (error) {
      updateTaskStatus(taskId, 'failed', "Core System Error.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full ${GENERAL_ASSISTANT_PROFILE.avatarColor} flex items-center justify-center text-white shadow-lg shadow-purple-500/20 border border-white/10`}>
                <Sparkles className="w-5 h-5" />
             </div>
             <div>
                 <h2 className="font-bold text-white text-lg">General Assistant</h2>
                 <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Vairon Core Intelligence</p>
             </div>
        </div>
        
        {/* Quick Doc Toggle Info */}
        <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <FileText className="w-3 h-3 text-indigo-400" />
            <span className="font-bold text-slate-300">{selectedDocIds.size}</span> / {documents.length} Dokumente aktiv
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar bg-slate-950/20" ref={scrollRef}>
        {assistantTasks.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                    <Bot className="w-12 h-12 text-indigo-400" />
                </div>
                <p className="text-xl font-bold text-slate-400">Wie kann Vairon Core helfen?</p>
                <p className="text-sm text-slate-600 mt-2 max-w-sm text-center">Ich greife auf alle Datenbanken zu, erstelle Strategien und automatisiere Workflows.</p>
            </div>
        )}

        {assistantTasks.map((task) => (
            <div key={task.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* User Bubble */}
                <div className="flex justify-end">
                    <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 px-5 py-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-md">
                        {task.prompt}
                    </div>
                </div>

                {/* AI Bubble */}
                <div className="flex justify-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${GENERAL_ASSISTANT_PROFILE.avatarColor} flex-shrink-0 flex items-center justify-center border border-white/10 shadow-lg`}>
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 px-6 py-5 rounded-2xl rounded-tl-none max-w-[90%] text-sm text-slate-300 leading-relaxed shadow-xl">
                        {task.status === 'pending' ? (
                            <div className="flex items-center gap-3 text-indigo-400 font-bold">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span className="animate-pulse">Analysiere Kontext & Formuliere Antwort...</span>
                            </div>
                        ) : task.status === 'failed' ? (
                            <div className="text-red-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Systemfehler bei der Verarbeitung.
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-slate max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {task.response}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-5 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
         {/* Context Selector (Horizontal Scroll) */}
         {documents.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-3">Core Wissens-Anker</span>
                {documents.map(doc => (
                    <button
                        key={doc.id}
                        onClick={() => toggleDoc(doc.id)}
                        className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-2 font-bold ${
                            selectedDocIds.has(doc.id) 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-sm' 
                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                        }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedDocIds.has(doc.id) ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
                        {doc.name}
                    </button>
                ))}
            </div>
         )}

         <div className="relative group">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Strategische Anfrage an Vairon Core richten..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl pl-5 pr-14 py-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none h-[65px] custom-scrollbar shadow-inner"
            />
            <button
                onClick={handleSend}
                disabled={!prompt.trim() || isProcessing}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
                {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
         </div>
         <div className="text-center mt-3">
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em]">Vairon Operating System • Full Intelligence Batch v2.5</span>
         </div>
      </div>
    </div>
  );
};
