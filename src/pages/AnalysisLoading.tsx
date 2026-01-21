import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scan, Search, FileCheck, BrainCircuit, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

const AnalysisLoading = () => {
    const navigate = useNavigate();
    const { setIsAnalyzing } = useStore();
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("계약서 스캔 중...");

    useEffect(() => {
        setIsAnalyzing(true);
        
        // Progress Simulation
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Varying speed for realism
                const increment = Math.random() * 2 + 0.5;
                return Math.min(prev + increment, 100);
            });
        }, 50);

        return () => clearInterval(interval);
    }, [setIsAnalyzing]);

    useEffect(() => {
        if (progress < 30) {
            setStatusText("문서 구조 파악 중...");
        } else if (progress < 60) {
            setStatusText("위험 조항 스캔 중...");
        } else if (progress < 90) {
            setStatusText("법률 AI 분석 수행 중...");
        } else {
            setStatusText("분석 마무리 중...");
        }

        if (progress >= 100) {
            setTimeout(() => {
                navigate('/chat');
            }, 500);
        }
    }, [progress, navigate]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <div className="w-full h-full min-h-screen bg-slate-50 relative max-w-md shadow-2xl flex flex-col items-center justify-center overflow-hidden">
                
                {/* Background Animation */}
                <div className="absolute inset-0 bg-blue-50/50 z-0">
                    <div className="absolute top-1/4 left-10 w-32 h-32 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col items-center space-y-10 px-6 w-full">
                    
                    {/* Scanner Animation */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                         {/* Rings */}
                         <motion.div 
                            className="absolute inset-0 border-4 border-blue-100 rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                         />
                         <motion.div 
                            className="absolute inset-0 border-4 border-blue-200 rounded-full"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                         />
                         
                         {/* Icons changing based on progress */}
                         <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-200/50">
                            {progress < 30 && <Scan className="w-10 h-10 text-blue-600 animate-pulse" />}
                            {progress >= 30 && progress < 60 && <Search className="w-10 h-10 text-purple-600 animate-bounce" />}
                            {progress >= 60 && progress < 90 && <BrainCircuit className="w-10 h-10 text-indigo-600 animate-pulse" />}
                            {progress >= 90 && <CheckCircle className="w-10 h-10 text-green-500 scale-110" />}
                         </div>
                    </div>

                    {/* Text & Progress Bar */}
                    <div className="w-full space-y-4 text-center">
                        <motion.h2 
                            key={statusText}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xl font-bold text-slate-800"
                        >
                            {statusText}
                        </motion.h2>
                        
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden relative">
                             <motion.div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                style={{ width: `${progress}%` }}
                             />
                        </div>
                        <p className="text-sm text-slate-500 font-medium font-mono">{Math.round(progress)}%</p>
                    </div>

                    {/* Did You Know? */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="bg-white/80 backdrop-blur border border-slate-100 p-4 rounded-xl text-center shadow-sm max-w-xs"
                    >
                        <p className="text-xs text-slate-400 font-bold mb-1">💡 알고 계셨나요?</p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            영업지역 보호 조항이 없는 경우, 인근에 동일 브랜드가 입점해도 법적 보호를 받기 어려울 수 있습니다.
                        </p>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default AnalysisLoading;
