import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  AlertTriangle,
  FileText,
  MessageSquare,
  ChevronRight,
  BarChart2,
  Headphones,
  X,
  List,
  RefreshCw,
  MessageCircle,
  Plus,
  Minus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { cn } from "../lib/utils";
import { useSpeech } from "../hooks/useSpeech";
import { Document, Page, pdfjs } from "react-pdf";

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
  const { chatMessages, addChatMessage, isAnalyzing, setIsAnalyzing, file } =
    useStore();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Layout State
  const [activeTab, setActiveTab] = useState<"chat" | "pdf">("chat");
  const [isRiskDrawerOpen, setIsRiskDrawerOpen] = useState(false);

  // Navigation

  // PDF State
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfContainerWidth, setPdfContainerWidth] = useState<number>(0);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [highlight, setHighlight] = useState<{
    page: number;
    yPercent: number;
    heightPercent: number;
  } | null>(null);

  // Interactive Text Highlights State
  const [selectedLegalClause, setSelectedLegalClause] = useState<{
    title: string;
    content: string;
    law: string;
  } | null>(null);

  interface RiskLocation {
    page: number;
    rect: [number, number, number, number]; // x, y, width, height (percentage)
  }

  interface RiskItem {
    id: number;
    type: "CRITICAL" | "MAJOR";
    title: string;
    description: string;
    law: string;
    locations: RiskLocation[];
  }

  const MOCK_RISK_DATA: RiskItem[] = [
    {
      id: 1,
      type: "CRITICAL",
      title: "영업지역 보호 조항 누락",
      description:
        "가맹본부는 가맹점사업자의 영업에 지장을 주지 않도록 일정 거리 내 신규 가맹점 설립을 제한할 의무가 있습니다.",
      law: "가맹사업법 제12조",
      locations: [{ page: 1, rect: [14, 56, 72, 6] }],
    },
    {
      id: 3,
      type: "MAJOR",
      title: "과도한 위약금 설정",
      description:
        "가맹본부는 가맹점사업자에게 통상적인 범위를 초과하는 손해배상액을 예정하거나 위약금을 부과할 수 없습니다. 위반 시 3천만원 이하의 과태료가 부과됩니다.",
      law: "공정거래법 제23조",
      locations: [{ page: 1, rect: [14, 65, 72, 4] }],
    },
    {
      id: 5,
      type: "MAJOR",
      title: "불공정 물품 구매 강제",
      description:
        "모든 물품을 본사 지정처에서만 구매하도록 강제하는 것은 거래상 지위 남용에 해당할 수 있습니다.",
      law: "가맹사업법 제12조",
      locations: [{ page: 1, rect: [14, 78, 72, 4] }],
    },
  ];

  const {
    isListening,
    transcript,
    setTranscript,
    startListening,
    stopListening,
    speak,
  } = useSpeech();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRiskClick = (riskId: number) => {
    const risk = MOCK_RISK_DATA.find((r) => r.id === riskId);
    if (!risk || risk.locations.length === 0) return;

    setActiveTab("pdf");

    // Use the first location for zooming
    const loc = risk.locations[0];

    // Calculate convenient zoom level and position
    // Ideally we want the risk in the center.
    // For simplicity, we just set highlight and auto-scale.
    setHighlight({
      page: loc.page,
      yPercent: loc.rect[1] - 10, // Scroll slightly above the highlight
      heightPercent: loc.rect[3],
    });

    setPdfScale(1.5); // Auto zoom to read clearly

    // Optional: Open the modal immediately with details
    setSelectedLegalClause({
      title: risk.title,
      content: risk.description,
      law: risk.law,
    });
  };

  useEffect(() => {
    if (activeTab === "chat") scrollToBottom();
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
      role: "assistant",
      content: "",
      clauseId: clauseId,
      timestamp: new Date(),
    });

    speak(fullText);

    let currentText = "";
    for (let i = 0; i < fullText.length; i++) {
      currentText += fullText[i];
      useStore.setState((state) => {
        const lastMsg = state.chatMessages[state.chatMessages.length - 1];
        if (lastMsg && lastMsg.id === messageId) {
          const newMessages = [...state.chatMessages];
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            content: currentText,
          };
          return { chatMessages: newMessages };
        }
        return state;
      });
      await delay(30);
    }
  };

  const simulateAnalysis = async () => {
    await delay(1000);
    await streamResponse("안녕하세요! 계약서 분석을 완료했습니다.");

    await delay(1000);
    await streamResponse(
      "중요한 위험 조항 2건이 발견되었습니다. '가맹점 영업지역 미설정'과 '과도한 위약금' 조항입니다. 1번 탭에서 확인해보세요.",
      1,
    );

    await delay(1000);
    setIsAnalyzing(false);
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    if (isListening) stopListening();

    addChatMessage({
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      timestamp: new Date(),
    });

    const userQuestion = inputText;
    setInputText("");
    setTranscript("");

    setTimeout(async () => {
      let response = `네, "${userQuestion}" 관련 조항을 찾아보겠습니다.`;
      let clauseId: number | undefined;

      if (userQuestion.includes("위약금")) {
        response =
          "위약금 조항(제4조)이 표준보다 높게 설정되어 있어 수정이 필요합니다.";
        clauseId = 3;
      } else if (userQuestion.includes("영업지역")) {
        response =
          "영업지역 보호 조항(제2조)이 누락되어 있어 향후 불이익이 발생할 수 있습니다.";
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
                <h3 className="text-sm font-bold text-slate-800">
                  위험 조항 <span className="text-red-600">3건</span>이
                  감지되었습니다
                </h3>
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
              {["chat", "pdf"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold flex items-center justify-center space-x-1.5 transition-all relative z-10 rounded-xl",
                      isActive
                        ? "text-slate-800"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    {tab === "chat" && <MessageSquare className="w-4 h-4" />}
                    {tab === "pdf" && <FileText className="w-4 h-4" />}
                    <span>
                      {tab === "chat" ? "AI 분석 대화" : "계약서 원본"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-y-auto relative bg-white">
            {/* --- CHAT TAB --- */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col transition-opacity duration-300",
                activeTab === "chat"
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none",
              )}
            >
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col max-w-[85%] space-y-1",
                      msg.role === "user"
                        ? "ml-auto items-end"
                        : "mr-auto items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "p-4 px-5 rounded-[22px] text-[15px] leading-relaxed shadow-sm break-words",
                        msg.role === "user"
                          ? "bg-slate-800 text-white rounded-tr-sm"
                          : "bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-50",
                      )}
                    >
                      <div className="break-words whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      {msg.clauseId !== undefined && (
                        <div className="mt-4 pt-3 border-t border-slate-200/30">
                          <div
                            className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-4 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => handleRiskClick(msg.clauseId!)}
                          >
                            <div className="flex items-center space-x-2 text-amber-700 font-bold mb-3">
                              <div className="bg-amber-500 p-1.5 rounded-full">
                                <AlertTriangle className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm">위험 조항 감지됨</span>
                              <ChevronRight className="w-4 h-4 ml-auto" />
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-200/50">
                              <p className="text-xs text-slate-700 font-medium leading-relaxed break-words">
                                {MOCK_CONTRACT_TEXT[msg.clauseId]}
                              </p>
                            </div>
                            <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center">
                              <span className="mr-1">📄</span> 탭하여 계약서
                              원본 확인하기
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
                <div
                  className={cn(
                    "flex items-center bg-white border border-slate-200 rounded-full p-2 pl-5 shadow-xl shadow-slate-200/40 transition-all",
                    isListening
                      ? "ring-2 ring-red-100 border-red-200"
                      : "hover:border-slate-300",
                  )}
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={
                      isListening
                        ? "듣고 있습니다..."
                        : "계약서에 대해 물어보세요"
                    }
                    className="flex-1 bg-transparent outline-none text-slate-800 py-2.5 text-base font-medium placeholder:text-slate-400"
                  />
                  <button
                    onClick={inputText ? handleSendMessage : toggleVoice}
                    className={cn(
                      "p-3 rounded-full transition-all duration-300 font-bold ml-1 flex items-center justify-center",
                      inputText
                        ? "bg-slate-900 text-white hover:bg-slate-700"
                        : isListening
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-slate-100 text-slate-900",
                    )}
                  >
                    {inputText ? (
                      <Send className="w-5 h-5" />
                    ) : isListening ? (
                      <div className="w-5 h-2 bg-white rounded-full mx-auto" />
                    ) : (
                      <Headphones className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* --- PDF TAB --- */}
            <div
              className={cn(
                "absolute inset-0 bg-slate-50 transition-opacity duration-300",
                activeTab === "pdf"
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none",
              )}
            >
              {/* Scrollable Content Area */}
              <div className="w-full h-full overflow-y-auto flex justify-center pt-8 pb-20">
                {file ? (
                  <div
                    className="w-full relative px-4 text-center max-w-4xl mx-auto"
                    ref={(el) => {
                      if (el) setPdfContainerWidth(el.clientWidth);
                    }}
                  >
                    <div className="inline-block shadow-lg rounded-sm overflow-hidden bg-white">
                      <Document
                        file={file}
                        onLoadSuccess={({ numPages }) =>
                          setPdfNumPages(numPages)
                        }
                        className="flex flex-col items-center space-y-4"
                      >
                        {Array.from(new Array(pdfNumPages), (_, index) => {
                          const pageNumber = index + 1;
                          return (
                            <div
                              key={`page_${pageNumber}`}
                              className="relative border-b border-slate-100 last:border-0"
                            >
                              <Page
                                pageNumber={pageNumber}
                                width={
                                  pdfContainerWidth
                                    ? pdfContainerWidth - 32
                                    : 300
                                }
                                scale={pdfScale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />

                              {/* Precise Overlay Highlights */}
                              {MOCK_RISK_DATA.flatMap((risk) =>
                                risk.locations
                                  .filter((loc) => loc.page === pageNumber)
                                  .map((loc, idx) => (
                                    <motion.div
                                      key={`${risk.id}-${idx}`}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      whileHover={{ scale: 1.02 }}
                                      className={cn(
                                        "absolute cursor-pointer z-20 rounded-sm mix-blend-multiply transition-all border-2",
                                        risk.type === "CRITICAL"
                                          ? "bg-red-300/30 border-red-500/50 hover:bg-red-300/50"
                                          : "bg-orange-300/30 border-orange-500/50 hover:bg-orange-300/50",
                                      )}
                                      style={{
                                        left: `${loc.rect[0]}%`,
                                        top: `${loc.rect[1]}%`,
                                        width: `${loc.rect[2]}%`,
                                        height: `${loc.rect[3]}%`,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLegalClause({
                                          title: risk.title,
                                          content: risk.description,
                                          law: risk.law,
                                        });
                                        setIsRiskDrawerOpen(false);
                                      }}
                                    />
                                  )),
                              )}
                            </div>
                          );
                        })}
                      </Document>
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

              {/* Zoom Controls (Absolute positioned within the relative container) */}
              {file && (
                <div className="absolute bottom-6 right-6 z-50 flex flex-col space-y-2">
                  <button
                    onClick={() =>
                      setPdfScale((prev) => Math.min(prev + 0.2, 2.0))
                    }
                    className="bg-slate-900/90 text-white p-3 rounded-full shadow-lg border border-white/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
                    aria-label="Zoom In"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                  <div className="bg-slate-900/90 text-white py-1 px-2 rounded-lg text-[10px] font-bold text-center shadow-lg border border-white/20 backdrop-blur-md">
                    {Math.round(pdfScale * 100)}%
                  </div>
                  <button
                    onClick={() =>
                      setPdfScale((prev) => Math.max(prev - 0.2, 0.6))
                    }
                    className="bg-slate-900/90 text-white p-3 rounded-full shadow-lg border border-white/20 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
                    aria-label="Zoom Out"
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legal Clause Modal (Slide-up from bottom - INSIDE Mobile Frame) */}
        <AnimatePresence>
          {selectedLegalClause && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLegalClause(null)}
                className="absolute inset-0 bg-black z-[210] backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-slate-100 rounded-t-[32px] z-[220] max-h-[85vh] overflow-hidden flex flex-col shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.2)]"
              >
                <div className="bg-white px-6 pt-6 pb-4 rounded-t-[32px] flex-none relative">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full" />
                  <button
                    onClick={() => setSelectedLegalClause(null)}
                    className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                  <div className="mt-2">
                    <span className="inline-block bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-md mb-2 shadow-sm">
                      위험
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      {selectedLegalClause.title}
                    </h2>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 px-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      <span className="text-xs font-bold text-slate-500">
                        내 계약서 조항
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-orange-50/30 opacity-50"></div>
                      <p className="relative text-[15px] leading-relaxed text-slate-700 font-medium">
                        <span className="bg-yellow-200 decoration-clone px-1 rounded-sm box-decoration-clone">
                          {selectedLegalClause.content}
                        </span>
                      </p>
                      <div className="mt-3 flex items-center justify-end">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">
                          {selectedLegalClause.law}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 px-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-xs font-bold text-blue-600">
                        AI 변호사 조언
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 relative">
                      <div className="flex items-start space-x-4">
                        <div className="flex-none -ml-2 -mt-2">
                          <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-white shadow-md overflow-hidden relative">
                            <img
                              src="/advisor.png"
                              alt="AI Advisor"
                              className="w-full h-full object-cover transform scale-110 translate-y-1"
                            />
                          </div>
                        </div>
                        <div className="flex-1 relative">
                          <div className="absolute top-4 -left-2 w-3 h-3 bg-blue-50 transform rotate-45 border-l border-b border-blue-100"></div>
                          <div className="bg-blue-50 p-3.5 rounded-xl rounded-tl-none text-sm text-slate-700 leading-relaxed border border-blue-100">
                            <p className="font-bold text-blue-900 mb-1">
                              사장님, 이거 큰일나요!
                            </p>
                            이 조항은{" "}
                            <span className="font-bold text-red-500">
                              독소조항
                            </span>
                            에 해당합니다. 나중에 가게를 접을때 퇴직금이 날아갈
                            수 있어요. 꼭 수정해야 해요!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-4"></div>
                </div>
                <div className="bg-white p-5 border-t border-slate-100 safe-area-bottom">
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>이 조항, 수정될까요?</span>
                    </button>
                    <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>변호사에게 물어보기</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="absolute top-0 bottom-0 right-0 w-[85%] max-w-sm bg-slate-50 shadow-2xl z-[110] flex flex-col border-l border-slate-200"
              >
                <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between safe-area-top">
                  <h2 className="font-bold text-lg text-slate-800">
                    발견된 위험 조항
                  </h2>
                  <button
                    onClick={() => setIsRiskDrawerOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                    <BarChart2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-bold mb-1">
                        종합 분석 리포트
                      </p>
                      <p className="text-xs text-blue-600 mb-2">
                        전체적인 계약서 안정성 점수와 상세 분석을 확인하세요.
                      </p>
                      <button
                        onClick={() => navigate("/result")}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                      >
                        리포트 보러가기 →
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2">
                    상세 내역
                  </h3>
                  {/* MOCK RISK ITEMS LOOP */}
                  {MOCK_RISK_DATA.map((risk) => (
                    <div
                      key={risk.id}
                      onClick={() => {
                        handleRiskClick(risk.id);
                        setIsRiskDrawerOpen(false);
                      }}
                      className={cn(
                        "bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all active:scale-[0.98]",
                        risk.type === "CRITICAL"
                          ? "border-red-100 hover:border-red-300"
                          : "border-orange-100 hover:border-orange-300",
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            risk.type === "CRITICAL"
                              ? "bg-red-50 text-red-600"
                              : "bg-orange-50 text-orange-600",
                          )}
                        >
                          {risk.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          제{risk.locations[0]?.page}조 관련
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">
                        {risk.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {risk.description}
                      </p>
                    </div>
                  ))}
                  <div className="h-20"></div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Chat;
