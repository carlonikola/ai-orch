import React, { useState } from 'react';
import { UserPlus, Sparkles, Save, Trash2, RefreshCw, MessageSquare, Settings, Send, FileText, CheckCircle, AlertCircle, Play, Bot } from 'lucide-react';
import { WorkerProfile, KnowledgeDocument, TaskLog } from '../types';
import { generateSystemPrompt, executeWorkerTask } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WorkerFactoryProps {
  workers: WorkerProfile[];
  documents: KnowledgeDocument[];
  tasks: TaskLog[];
  addWorker: (worker: WorkerProfile) => void;
  removeWorker: (id: string) => void;
  addTask: (task: TaskLog) => void;
  updateTaskStatus: (id: string, status: TaskLog['status'], response: string) => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500'
];

export const WorkerFactory: React.FC<WorkerFactoryProps> = ({ 
    workers, documents, tasks, addWorker, removeWorker, addTask, updateTaskStatus 
}) => {
  // --- Creation State ---
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [context, setContext] = useState('');
  const [generatedInstructions, setGeneratedInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- View/Chat State ---
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'config'>('chat');
  
  // Chat specific state
  const [chatPrompt, setChatPrompt] = useState('');
  const [isProcessingTask, setIsProcessingTask] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // --- Handlers ---

  const handleGenerate = async () => {
    if (!role) return;
    setIsGenerating(true);
    const instructions = await generateSystemPrompt(role, context);
    setGeneratedInstructions(instructions);
    setIsGenerating(false);
  };

  const handleCreate = () => {
    if (!name || !role || !generatedInstructions) return;
    const newWorker: WorkerProfile = {
      id: crypto.randomUUID(),
      name,
      role,
      instructions: generatedInstructions,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      createdAt: Date.now()
    };
    addWorker(newWorker);
    setName('');
    setRole('');
    setContext('');
    setGeneratedInstructions('');
  };

  const handleSendMessage = async () => {
      if (!selectedWorker || !chatPrompt) return;

      const taskId = crypto.randomUUID();
      const newTask: TaskLog = {
          id: taskId,
          workerId: selectedWorker.id,
          workerName: selectedWorker.name,
          prompt: chatPrompt,
          response: '',
          timestamp: Date.now(),
          status: 'pending'
      };

      addTask(newTask);
      setIsProcessingTask(true);
      setChatPrompt('');

      const relevantDocs = documents.filter(d => selectedDocIds.has(d.id));

      try {
          const response = await executeWorkerTask(selectedWorker, newTask.prompt, relevantDocs);
          updateTaskStatus(taskId, 'completed', response);
      } catch (error) {
          updateTaskStatus(taskId, 'failed', "System Fehler.");
      } finally {
          setIsProcessingTask(false);
      }
  };

  const toggleDoc = (id: string) => {
    const newSet = new Set(selectedDocIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocIds(newSet);
  };

  const switchToCreateMode = () => {
    setSelectedWorker(null);
  };

  // Filter tasks for the selected worker
  const workerTasks = selectedWorker ? tasks.filter(t => t.workerId === selectedWorker.id).reverse() : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* LEFT PANEL: Creation OR Interaction */}
      <div className="lg:col-span-2 flex flex-col min-h-0 h-full">
        <header className="mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {selectedWorker ? selectedWorker.name : 'Agenten Fabrik'}
          </h2>
          <p className="text-slate-400 mt-1">
            {selectedWorker 
              ? selectedWorker.role
              : 'Erstellen und deployen Sie spezialisierte KI-Agenten.'}
          </p>
        </header>

        <div className="bg-slate-800 rounded-xl border border-slate-700 flex-1 flex flex-col min-h-0 overflow-hidden shadow-2xl">
          
          {selectedWorker ? (
            /* --- WORKER INTERACTION VIEW --- */
            <div className="flex flex-col h-full">
              {/* Tab Nav */}
              <div className="flex border-b border-slate-700 bg-slate-900/50">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                    <MessageSquare className="w-4 h-4" /> Live Interaktion
                  </button>
                  <button 
                    onClick={() => setActiveTab('config')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'config' ? 'border-indigo-500 text-white bg-slate-800' : 'border-transparent text-slate-400 hover:text-white'}`}
                  >
                    <Settings className="w-4 h-4" /> Konfiguration
                  </button>
              </div>

              {activeTab === 'chat' ? (
                  <div className="flex-1 flex flex-col min-h-0">
                      {/* Chat History */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-950/20">
                           {workerTasks.length === 0 && (
                               <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                   <div className={`w-16 h-16 rounded-full ${selectedWorker.avatarColor} opacity-20 flex items-center justify-center mb-4`}>
                                        <Bot className="w-8 h-8 text-white" />
                                   </div>
                                   <p>Bereit für Aufgaben. Starten Sie den Chat.</p>
                               </div>
                           )}
                           {[...workerTasks].reverse().map(task => ( // Reverse back for chronological order
                               <div key={task.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                   {/* User Prompt */}
                                   <div className="flex justify-end">
                                       <div className="bg-slate-700 text-slate-200 p-3 px-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm shadow-md">
                                           {task.prompt}
                                       </div>
                                   </div>
                                   {/* Agent Response */}
                                   <div className="flex justify-start gap-3">
                                       <div className={`w-8 h-8 rounded-full ${selectedWorker.avatarColor} flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-1 shadow-lg`}>
                                            {selectedWorker.name.charAt(0)}
                                       </div>
                                       <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl rounded-tl-none max-w-[90%] shadow-xl">
                                            {task.status === 'pending' ? (
                                                <div className="flex items-center gap-2 text-indigo-400 animate-pulse font-bold text-sm">
                                                    <Sparkles className="w-4 h-4" /> Agent verarbeitet Daten...
                                                </div>
                                            ) : task.status === 'failed' ? (
                                                <span className="text-red-400 flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4"/> Fehler bei der Generierung</span>
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
                      <div className="p-4 bg-slate-900 border-t border-slate-700">
                           {/* RAG Context Selector */}
                           {documents.length > 0 && (
                               <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Wissens-Quelle:</span>
                                   {documents.map(doc => (
                                       <button
                                            key={doc.id}
                                            onClick={() => toggleDoc(doc.id)}
                                            className={`text-[10px] px-3 py-1 rounded-lg border transition-all whitespace-nowrap flex items-center gap-2 font-bold ${
                                                selectedDocIds.has(doc.id) 
                                                ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300' 
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                                            }`}
                                       >
                                           <div className={`w-1.5 h-1.5 rounded-full ${selectedDocIds.has(doc.id) ? 'bg-indigo-400' : 'bg-slate-600'}`}></div>
                                           {doc.name}
                                       </button>
                                   ))}
                               </div>
                           )}
                           
                           <div className="flex gap-2">
                               <textarea 
                                    value={chatPrompt}
                                    onChange={(e) => setChatPrompt(e.target.value)}
                                    placeholder={`Auftrag an ${selectedWorker.name} senden...`}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none h-14 shadow-inner text-sm"
                               />
                               <button 
                                    onClick={handleSendMessage}
                                    disabled={!chatPrompt || isProcessingTask}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                               >
                                    {isProcessingTask ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                               </button>
                           </div>
                      </div>
                  </div>
              ) : (
                  /* --- CONFIG TAB --- */
                  <div className="p-6 space-y-6 animate-in fade-in h-full overflow-y-auto custom-scrollbar">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System Instruktion (Gehirn)</h4>
                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 text-slate-300 whitespace-pre-wrap font-mono text-sm shadow-inner">
                            {selectedWorker.instructions}
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-600">AGENT_ID: {selectedWorker.id}</span>
                          <button 
                            onClick={() => {
                                removeWorker(selectedWorker.id);
                                setSelectedWorker(null);
                            }}
                            className="flex items-center gap-2 text-rose-400 hover:text-white hover:bg-rose-500 px-4 py-2 rounded-lg transition-all text-xs font-bold border border-rose-500/20"
                        >
                            <Trash2 className="w-4 h-4" /> Agenten terminieren
                        </button>
                      </div>
                  </div>
              )}
            </div>
          ) : (
            /* --- CREATE MODE --- */
            <div className="p-8 space-y-6 animate-in fade-in h-full overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Alias / Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="z.B. Strategos-1"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner text-sm"
                    />
                    </div>
                    <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Funktion / Fachgebiet</label>
                    <div className="relative">
                        <input 
                        type="text" 
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="z.B. Enterprise Analyst"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner text-sm"
                        />
                        <div className="absolute right-3 top-3">
                            <UserPlus className="w-5 h-5 text-slate-600" />
                        </div>
                    </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Verhaltens-Kontext</label>
                    <textarea 
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Definieren Sie Tonalität, Ziele und Arbeitsweise..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all h-28 resize-none shadow-inner text-sm"
                    />
                </div>

                <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Generierte Core-Logik</label>
                    <button 
                        onClick={handleGenerate}
                        disabled={!role || isGenerating}
                        className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {isGenerating ? 'Architektur wird entworfen...' : 'System-Prompt generieren'}
                    </button>
                    </div>
                    <textarea 
                    value={generatedInstructions}
                    onChange={(e) => setGeneratedInstructions(e.target.value)}
                    placeholder="Die KI wird hier eine präzise System-Instruktion für den Agenten erstellen..."
                    className="w-full bg-slate-900/50 border border-slate-800 border-dashed rounded-xl px-5 py-4 text-slate-400 focus:outline-none focus:border-indigo-500 transition-all h-40 resize-none font-mono text-xs leading-relaxed"
                    />
                </div>

                <button 
                    onClick={handleCreate}
                    disabled={!name || !role || !generatedInstructions}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/30"
                >
                    <Save className="w-5 h-5" />
                    Agent deployen & Aktivieren
                </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Roster */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col h-full overflow-hidden shadow-xl">
        <div className="mb-6 flex flex-col gap-4">
             <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-indigo-400" />
                Vairon Belegschaft
            </h3>
            <button 
                onClick={switchToCreateMode}
                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                    !selectedWorker 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
            >
                <UserPlus className="w-4 h-4" /> Neuer Mitarbeiter
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {workers.map(worker => (
                <div 
                    key={worker.id} 
                    onClick={() => {
                        setSelectedWorker(worker);
                        setActiveTab('chat');
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                        selectedWorker?.id === worker.id 
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-md' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/40'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${worker.avatarColor} flex items-center justify-center text-white font-black text-lg shadow-lg border border-white/10`}>
                            {worker.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{worker.name}</h4>
                            <div className="flex items-center gap-2">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest truncate">{worker.role}</p>
                                 {tasks.filter(t => t.workerId === worker.id && t.status === 'pending').length > 0 && (
                                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                                 )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            
            {workers.length === 0 && (
                <div className="text-center py-12 text-slate-600 italic text-sm">
                    Belegschaft ist aktuell leer.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);