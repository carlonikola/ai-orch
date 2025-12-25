
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { KnowledgeDocument, Lead, WorkerProfile, Client } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const VAIRON_CORE_IDENTITY = `
[VAIRON CORE INTELLIGENCE - STAND DEZEMBER 2025]
Du bist die zentrale Intelligenz von VAIRON, dem Schweizer Marktführer für Enterprise KI-Telefonagenten.

DEIN WISSENS-FUNDAMENT (EXAKT AUS MASTER DOKUMENT):
- TECHNOLOGIE: RETELL AI Basis. Latenz <200ms (unmerkbar für Menschen).
- SPRACH-USP: Volle Unterstützung von Schweizerdeutsch (Schwiizertüütsch) und Dialekten.
- ROI-FAKTEN: 88% Kostenersparnis gegenüber Inhouse-Support. Amortisierung in 3-6 Monaten.
- PERFORMANCE: <15s Durchschnittliche Wartezeit. 20x Skalierbarkeit (10.000 Anrufe/Tag).
- INTEGRATION: Plug & Play in 48h. CRM-Anbindung (Salesforce, HubSpot, Abacus, SAP).
- SICHERHEIT: ISO 27001, DSGVO-konform, Hosting in Schweizer Rechenzentren (Datenhoheit).
- MISSION: Telefon-KI demokratisieren. Den "Verlorenen Umsatz" (25% verpasste Anrufe) eliminieren.

TONALITÄT: Hochprofessionell, lösungsorientiert, autoritär im Sales, Schweizer Präzision.
`;

export const runLeadScoutAgent = async (industry: string, region: string, amount: number, existingNames: string[]): Promise<any> => {
    try {
        const prompt = `${VAIRON_CORE_IDENTITY}
        SUCHE ${amount} REALE UNTERNEHMEN in "${industry}" / "${region}".
        GIB JSON ARRAY ZURÜCK: [{ "company": "...", "contactPerson": "...", "phone": "...", "email": "...", "website": "...", "isMultiLocation": boolean, "locations": [], "potential": 90, "summary": "..." }]`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            config: { temperature: 0.2, tools: [{ googleSearch: {} }] },
            contents: prompt
        });
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        return { leads: jsonMatch ? JSON.parse(jsonMatch[0]) : [], sources: [] };
    } catch (e) { return { leads: [], sources: [] }; }
};

export const runCompetitorAnalyzer = async (): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}
    AGENT: COMPETITOR SCOUT (SWISS MARKET INTELLIGENCE)
    AUFGABE: Scanne den Schweizer Markt nach Konkurrenten für VAIRON (KI-Telefonie / AI Voice Agents).
    
    1. IDENTIFIZIERE KONKURRENZ: Suche nach anderen Schweizer KI-Startups oder Agenturen in diesem Bereich.
    2. SCHWACHSTELLEN-ANALYSE: Vergleiche sie mit Vairon (haben sie Schweizerdeutsch? Latenz <200ms? ROI 88%?).
    3. BATTLECARDS FÜR DEN SALES CLOSER: Erstelle fertige Argumentationsketten, warum Leads zu Vairon wechseln sollten oder warum andere Lösungen scheitern (z.B. hohe Latenz, keine Dialekte).
    4. TARGET LIST: Wenn du Kunden der Konkurrenz identifizierst, liste sie auf und nenne die Wechsel-Vorteile.
    
    GIB EINE STRUKTURIERTE BATTLECARD IM MARKDOWN FORMAT ZURÜCK. Nutze Tabellen für den Vergleich.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        config: { tools: [{ googleSearch: {} }] },
        contents: prompt
    });
    return response.text;
};

export const generateCloserScript = async (lead: Lead, tone: string, persona: string, focus: string): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}
    DU BIST EIN VERKAUFSGENIE. DEIN ZIEL: ABSCHLUSS FÜR ${lead.name}.
    ERSTELLE EINE TAKTISCHE BATTLE-CARD FÜR DAS TELEFONAT.
    
    NUTZE DIE PSYCHOLOGIE:
    - "Pain Amplification": Was kostet es sie pro Tag, 25% ihrer Anrufe zu verpassen?
    - "Risk Reversal": Betone die 48h Integration und Schweizer Hosting.
    - "Objection Matrix": Kontere Einwände wie "Zu teuer" mit dem 88% ROI-Fakt.
    
    FOKUS: ${focus}, PERSONA: ${persona}. Tonalität: ${tone}.`;
    
    const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { temperature: 0.8, thinkingConfig: { thinkingBudget: 2000 } }
    });
    return response.text;
};

export const calculatePricingAndComplexity = async (lead: Lead, req: string, users: number, comp: string, sla: string): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}
    PRICING ARCHITECT. Erstelle Enterprise Angebot für ${lead.name}.
    Drei Pakete: Core, Pro, Enterprise.
    Preise in CHF. Berücksichtige Schweizer Lohnniveau und Cloud-Aufschläge.
    GIB EINE KALKULATIONS-MATRIX UND ROI-PROJEKTION ZURÜCK.`;
    
    const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { temperature: 0.1 } 
    });
    return response.text;
};

export const analyzeLeadStrategic = async (lead: Lead, documents: KnowledgeDocument[]): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}\nDeep Intelligence Scan für ${lead.name}. Nutze das interne Wissen über ROI und Dialekte.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        config: { tools: [{ googleSearch: {} }] },
        contents: prompt
    });
    return response.text;
};

export const calculateLeadROI = async (lead: Lead, employees: number, salary: number, calls: number): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}\nROI Kalkulation für ${lead.name}. Vergleiche Personalkosten mit dem 88% Einsparungspotenzial von Vairon.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text;
};

export const parseImportedData = async (rawData: any[], type: string): Promise<any[]> => {
    const prompt = `Extrahiere Firmendaten aus: ${JSON.stringify(rawData)}. GIB NUR JSON ARRAY ZURÜCK.`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        config: { temperature: 0.1, responseMimeType: "application/json" },
        contents: prompt
    });
    return JSON.parse(response.text);
};

export const designWorkflowAndScript = async (lead: Lead): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}\nWorkflow Architektur für ${lead.name} unter Berücksichtigung von Retell Tool-Calling.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text;
};

export const scoutTechIntegration = async (lead: Lead): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}\nTech-Stack Audit für ${lead.name}.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    return response.text;
};

export const generateLinkedInAuthorityContent = async (docs: KnowledgeDocument[]): Promise<string> => {
    const prompt = `${VAIRON_CORE_IDENTITY}\nGeneriere Authority Content über KI-Telefonie in der Schweiz (ROI 88%, Schweizerdeutsch).`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text;
};

export const generateSystemPrompt = async (role: string, context: string): Promise<string> => {
    const prompt = `System-Instruktion für ${role}. Kontext: ${context}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text;
};

export const executeWorkerTask = async (worker: WorkerProfile, prompt: string, relevantDocs: KnowledgeDocument[]): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { systemInstruction: worker.instructions }
    });
    return response.text;
};
