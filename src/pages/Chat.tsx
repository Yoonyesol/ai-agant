import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
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
  const [currentClauseIndex, setCurrentClauseIndex] = useState<number | null>(null);
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

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Update input text when transcript changes
  useEffect(() => {
    if (transcript) {
        setInputText(transcript);
        // Optional: Auto-send if silence detected could be added here
    }
  }, [transcript]);

  useEffect(() => {
    // Simulate Analysis Flow on mount if analyzing
    if (isAnalyzing && chatMessages.length === 0) {
      simulateAnalysis();
    }
  }, [isAnalyzing]);

  const simulateAnalysis = async () => {
    await delay(1000);
    const msg1 = "안녕하세요, 사용자님. 업로드해주신 계약서를 분석하고 있어요. 잠시만 기다려주세요...";
    addBotMessage(msg1);
    speak(msg1);

    await delay(4000);
    const msg2 = "잠시만요, 중요한 부분을 발견했어요. 제 2조를 보시면 영업지역에 대한 보호 범위가 설정되어 있지 않아요. 이건 나중에 인근에 같은 브랜드 매장이 생겨도 막을 수 없다는 뜻이에요.";
    setCurrentClauseIndex(1); // "영업지역 미설정"
    addBotMessage(msg2);
    speak(msg2);
    
    await delay(12000); // Wait for speech roughly
    const msg3 = "그리고 제 4조 위약금 항목도 주의하셔야 해요. 중도 해지 시 위약금이 표준 계약서보다 과도하게 설정되어 있습니다.";
    setCurrentClauseIndex(3); // "위약금"
    addBotMessage(msg3);
    speak(msg3);
    
    await delay(8000);
    setCurrentClauseIndex(null);
    setIsAnalyzing(false);
    const msg4 = "전반적으로 몇 가지 수정이 필요한 조항들이 보입니다. 상세한 리포트를 보시겠어요?, 아니면 더 궁금한 점이 있으신가요?";
    addBotMessage(msg4);
    speak(msg4);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const addBotMessage = (text: string) => {
    addChatMessage({
      id: Date.now().toString(),
      role: 'assistant',
      content: text,
      timestamp: new Date(),
    });
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Stop listening if sending
    if (isListening) stopListening();

    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    });
    
    const userQuestion = inputText;
    setInputText('');
    setTranscript(''); // Clear transcript
    
    // Mock Response Logic
    setTimeout(() => {
        let response = `네, "${userQuestion}"에 대해 말씀이시군요. 해당 내용은...`;
        
        // Simple keyword matching for demo
        if (userQuestion.includes("위약금")) {
            response = "위약금은 계약을 중도에 해지할 때 내야 하는 돈입니다. 현재 계약서에는 남은 기간 로열티의 300%로 되어있는데, 공정위 권장은 보통 10% 내외입니다. 너무 과도하네요.";
        } else if (userQuestion.includes("영업지역")) {
            response = "영업지역은 내 가게 주변에 또 다른 프랜차이즈가 못 들어오게 막는 구역입니다. 이 계약서에는 그 내용이 빠져있어서 위험합니다.";
        }

        addBotMessage(response);
        speak(response);
    }, 1000);
  };

  const toggleVoice = () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* 1. Voice Agent Visualizer */}
      <div className="flex-none bg-white">
        <VoiceVisualizer isActive={isSpeaking || isListening} />
        {isListening && <p className="text-center text-blue-500 text-sm animate-pulse font-medium">듣고 있어요...</p>}
      </div>

      {/* 2. Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {chatMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col max-w-[85%] space-y-1",
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
            </div>
            <span className="text-xs text-slate-400 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
        
        {/* Live Contract Context Card (Toast style) */}
        <AnimatePresence>
          {currentClauseIndex !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-lg mt-4 cursor-pointer"
              onClick={() => navigate('/result')}
            >
              <div className="flex items-center space-x-2 text-amber-700 font-bold mb-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>관련 조항 발견</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-100 text-slate-600 text-sm font-medium">
                {MOCK_CONTRACT_TEXT[currentClauseIndex]}
              </div>
              <div className="mt-2 flex items-center justify-end text-xs text-amber-600 font-bold">
                상세 보기 <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
