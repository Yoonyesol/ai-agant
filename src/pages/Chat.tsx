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
  const streamResponse = async (fullText: string) => {
    // 1. Create an empty assistant message first
    const messageId = Date.now().toString();
    addChatMessage({
      id: messageId,
      role: 'assistant',
      content: '', // Start empty
      timestamp: new Date(),
    });

    // 2. Turn on TTS for the full text immediately
    speak(fullText);

    // 3. Stream characters to the existing message 
    // Note: Since we are using Zustand, we might need a way to update the *last* message.
    // However, for this prototype, let's just cheat a bit by updating local state or assume we can
    // just append to the store. 
    // Actually, properly updating the store item is better.
    // But since `addChatMessage` appends, we need an `updateLastMessage` action in the store ideally.
    // For now, let's just make it look like streaming by adding chunks if we can't update.
    // Wait, let's implement a local "streaming buffer" or just assume we can use a local state for the *current* 
    // message being typed, then commit it? 
    // Or easier: Just use a ref to the current message content and force update.
    
    let currentText = "";
    
    // We need a way to update the last message in the store for true "streaming" persistence.
    // Let's modify the store in a separate step? No, let's just do a hacky local update for now 
    // or better, let's add `updateLastMessage` to the store in the next step if needed.
    // For now, I'll simulate it by "typing effect" locally then saving? 
    // No, users expect to see it grow. 
    // Let's rely on a helper that we will add to the store, OR just re-add the message with more content?
    // Re-adding (replacing) the last message is a common pattern.
    
    for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];
        // In a real app, you'd have an updateMessage(id, content) action.
        // For this prototype, I will assume we can just replace the last message or 
        // I will implement a local 'streamingMessage' state that overlays.
        
        // Let's use a "local" streaming state effectively
        useStore.setState(state => {
            const lastMsg = state.chatMessages[state.chatMessages.length - 1];
            if (lastMsg && lastMsg.id === messageId) {
                 const newMessages = [...state.chatMessages];
                 newMessages[newMessages.length - 1] = { ...lastMsg, content: currentText };
                 return { chatMessages: newMessages };
            }
            return state;
        });
        
        await delay(30); // Typing speed
    }
  };

  const simulateAnalysis = async () => {
    await delay(1000);
    const msg1 = "안녕하세요, 사용자님. 업로드해주신 계약서를 분석하고 있어요. 잠시만 기다려주세요...";
    await streamResponse(msg1);

    await delay(1000);
    const msg2 = "잠시만요, 중요한 부분을 발견했어요. 제 2조를 보시면 영업지역에 대한 보호 범위가 설정되어 있지 않아요. 이건 나중에 인근에 같은 브랜드 매장이 생겨도 막을 수 없다는 뜻이에요.";
    setCurrentClauseIndex(1); 
    await streamResponse(msg2);
    
    await delay(2000); 
    const msg3 = "그리고 제 4조 위약금 항목도 주의하셔야 해요. 중도 해지 시 위약금이 표준 계약서보다 과도하게 설정되어 있습니다.";
    setCurrentClauseIndex(3); 
    await streamResponse(msg3);
    
    await delay(1000);
    setCurrentClauseIndex(null);
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
        
        if (userQuestion.includes("위약금")) {
            response = "위약금은 계약을 중도에 해지할 때 내야 하는 돈입니다. 현재 계약서에는 남은 기간 로열티의 300%로 되어있는데, 공정위 권장은 보통 10% 내외입니다. 너무 과도하네요.";
        } else if (userQuestion.includes("영업지역")) {
            response = "영업지역은 내 가게 주변에 또 다른 프랜차이즈가 못 들어오게 막는 구역입니다. 이 계약서에는 그 내용이 빠져있어서 위험합니다.";
        }

        await streamResponse(response);
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
