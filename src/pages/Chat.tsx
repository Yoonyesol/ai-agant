import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertTriangle, FileText, MessageSquare, ZoomIn, ZoomOut, ChevronRight, BarChart2, Plus, Headphones, FileOutput, ArrowRight, X, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { useSpeech } from '../hooks/useSpeech';
import { Document, Page, pdfjs } from 'react-pdf';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Layout State
    const [activeTab, setActiveTab] = useState<'chat' | 'pdf'>('chat');
    const [isRiskDrawerOpen, setIsRiskDrawerOpen] = useState(false);

    // Navigation

    // PDF State
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfNumPages, setPdfNumPages] = useState<number>(0);
    const [pdfContainerWidth, setPdfContainerWidth] = useState<number>(0);
    const [pdfScale, setPdfScale] = useState(1.0);
    const [highlight, setHighlight] = useState<{ page: number; yPercent: number; heightPercent: number } | null>(null);

    // Interactive Text Highlights State
    const [selectedLegalClause, setSelectedLegalClause] = useState<{ title: string; content: string; law: string } | null>(null);

    // Mock clickable text zones (yellow highlights)
    const CLICKABLE_HIGHLIGHTS = [
        { id: 1, page: 1, x: 10, y: 20, width: 80, height: 8, law: '가맹사업법 제12조', title: '영업지역 보호 의무', content: '가맹본부는 가맹점사업자의 영업에 지장을 주지 않도록 일정 거리 내 신규 가맹점 설립을 제한할 의무가 있습니다.' },
        { id: 2, page: 1, x: 10, y: 50, width: 85, height: 6, law: '상법 제398조', title: '계약기간 및 갱신', content: '계약 기간은 양 당사자의 합의에 따라 정하되, 일방적인 단축이나 연장은 불가능합니다.' },
        { id: 3, page: 1, x: 10, y: 65, width: 75, height: 10, law: '공정거래법 제23조', title: '과도한 위약금 금지', content: '가맹본부는 가맹점사업자에게 통상적인 범위를 초과하는 손해배상액을 예정하거나 위약금을 부과할 수 없습니다. 위반 시 3천만원 이하의 과태료가 부과됩니다.' },
    ];

    const { isListening, transcript, setTranscript, startListening, stopListening, speak } = useSpeech();

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };



    const handleRiskClick = (clauseId: number) => {
        setActiveTab('pdf');

        // Mock Highlight Logic
        let highlightData = { page: 1, yPercent: 10, heightPercent: 10 };
        if (clauseId === 1) { // Article 2
            highlightData = { page: 1, yPercent: 25, heightPercent: 15 };
        } else if (clauseId === 3) { // Article 4
            highlightData = { page: 1, yPercent: 55, heightPercent: 10 };
        }

        setHighlight(highlightData);
        setPdfScale(1.5); // Auto zoom
    };

    useEffect(() => {
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

    // -- Streaming Logic --
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
        await streamResponse("안녕하세요! 계약서 분석을 완료했습니다. 어떤 부분이 궁금하신가요?");

        await delay(1000);
        await streamResponse("중요한 위험 조항 2건이 발견되었습니다. '가맹점 영업지역 미설정'과 '과도한 위약금' 조항입니다. 1번 탭에서 확인해보세요.", 1);

        await delay(1000);
        setIsAnalyzing(false);
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
            let response = `네, "${userQuestion}" 관련 조항을 찾아보겠습니다.`;
            let clauseId: number | undefined;

            if (userQuestion.includes("위약금")) {
                response = "위약금 조항(제4조)이 표준보다 높게 설정되어 있어 수정이 필요합니다.";
                clauseId = 3;
            } else if (userQuestion.includes("영업지역")) {
                response = "영업지역 보호 조항(제2조)이 누락되어 있어 향후 불이익이 발생할 수 있습니다.";
                clauseId = 1;
            }

            await streamResponse(response, clauseId);
        }, 1000);
    };

    const toggleVoice = () => {
        isListening ? stopListening() : startListening();
    };




    return (
        <div className="h-full w-full relative overflow-hidden">
            <div className="flex flex-col h-full relative" ref={containerRef}>

                {/* 1. RISK SUMMARY BANNER (Triggers Drawer) */}
                <div className="bg-slate-50 border-b border-slate-200 flex-none z-30">
                    <div
                        onClick={() => setIsRiskDrawerOpen(true)}
                        className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center space-x-2.5">
                            <div className="bg-red-100 p-2 rounded-full animate-pulse-slow">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">위험 조항 <span className="text-red-600">3건</span>이 감지되었습니다</h3>
                                <p className="text-xs text-slate-500">전체 목록 보기</p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 p-2 rounded-lg text-slate-400">
                            <List className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 3. WORKSPACE CONTAINER */}
                <div className="flex-1 bg-white flex flex-col min-h-0 relative">

                    {/* TAB BAR (Segmented Control) */}
                    <div className="px-6 py-2 bg-white flex justify-center flex-none z-20">
                        <div className="bg-slate-100 p-1 rounded-2xl flex w-full max-w-sm relative shadow-inner">
                            {['chat', 'pdf'].map((tab) => {
                                const isActive = activeTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-bold flex items-center justify-center space-x-1.5 transition-all relative z-10 rounded-xl",
                                            isActive ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        {tab === 'chat' && <MessageSquare className="w-4 h-4" />}
                                        {tab === 'pdf' && <FileText className="w-4 h-4" />}
                                        <span>
                                            {tab === 'chat' ? 'AI 분석 대화' : '계약서 원본'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-1 overflow-y-auto relative bg-white">

                        {/* --- CHAT TAB --- */}
                        <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", activeTab === 'chat' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                                {chatMessages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        id={`msg-${msg.id}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex flex-col max-w-[85%] space-y-1",
                                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-4 px-5 rounded-[22px] text-[15px] leading-relaxed shadow-sm break-words",
                                            msg.role === 'user'
                                                ? "bg-slate-800 text-white rounded-tr-sm"
                                                : "bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-50"
                                        )}>
                                            <div className="break-words whitespace-pre-wrap">{msg.content}</div>

                                            {msg.clauseId !== undefined && (
                                                <div className="mt-4 pt-3 border-t border-slate-200/30">
                                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => handleRiskClick(msg.clauseId!)}>
                                                        <div className="flex items-center space-x-2 text-amber-700 font-bold mb-3">
                                                            <div className="bg-amber-500 p-1.5 rounded-full">
                                                                <AlertTriangle className="w-4 h-4 text-white" />
                                                            </div>
                                                            <span className="text-sm">위험 조항 감지됨</span>
                                                            <ChevronRight className="w-4 h-4 ml-auto" />
                                                        </div>
                                                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-200/50">
                                                            <p className="text-xs text-slate-700 font-medium leading-relaxed break-words">{MOCK_CONTRACT_TEXT[msg.clauseId]}</p>
                                                        </div>
                                                        <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center">
                                                            <span className="mr-1">📄</span> 탭하여 계약서 원본 확인하기
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                                <div className="h-24"></div> {/* Spacer for Input */}
                            </div>

                            {/* Input Floating Pill */}
                            <div className="absolute bottom-6 left-0 right-0 px-6">
                                <div className={cn(
                                    "flex items-center bg-white border border-slate-200 rounded-full p-2 pl-5 shadow-xl shadow-slate-200/40 transition-all",
                                    isListening ? "ring-2 ring-red-100 border-red-200" : "hover:border-slate-300"
                                )}>
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder={isListening ? "듣고 있습니다..." : "계약서에 대해 물어보세요"}
                                        className="flex-1 bg-transparent outline-none text-slate-800 py-2.5 text-base font-medium placeholder:text-slate-400"
                                    />
                                    <button
                                        onClick={inputText ? handleSendMessage : toggleVoice}
                                        className={cn(
                                            "p-3 rounded-full transition-all duration-300 font-bold ml-1 flex items-center justify-center",
                                            inputText
                                                ? "bg-slate-900 text-white hover:bg-slate-700"
                                                : (isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-900")
                                        )}
                                    >
                                        {inputText ? <Send className="w-5 h-5" /> : (
                                            isListening ? <div className="w-5 h-2 bg-white rounded-full mx-auto" /> : <Headphones className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- PDF TAB --- */}
                        <div className={cn("absolute inset-0 overflow-y-auto bg-slate-50 flex justify-center pt-8 pb-20 transition-opacity duration-300", activeTab === 'pdf' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
                            {file ? (
                                <div className="w-full relative px-4 text-center" ref={(el) => { if (el) setPdfContainerWidth(el.clientWidth); }}>
                                    <div className="inline-block shadow-lg rounded-sm overflow-hidden bg-white">
                                        <Document
                                            file={file}
                                            onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                                            className="flex flex-col items-center space-y-4"
                                        >
                                            {Array.from(new Array(pdfNumPages), (_, index) => {
                                                const pageNumber = index + 1;
                                                const isHighlightedPage = highlight && highlight.page === pageNumber;
                                                return (
                                                    <div key={`page_${pageNumber}`} className="relative border-b border-slate-100 last:border-0">
                                                        <Page
                                                            pageNumber={pageNumber}
                                                            width={pdfContainerWidth ? (pdfContainerWidth - 32) : 300}
                                                            scale={pdfScale}
                                                            renderTextLayer={false}
                                                            renderAnnotationLayer={false}
                                                        />

                                                        {/* Clickable Yellow Highlights */}
                                                        {CLICKABLE_HIGHLIGHTS.filter(h => h.page === pageNumber).map((zone) => (
                                                            <motion.div
                                                                key={zone.id}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                whileHover={{ opacity: 0.9, scale: 1.01 }}
                                                                className="absolute bg-yellow-300/40 border-2 border-yellow-400/60 cursor-pointer z-20 rounded-sm hover:bg-yellow-300/60 transition-all"
                                                                style={{
                                                                    left: `${zone.x}%`,
                                                                    top: `${zone.y}%`,
                                                                    width: `${zone.width}%`,
                                                                    height: `${zone.height}%`,
                                                                }}
                                                                onClick={() => setSelectedLegalClause({ title: zone.title, content: zone.content, law: zone.law })}
                                                            />
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </Document>
                                    </div>

                                    {/* Zoom Controls */}
                                    <div className="fixed bottom-8 right-6 flex flex-col space-y-2 z-50">
                                        <button onClick={() => setPdfScale(p => Math.min(p + 0.2, 3))} className="bg-white text-slate-700 p-3 rounded-full shadow-xl border border-slate-100 hover:bg-slate-50">
                                            <ZoomIn className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setPdfScale(p => Math.max(p - 0.2, 0.5))} className="bg-white text-slate-700 p-3 rounded-full shadow-xl border border-slate-100 hover:bg-slate-50">
                                            <ZoomOut className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                                    <div className="p-6 bg-slate-100 rounded-full">
                                        <FileText className="w-12 h-12 opacity-50" />
                                    </div>
                                    <p className="font-medium">업로드된 파일이 없습니다.</p>
                                </div>
                            )}
                        </div>

                        {/* --- RESULT TAB --- */}
                        {/* Removed as Result is now a separate page */}
                    </div>
                </div>

            </div>

            {/* Legal Clause Modal (Slide-up from bottom - INSIDE Mobile Frame) */}
            {selectedLegalClause && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedLegalClause(null)}
                        className="absolute inset-0 bg-black z-[100] pointer-events-auto"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[110] max-h-[70vh] overflow-y-auto"
                    >
                        <div className="p-6 pb-8">
                            {/* Handle Bar */}
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedLegalClause(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Content */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-blue-600 font-bold">{selectedLegalClause.law}</p>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedLegalClause.title}</h3>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                        {selectedLegalClause.content}
                                    </p>
                                </div>

                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                                    <p className="text-xs text-blue-800 font-medium">
                                        <span className="font-bold">💡 AI 조언:</span> 이 조항은 귀하의 계약서와 비교하여 검토가 필요합니다. 전문가 상담을 권장드립니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
            {/* Risk List Right Drawer */}
            <AnimatePresence>
                {isRiskDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRiskDrawerOpen(false)}
                            className="absolute inset-0 bg-black z-[100] cursor-pointer"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="absolute top-0 bottom-0 right-0 w-[85%] max-w-sm bg-slate-50 shadow-2xl z-[110] flex flex-col border-l border-slate-200"
                        >
                            <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between safe-area-top">
                                <h2 className="font-bold text-lg text-slate-800">발견된 위험 조항</h2>
                                <button onClick={() => setIsRiskDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                                    <BarChart2 className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-800 font-bold mb-1">종합 분석 리포트</p>
                                        <p className="text-xs text-blue-600 mb-2">전체적인 계약서 안정성 점수와 상세 분석을 확인하세요.</p>
                                        <button
                                            onClick={() => navigate('/result')}
                                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                        >
                                            리포트 보러가기 →
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2">상세 내역</h3>

                                <div
                                    onClick={() => { handleRiskClick(1); setIsRiskDrawerOpen(false); }}
                                    className="bg-white p-4 rounded-xl border border-red-100 shadow-sm cursor-pointer hover:border-red-300 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">HIGH</span>
                                        <span className="text-xs text-slate-400">제2조 관련</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">영업지역 보호 조항 누락</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        가맹본부는 가맹점사업자의 영업지역을 설정하지 않는다고 명시되어 있어, 인근 신규 출점으로 인한 피해가 예상됩니다.
                                    </p>
                                </div>

                                <div
                                    onClick={() => { handleRiskClick(3); setIsRiskDrawerOpen(false); }}
                                    className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm cursor-pointer hover:border-orange-300 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded">MEDIUM</span>
                                        <span className="text-xs text-slate-400">제4조 관련</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">과도한 위약금 설정</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        중도 해지 시 일괄적으로 로열티 300%를 부과하는 것은 과도한 손해배상 예정으로 보일 소지가 있습니다.
                                    </p>
                                </div>

                                <div
                                    onClick={() => { handleRiskClick(5); setIsRiskDrawerOpen(false); }}
                                    className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm cursor-pointer hover:border-orange-300 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded">MEDIUM</span>
                                        <span className="text-xs text-slate-400">제5조 관련</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">불공정 물품 구매 강제</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        모든 물품을 본사 지정처에서만 구매하도록 강제하는 것은 거래상 지위 남용에 해당할 수 있습니다.
                                    </p>
                                </div>

                                <div className="h-20"></div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chat;
