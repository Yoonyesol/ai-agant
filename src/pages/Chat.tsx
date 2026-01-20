import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Menu, ChevronRight, AlertTriangle, X, List } from 'lucide-react';
import VoiceVisualizer from '../components/VoiceVisualizer';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useSpeech } from '../hooks/useSpeech';

// Mock Contract Data for Simulation
const MOCK_CONTRACT_TEXT = [
  "제 1조 (목적) 본 계약은...",
  "제 2조 (영업지역) 가맹본부는 가맹점사업자의 영업지역을 설정하지 않는다.", // Risk
  "제 3조 (계약기간) 계약기간은 1년으로 한다.",
  "제 4조 (위약금) 중도 해지 시 잔여 기간 로열티의 300%를 지급해야 한다.", // Risk
  "제 5조 (물품구매) 모든 물품은 본사가 지정한 곳에서만 구매해야 한다.", // Risk
];

const Chat = () => {
  const { chatMessages, addChatMessage, isAnalyzing, setIsAnalyzing } = useStore();
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Use Custom Speech Hook
  const { 
    isListening, 
    transcript, 
    setTranscript, 
    startListening, 
    stopListening, 
    speak, 
    isSpeaking 
  } = useSpeech();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = (id: string) => {
    const element = document.getElementById(`msg-${id}`);
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // enhance highlight effect
        element.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
        setTimeout(() => element.classList.remove("ring-2", "ring-blue-400", "ring-offset-2"), 2000);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (transcript) {
        setInputText(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (isAnalyzing && chatMessages.length === 0) {
      simulateAnalysis();
    }
  }, [isAnalyzing]);

  // Helper to simulate streaming text
  const streamResponse = async (fullText: string, clauseId?: number) => {
    const messageId = Date.now().toString();
    addChatMessage({
      id: messageId,
      role: 'assistant',
      content: '', // Start empty
      clauseId: clauseId, // Attach clause Info
      timestamp: new Date(),
    });

    speak(fullText);

    let currentText = "";
    
    for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];
        
        useStore.setState(state => {
            const lastMsg = state.chatMessages[state.chatMessages.length - 1];
            if (lastMsg && lastMsg.id === messageId) {
                 const newMessages = [...state.chatMessages];
                 newMessages[newMessages.length - 1] = { ...lastMsg, content: currentText };
                 return { chatMessages: newMessages };
            }
            return state;
        });
        
        await delay(30); 
    }
  };

  const simulateAnalysis = async () => {
    await delay(1000);
    const msg1 = "안녕하세요, 사용자님. 업로드해주신 계약서를 분석하고 있어요. 잠시만 기다려주세요...";
    await streamResponse(msg1);

    await delay(1000);
    const msg2 = "잠시만요, 중요한 부분을 발견했어요. 제 2조를 보시면 영업지역에 대한 보호 범위가 설정되어 있지 않아요. 이건 나중에 인근에 같은 브랜드 매장이 생겨도 막을 수 없다는 뜻이에요.";
    await streamResponse(msg2, 1); // Article 2
    
    await delay(2000); 
    const msg3 = "그리고 제 4조 위약금 항목도 주의하셔야 해요. 중도 해지 시 위약금이 표준 계약서보다 과도하게 설정되어 있습니다.";
    await streamResponse(msg3, 3); // Article 4
    
    await delay(1000);
    setIsAnalyzing(false);
    const msg4 = "전반적으로 몇 가지 수정이 필요한 조항들이 보입니다. 상세한 리포트를 보시겠어요?, 아니면 더 궁금한 점이 있으신가요?";
    await streamResponse(msg4);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    if (isListening) stopListening();

    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    });
    
    const userQuestion = inputText;
    setInputText('');
    setTranscript('');
    
    setTimeout(async () => {
        let response = `네, "${userQuestion}"에 대해 말씀이시군요. 해당 내용은...`;
        let clauseId: number | undefined;

        if (userQuestion.includes("위약금")) {
            response = "위약금은 계약을 중도에 해지할 때 내야 하는 돈입니다. 현재 계약서에는 남은 기간 로열티의 300%로 되어있는데, 공정위 권장은 보통 10% 내외입니다. 너무 과도하네요.";
            clauseId = 3;
        } else if (userQuestion.includes("영업지역")) {
            response = "영업지역은 내 가게 주변에 또 다른 프랜차이즈가 못 들어오게 막는 구역입니다. 이 계약서에는 그 내용이 빠져있어서 위험합니다.";
            clauseId = 1;
        }

        await streamResponse(response, clauseId);
    }, 1000);
  };

  const toggleVoice = () => {
    isListening ? stopListening() : startListening();
  };

  // Filter detected risks for sidebar
  const detectedRisks = chatMessages.filter(m => m.clauseId !== undefined);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] relative">
      {/* Header/Sidebar Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="bg-white p-2 rounded-full shadow-md text-slate-600 hover:bg-slate-50 transition-colors"
        >
            <List className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute inset-0 bg-black z-40"
                />
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-white z-50 shadow-2xl p-6 overflow-y-auto"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">발견된 위험 조항</h2>
                        <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
                    </div>
                    
                    <div className="space-y-4">
                        {detectedRisks.length > 0 ? (
                            detectedRisks.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => {
                                        setIsSidebarOpen(false);
                                        scrollToMessage(msg.id);
                                    }}
                                    className="bg-amber-50 border border-amber-200 p-4 rounded-xl active:bg-amber-100 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center space-x-2 text-amber-700 font-bold mb-1 text-sm">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>위험 조항 #{idx + 1}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium line-clamp-2">
                                        {MOCK_CONTRACT_TEXT[msg.clauseId!]}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2 text-right">
                                        대화 보러가기 →
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center py-10">아직 발견된 위험 조항이 없습니다.</p>
                        )}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* 1. Voice Agent Visualizer */}
      <div className="flex-none bg-white header-bg">
        <VoiceVisualizer isActive={isSpeaking || isListening} />
        {isListening && <p className="text-center text-blue-500 text-sm animate-pulse font-medium">듣고 있어요...</p>}
      </div>

      {/* 2. Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {chatMessages.map((msg) => (
          <motion.div
            key={msg.id}
            id={`msg-${msg.id}`} // ID for scrolling
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col max-w-[90%] space-y-1 transition-all duration-300 rounded-2xl",
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div className={cn(
              "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
            )}>
              {msg.content}
              
              {/* Embedded Clause Card */}
              {msg.clauseId !== undefined && (
                <div className="mt-4 pt-3 border-t border-slate-100/20">
                     <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-slate-800">
                        <div className="flex items-center space-x-2 text-amber-700 font-bold mb-2 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>관련 조항</span>
                        </div>
                        <div className="text-xs font-medium bg-white/50 p-2 rounded-lg">
                             {MOCK_CONTRACT_TEXT[msg.clauseId]}
                        </div>
                     </div>
                </div>
              )}
            </div>
            
            <span className="text-xs text-slate-400 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
     
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Area */}
      <div className="flex-none p-4 bg-white/50 backdrop-blur-sm">
        <div className={cn(
            "flex items-center space-x-2 bg-white border rounded-full p-1 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all",
            isListening ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"
        )}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? "말씀하세요..." : "궁금한 내용을 물어보세요..."}
            className="flex-1 bg-transparent outline-none text-slate-800 py-3"
          />
          <button 
            onClick={inputText ? handleSendMessage : toggleVoice}
            className={cn(
              "p-3 rounded-full transition-colors font-bold text-white relative",
              inputText ? "bg-blue-600 hover:bg-blue-700" : (isListening ? "bg-red-500 hover:bg-red-600" : "bg-slate-800 hover:bg-slate-700")
            )}
          >
             {inputText ? <Send className="w-5 h-5" /> : <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
