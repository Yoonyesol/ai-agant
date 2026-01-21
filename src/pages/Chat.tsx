import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, AlertTriangle, X, List, FileText, MessageSquare, GripHorizontal, ZoomIn, ZoomOut, Search, ChevronRight } from 'lucide-react';
import VoiceVisualizer from '../components/VoiceVisualizer';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { useSpeech } from '../hooks/useSpeech';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';

// Ensure worker is set
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MOCK_CONTRACT_TEXT = [
  "제 1조 (목적) 본 계약은...",
  "제 2조 (영업지역) 가맹본부는 가맹점사업자의 영업지역을 설정하지 않는다.", // Risk
  "제 3조 (계약기간) 계약기간은 1년으로 한다.",
  "제 4조 (위약금) 중도 해지 시 잔여 기간 로열티의 300%를 지급해야 한다.", // Risk
  "제 5조 (물품구매) 모든 물품은 본사가 지정한 곳에서만 구매해야 한다.", // Risk
];

const Chat = () => {
  const { chatMessages, addChatMessage, isAnalyzing, setIsAnalyzing, file } = useStore();
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Layout State
  const [topHeight, setTopHeight] = useState(40); // Percentage 0-100
  const [activeTab, setActiveTab] = useState<'chat' | 'pdf'>('chat');
  
  // PDF State
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfContainerWidth, setPdfContainerWidth] = useState<number>(0);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [highlight, setHighlight] = useState<{ page: number; yPercent: number; heightPercent: number } | null>(null);

  const { isListening, transcript, setTranscript, startListening, stopListening, speak, isSpeaking } = useSpeech();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = (id: string) => {
    setActiveTab('chat');
    setTimeout(() => {
        const element = document.getElementById(`msg-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
            setTimeout(() => element.classList.remove("ring-2", "ring-blue-400", "ring-offset-2"), 2000);
        }
    }, 100);
  };
  
  const handleRiskClick = (clauseId: number) => {
      setActiveTab('pdf');
      
      // Mock Highlight Logic
      // Clause 1 (Index 1) -> Top of Page 1
      // Clause 3 (Index 3) -> Middle of Page 1
      // Generic -> Top
      let highlightData = { page: 1, yPercent: 10, heightPercent: 10 };
      
      if (clauseId === 1) { // Article 2
          highlightData = { page: 1, yPercent: 25, heightPercent: 15 };
      } else if (clauseId === 3) { // Article 4
          highlightData = { page: 1, yPercent: 55, heightPercent: 10 };
      }
      
      setHighlight(highlightData);
      setPdfScale(1.5); // Auto zoom
      
      // Reset highlight after 3 seconds? No, keep it.
  };

  useEffect(() => {
    // Scroll only if active tab is chat to avoid weird PDF jumps
    if (activeTab === 'chat') scrollToBottom();
  }, [chatMessages, activeTab]);

  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  useEffect(() => {
    if (isAnalyzing && chatMessages.length === 0) {
      simulateAnalysis();
    }
  }, [isAnalyzing]);

  // -- Streaming & Simulation Logic (Preserved) --
  const streamResponse = async (fullText: string, clauseId?: number) => {
    const messageId = Date.now().toString();
    addChatMessage({
      id: messageId,
      role: 'assistant',
      content: '', 
      clauseId: clauseId, 
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
    await streamResponse("안녕하세요, 사용자님. 업로드해주신 계약서를 분석하고 있어요. 잠시만 기다려주세요...");

    await delay(1000);
    await streamResponse("잠시만요, 중요한 부분을 발견했어요. 제 2조를 보시면 영업지역에 대한 보호 범위가 설정되어 있지 않아요. 이건 나중에 인근에 같은 브랜드 매장이 생겨도 막을 수 없다는 뜻이에요.", 1);
    
    await delay(2000); 
    await streamResponse("그리고 제 4조 위약금 항목도 주의하셔야 해요. 중도 해지 시 위약금이 표준 계약서보다 과도하게 설정되어 있습니다.", 3);
    
    await delay(1000);
    setIsAnalyzing(false);
    await streamResponse("전반적으로 몇 가지 수정이 필요한 조항들이 보입니다. 상세한 리포트를 보시겠어요?, 아니면 더 궁금한 점이 있으신가요?");
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

  const detectedRisks = chatMessages.filter(m => m.clauseId !== undefined);


  // -- Resizing Logic --
  const handleDrag = (clientY: number) => {
      if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const offsetY = clientY - rect.top;
          let newHeight = (offsetY / rect.height) * 100;
          
          // Constraints (15% min, 85% max)
          if (newHeight < 15) newHeight = 15;
          if (newHeight > 85) newHeight = 85;
          setTopHeight(newHeight);
      }
  };

  return (
    <div className="flex flex-col h-full relative" ref={containerRef}>
      
      {/* 1. TOP PANEL: Avatar / Visualizer */}
      <div 
        className="w-full bg-slate-100 relative overflow-hidden flex items-end justify-center transition-all duration-75 ease-linear"
        style={{ height: `${topHeight}%` }}
      >
         {/* Background Decoration */}
         <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-slate-100 opacity-50 z-0"></div>
         
         {/* Avatar Layer */}
         <div className="relative z-10 w-full h-full flex items-end justify-center">
            {topHeight > 25 ? (
                 <motion.img 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src="/avatar_full.png" 
                    alt="AI Avatar" 
                    className="max-h-[95%] object-contain drop-shadow-xl"
                 />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <VoiceVisualizer isActive={isSpeaking || isListening} />
                </div>
            )}
            
            {/* Overlay Visualizer when Avatar is large */}
            {topHeight > 25 && (isSpeaking || isListening) && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                   <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <VoiceVisualizer isActive={true} />
                   </div>
                </div>
            )}
         </div>

         {/* Report Button (Left) */}
        <div className="absolute top-4 left-4 z-30">
            <button 
            onClick={() => navigate('/result')}
            className="bg-white/80 backdrop-blur p-2 px-3 rounded-full shadow-sm text-slate-700 hover:bg-white transition-colors flex items-center space-x-1"
            >
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold">리포트</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
        </div>
      </div>

      {/* 2. DRAG HANDLE */}
      <div 
        className="h-6 bg-white border-y border-slate-200 flex items-center justify-center cursor-row-resize z-20 hover:bg-slate-50 active:bg-blue-50 transition-colors touch-none"
        onMouseDown={(e) => {
            e.preventDefault();
            const move = (ev: MouseEvent) => handleDrag(ev.clientY);
            const up = () => {
                window.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        }}
        onTouchMove={(e) => {
            handleDrag(e.touches[0].clientY);
        }}
      >
          <GripHorizontal className="w-8 h-8 text-slate-300" />
      </div>

      {/* 3. BOTTOM PANEL: Chat & PDF */}
      <div 
        className="flex-1 bg-white flex flex-col min-h-0 relative"
      >
          {/* Tabs */}
          <div className="flex border-b border-slate-100 flex-none">
              <button 
                onClick={() => setActiveTab('chat')}
                className={cn(
                    "flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 transition-colors",
                    activeTab === 'chat' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                  <MessageSquare className="w-4 h-4" />
                  <span>AI 분석 채팅</span>
              </button>
              <button 
                onClick={() => setActiveTab('pdf')}
                className={cn(
                    "flex-1 py-3 text-sm font-bold flex items-center justify-center space-x-2 transition-colors",
                    activeTab === 'pdf' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                  <FileText className="w-4 h-4" />
                  <span>계약서 원본</span>
              </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto relative bg-slate-50/50">
             
             {/* CHAT TAB */}
             <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", activeTab === 'chat' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                 {/* Chat List */}
                 <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {chatMessages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                        "flex flex-col max-w-[90%] space-y-1 transition-all duration-300 rounded-2xl",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}
                    >
                        <div className={cn(
                        "p-3 px-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                        msg.role === 'user' 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        )}>
                        {msg.content}
                        
                        {/* Embedded Clause Card */}
                        {msg.clauseId !== undefined && (
                            <div className="mt-3 pt-3 border-t border-slate-100/20">
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-slate-800 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => handleRiskClick(msg.clauseId!)}>
                                    <div className="flex items-center space-x-2 text-amber-700 font-bold mb-2 text-xs">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>관련 위협 조항</span>
                                        <span className="text-amber-400 text-[10px] ml-auto">탭하여 원본보기 &gt;</span>
                                    </div>
                                    <div className="text-xs font-medium bg-white/50 p-2 rounded-lg line-clamp-3">
                                        {MOCK_CONTRACT_TEXT[msg.clauseId]}
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                        <span className="text-[11px] text-slate-400 px-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                 </div>

                 {/* Input Area */}
                 <div className="flex-none p-3 bg-white border-t border-slate-100">
                    <div className={cn(
                        "flex items-center space-x-2 bg-slate-100 border rounded-3xl p-1 pl-4 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all",
                        isListening ? "border-blue-500 ring-2 ring-blue-200 bg-white" : "border-transparent"
                    )}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={isListening ? "듣고 있어요..." : "궁금한 내용을 입력하세요..."}
                        className="flex-1 bg-transparent outline-none text-slate-800 py-2.5 text-sm"
                    />
                    <button 
                        onClick={inputText ? handleSendMessage : toggleVoice}
                        className={cn(
                        "p-2.5 rounded-full transition-colors font-bold text-white relative shadow-sm",
                        inputText ? "bg-blue-600 hover:bg-blue-700" : (isListening ? "bg-red-500 hover:bg-red-600" : "bg-slate-400 hover:bg-slate-500")
                        )}
                    >
                        {inputText ? <Send className="w-4 h-4" /> : <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />}
                    </button>
                    </div>
                </div>
             </div>

             {/* PDF TAB */}
             <div className={cn("absolute inset-0 overflow-y-auto bg-slate-200 flex justify-center pt-4 pb-20 transition-opacity duration-300", activeTab === 'pdf' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                {file ? (
                    <div className="w-full relative px-4" ref={(el) => { if (el) setPdfContainerWidth(el.clientWidth); }}>
                        <Document
                            file={file}
                            onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                            className="flex flex-col items-center space-y-4"
                        >
                            {Array.from(new Array(pdfNumPages), (el, index) => {
                                const pageNumber = index + 1;
                                const isHighlightedPage = highlight && highlight.page === pageNumber;
                                
                                return (
                                    <div key={`page_${pageNumber}`} className="relative shadow-md rounded-sm overflow-hidden transition-transform duration-300">
                                         <Page 
                                             pageNumber={pageNumber} 
                                             width={pdfContainerWidth ? (pdfContainerWidth - 32) : 300}
                                             scale={pdfScale}
                                             renderTextLayer={false}
                                             renderAnnotationLayer={false}
                                         />
                                         
                                         {/* Mock Highlight Overlay */}
                                         {isHighlightedPage && (
                                             <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute inset-x-0 bg-red-500/20 border-y-4 border-red-500/50 z-10 mix-blend-multiply pointer-events-none"
                                                style={{ 
                                                    top: `${highlight.yPercent}%`, 
                                                    height: `${highlight.heightPercent}%`
                                                }}
                                             >
                                                 <div className="absolute -right-2 top-0 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-l shadow-sm font-bold">
                                                     위험 감지
                                                 </div>
                                             </motion.div>
                                         )}
                                    </div>
                                );
                            })}
                        </Document>
                        
                        {/* Zoom Controls */}
                        <div className="fixed bottom-24 right-6 flex flex-col space-y-2 z-50">
                             <button onClick={() => setPdfScale(p => Math.min(p + 0.25, 3))} className="bg-white text-slate-700 p-2 rounded-full shadow-lg border hover:bg-slate-50">
                                 <ZoomIn className="w-5 h-5" />
                             </button>
                             <button onClick={() => setPdfScale(p => Math.max(p - 0.25, 0.5))} className="bg-white text-slate-700 p-2 rounded-full shadow-lg border hover:bg-slate-50">
                                 <ZoomOut className="w-5 h-5" />
                             </button>
                             <button onClick={() => { setPdfScale(1.0); setHighlight(null); }} className="bg-white text-slate-700 p-2 rounded-full shadow-lg border hover:bg-slate-50">
                                 <Search className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <FileText className="w-12 h-12 mb-2 opacity-30" />
                        <p>파일이 없습니다.</p>
                    </div>
                )}
             </div>
             
          </div>
      </div>
      
      {/* Sidebar Overlay (Preserved) */}
      <div className="absolute top-4 right-4 z-30">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="bg-white/80 backdrop-blur p-2 rounded-full shadow-sm text-slate-600 hover:bg-white transition-colors"
        >
            <List className="w-6 h-6" />
        </button>
      </div>

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
                        <h2 className="text-xl font-bold text-slate-800">위험 조항 목록</h2>
                        <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
                    </div>
                    {detectedRisks.length > 0 ? (
                        <div className="space-y-3">
                        {detectedRisks.map((msg, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    setIsSidebarOpen(false);
                                    scrollToMessage(msg.id);
                                }}
                                className="bg-amber-50 border border-amber-200 p-4 rounded-xl active:bg-amber-100 cursor-pointer"
                            >
                                <div className="flex items-center space-x-2 text-amber-700 font-bold mb-1 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>위험 조항 #{idx + 1}</span>
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-2">{MOCK_CONTRACT_TEXT[msg.clauseId!]}</p>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center mt-10">발견된 위험 조항이 없습니다.</p>
                    )}
                </motion.div>
            </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Chat;
