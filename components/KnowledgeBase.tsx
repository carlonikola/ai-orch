import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Trash2, CheckCircle, FileCode, Layers, FileDown } from 'lucide-react';
import { KnowledgeDocument } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

interface KnowledgeBaseProps {
  documents: KnowledgeDocument[];
  addDocument: (doc: KnowledgeDocument) => void;
  removeDocument: (id: string) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ documents, addDocument, removeDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Ingestion Pipeline ---

  const chunkContent = (text: string, chunkSize: number = 1000, overlap: number = 100): string[] => {
    const chunks: string[] = [];
    if (!text || text.length <= chunkSize) return [text || ""];
    
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }
    return chunks;
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }
      return fullText;
    } catch (error) {
      console.error("PDF text extraction failed", error);
      return "Fehler bei der PDF-Text-Extraktion.";
    }
  };

  const processFile = async (file: File): Promise<KnowledgeDocument | null> => {
    return new Promise(async (resolve) => {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const reader = new FileReader();

      if (isPDF) {
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const text = await extractTextFromPDF(arrayBuffer);
          
          const metadata = {
              uploadTimestamp: Date.now(),
              fileSize: file.size,
              extension: 'pdf',
              tokenCountEstimate: Math.ceil(text.length / 4)
          };

          const chunks = chunkContent(text);

          resolve({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            content: text,
            chunks: chunks,
            metadata: metadata,
            isImage: false
          });
        };
        reader.readAsArrayBuffer(file);
      } else if (isImage) {
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            content: content,
            chunks: [],
            metadata: {
                uploadTimestamp: Date.now(),
                fileSize: file.size,
                extension: file.name.split('.').pop() || 'unknown',
                tokenCountEstimate: 258
            },
            isImage: true
          });
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const chunks = chunkContent(content);
          resolve({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            content: content,
            chunks: chunks,
            metadata: {
                uploadTimestamp: Date.now(),
                fileSize: file.size,
                extension: file.name.split('.').pop() || 'unknown',
                tokenCountEstimate: Math.ceil(content.length / 4)
            },
            isImage: false
          });
        };
        reader.readAsText(file);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
        const processingPromises = Array.from(files).map(processFile);
        const results = await Promise.all(processingPromises);

        results.forEach(doc => {
            if (doc) addDocument(doc);
        });
    } catch (error) {
        console.error("Ingestion failed", error);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Wissensdatenbank</h2>
          <p className="text-slate-400 mt-1">Pipeline für Unternehmenswissen (PDF, Dokumente & Bilder).</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-1 border border-slate-700 flex items-center gap-2 px-3 py-1">
          <span className="text-sm text-slate-400">Indexierte Assets:</span>
          <span className="text-sm font-bold text-white">{documents.length}</span>
        </div>
      </header>

      {/* Upload Zone */}
      <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-800/80 hover:border-indigo-500/50 transition-all">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
          <Upload className={`w-8 h-8 text-indigo-400 ${isUploading ? 'animate-bounce' : ''}`} />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Dokumente hochladen</h3>
        <p className="text-slate-400 mb-6 max-w-md">
          Automatische Textextraktion, PDF-Parsing und semantisches Chunking für:
          <br/>
          <span className="text-indigo-400 font-mono text-xs">.PDF, .TXT, .MD, .JSON, .CSV, .JS, .PY, .PNG, .JPG</span>
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          multiple
          accept=".pdf,.txt,.md,.json,.csv,.js,.py,.png,.jpg,.jpeg,.webp"
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isUploading ? 'Verarbeite Pipeline...' : 'Dateien auswählen'}
        </button>
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-indigo-500/50 transition-colors group relative">
             <button 
              onClick={() => removeDocument(doc.id)}
              className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-lg ${doc.isImage ? 'bg-purple-900/30 text-purple-400' : doc.metadata?.extension === 'pdf' ? 'bg-rose-900/30 text-rose-400' : 'bg-blue-900/30 text-blue-400'}`}>
                {doc.isImage ? <ImageIcon className="w-6 h-6" /> : doc.metadata?.extension === 'pdf' ? <FileDown className="w-6 h-6" /> : <FileCode className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-200 truncate pr-6">{doc.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded uppercase">{doc.metadata?.extension || 'FILE'}</span>
                  <span className="text-xs text-slate-500">{formatSize(doc.metadata?.fileSize || 0)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-indigo-400" />
                        <span>Chunks: {doc.chunks?.length || 0}</span>
                    </div>
                    <span>{doc.metadata?.tokenCountEstimate} tokens</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700/50 pt-2">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Pipeline Status: Aktiv</span>
                </div>
            </div>
          </div>
        ))}
        
        {documents.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Pipeline ist leer. Laden Sie PDF- oder Textdateien hoch, um die Belegschaft zu trainieren.
          </div>
        )}
      </div>
    </div>
  );
};