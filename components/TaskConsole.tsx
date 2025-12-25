import React, { useState, useEffect } from 'react';
// Added RefreshCw to imports to fix "Cannot find name 'RefreshCw'" error
import { Play, FileText, Bot, Clock, AlertCircle, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { WorkerProfile, KnowledgeDocument, TaskLog } from '../types';
import { executeWorkerTask } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskConsoleProps {
  workers: WorkerProfile[];
  documents: KnowledgeDocument[];
  tasks: TaskLog[];
  addTask: (task: TaskLog) => void;
  updateTaskStatus: (id: string, status: TaskLog['status'], response: string) => void;
}

export const TaskConsole: React.FC<TaskConsoleProps> = ({ workers, documents, tasks, addTask, updateTaskStatus }) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-select first worker if available
  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers]);

  const toggleDoc = (id: string) => {
    const newSet = new Set(selectedDocIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDocIds(newSet);
  };

  const toggleAllDocs = () => {
    if (selectedDocIds.size === documents.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documents.map(d => d.id)));
    }
  };

  const handleRunTask = async () => {
    const worker = workers.find(w => w.id === selectedWorkerId);
    if (!worker || !prompt) return;

    const taskId = crypto.randomUUID();
    const newTask: TaskLog = {
      id: taskId,
      workerId: worker.id,
      workerName: worker.name,
      prompt: prompt,
      response: '',
      timestamp: Date.now(),
      status: 'pending'
    };

    addTask(newTask);
    setIsProcessing(true);
    setPrompt(''); // clear input immediately

    // Gather selected documents
    const relevantDocs = documents.filter(d => selectedDocIds.has(d.id));

    try {
      const response = await executeWorkerTask(worker, newTask.prompt, relevantDocs);
      updateTaskStatus(taskId, 'completed', response);
    } catch (error) {
      updateTaskStatus(taskId, 'failed', "Aufgabe fehlgeschlagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-6rem)]">
      {/* Input / Config Area */}
      <div className="xl:col-span-1 flex flex-col gap-6 overflow-hidden">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Task Konsole</h2>
          <p className="text-slate-400 mt-1">Orchestrieren Sie Ihre Belegschaft für komplexe Aufgaben.</p>
        </div>

        {/* Worker Selector */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-xl">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" /> Ausführender Agent
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {workers.map(worker => (
              <button
                key={worker.id}
                onClick={() => setSelectedWorkerId(worker.id)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${
                  selectedWorkerId === worker.id 
                  ? 'bg-indigo-600/20 border-indigo-500 shadow-md' 
                  : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl ${worker.avatarColor} flex items-center justify-center text-xs text-white font-black shadow-lg`}>
                  {worker.name.charAt(0)}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-sm font-bold text-white truncate">{worker.name}</div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest truncate">{worker.role}</div>
                </div>
                {selectedWorkerId === worker.id && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
              </button>
            ))}
            {workers.length === 0 && (
                <div className="text-center p-4 text-slate-500 text-xs italic bg-slate-900 rounded-xl">Keine Agenten verfügbar.</div>
            )}
          </div>
        </div>

        {/* Document Context Selector */}
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 flex-1 flex flex-col min-h-0 shadow-xl">
          <div className="flex justify-between items-center mb-4">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> 
                Kontext Assets ({selectedDocIds.size})
             </label>
             <button onClick={toggleAllDocs} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 tracking-widest">
                {selectedDocIds.size === documents.length ? 'Alle abwählen' : 'Alle auswählen'}
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-32 custom-scrollbar">
            {documents.map(doc => (
                <label key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800 cursor-pointer group transition-all">
                    <input 
                        type="checkbox" 
                        checked={selectedDocIds.has(doc.id)}
                        onChange={() => toggleDoc(doc.id)}
                        className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-950" 
                    />
                    <span className="text-xs font-bold text-slate-300 truncate group-hover:text-white transition-colors">{doc.name}</span>
                </label>
            ))}
             {documents.length === 0 && (
                <div className="text-center p-6 text-slate-600 text-xs italic">Wissensdatenbank leer.</div>
            )}
          </div>
        </div>
      </div>

      {/* Execution Area */}
      <div className="xl:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
         <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-1/3 min-h-[220px] shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Definieren Sie hier das operative Ziel für den Agenten..."
                className="w-full h-full bg-transparent p-6 text-slate-200 resize-none focus:outline-none text-sm leading-relaxed"
            />
            <div className="p-4 border-t border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    RAG-Pipeline Aktiv
                </div>
                <button
                    onClick={handleRunTask}
                    disabled={!selectedWorkerId || !prompt || isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20"
                >
                    {isProcessing ? (
                        <><RefreshCw className="w-4 h-4 animate-spin"/> Verarbeite...</>
                    ) : (
                        <>
                            Task ausführen <Play className="w-4 h-4 fill-current" />
                        </>
                    )}
                </button>
            </div>
         </div>

         {/* Output Stream / Log */}
         <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 font-black text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" /> Operativer Log-Stream
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {tasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800">
                        <Play className="w-20 h-20 mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-widest text-[10px]">Warte auf Trigger-Signal</p>
                    </div>
                )}
                
                {[...tasks].reverse().map(task => (
                    <div key={task.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-l-2 border-slate-800 pl-6 relative">
                        <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-950"></div>
                        <div className="flex items-center gap-3 mb-3">
                             <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20`}>
                                {task.workerName}
                             </div>
                             <span className="text-[10px] font-bold text-slate-600 uppercase">{new Date(task.timestamp).toLocaleTimeString()}</span>
                             <div className={`ml-auto text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                task.status === 'completed' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20' : 
                                task.status === 'failed' ? 'bg-rose-900/20 text-rose-400 border border-rose-500/20' : 'bg-amber-900/20 text-amber-400 border border-amber-500/20'
                             }`}>
                                {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                {task.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                                {task.status}
                             </div>
                        </div>
                        
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-xl">
                            <div className="text-xs text-slate-500 mb-6 font-mono border-b border-slate-800 pb-4 flex gap-2">
                                <span className="text-indigo-500 font-bold">$ prompt:</span> 
                                <span className="italic">"{task.prompt}"</span>
                            </div>
                            <div className="prose prose-invert prose-slate max-w-none">
                                {task.status === 'pending' ? (
                                    <div className="flex items-center gap-3 text-slate-600 font-bold text-sm animate-pulse">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Agent destilliert Antwort...</span>
                                    </div>
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {task.response}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};