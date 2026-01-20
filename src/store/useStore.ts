import { create } from 'zustand';

interface AnalysisResult {
  riskScore: number;
  criticalIssues: string[];
  safeClauses: string[];
  summary: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

interface AppState {
  file: File | null;
  setFile: (file: File | null) => void;
  
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  
  currentView: 'home' | 'analyzing' | 'result' | 'chat';
  setCurrentView: (view: 'home' | 'analyzing' | 'result' | 'chat') => void;
}

export const useStore = create<AppState>((set) => ({
  file: null,
  setFile: (file) => set({ file }),
  
  isAnalyzing: false,
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  
  analysisResult: null,
  setAnalysisResult: (result) => set({ analysisResult: result }),
  
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),
}));
