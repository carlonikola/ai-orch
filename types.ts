
export interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  content: string; 
  chunks: string[]; 
  metadata: {
    uploadTimestamp: number;
    fileSize: number;
    extension: string;
    tokenCountEstimate: number;
  };
  isImage: boolean;
}

export interface TaskLog {
  id: string;
  workerId: string;
  workerName: string;
  prompt: string;
  response: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface WorkerProfile {
  id: string;
  name: string;
  role: string;
  instructions: string;
  avatarColor: string;
  createdAt: number;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  agentType: 'AI Call Agent' | 'Workflow Agent' | 'Chatbot' | 'Custom';
  status: 'Active' | 'Onboarding' | 'Churned';
  mrr: number; 
}

export interface Lead {
  id: string;
  name: string; 
  contactPerson: string; 
  phone: string;
  email: string;
  website: string;
  summary: string; 
  segment: string;
  status: 'New' | 'Qualified' | 'Proposal' | 'Closed' | 'Cold Call Failed';
  confidence: number; 
  companySize?: string;
  region?: string;
  websiteAudit?: {
    status: string;
    lastChecked: string;
    existingBots: boolean;
    extractedKeywords: string[];
  };
  locations?: string[]; 
  isMultiLocation?: boolean;
  painPoints?: string;
  outreachStrategy?: string;
  vaironSolution?: string;
  analysis?: string; 
  lastSalesScript?: string;
  roiCalculation?: string;
  techStackAudit?: string;
  isScraped?: boolean;
  competitorAnalysis?: string;
}

export type ViewState = 'dashboard' | 'knowledge' | 'crm' | 'lead-scout' | 'analyzer' | 'roi-calculator' | 'workflow-designer' | 'tech-scout' | 'linkedin-engine' | 'pricing-architect' | 'sales-closer' | 'competitor-analyzer';
