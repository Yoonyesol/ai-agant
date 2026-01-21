import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Info, ChevronDown, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const Result = () => {
  const { analysisResult } = useStore();
  const navigate = useNavigate();

  // Mock Data
  const reportData = {
    score: 65,
    grade: "주의",
    gradeColor: "text-amber-500",
    summary: "전반적으로 양호하나, 위약금 및 영업지역 보호 조항에서 독소 조항이 발견되었습니다.",
    risks: [
      { id: 1, type: "danger", title: "영업지역 미설정", content: "반경 500m 내 신규 출점 금지 조항이 없습니다. (제 2조)" },
      { id: 2, type: "warning", title: "과도한 위약금", content: "중도 해지 시 남은 계약 기간 로열티 전액 청구 (제 4조)" },
      { id: 3, type: "success", title: "인테리어 강요 없음", content: "불합리한 리뉴얼 강제 조항이 발견되지 않았습니다." }
    ],
    brandStats: {
      growth: "+15%",
      closingRate: "3.2%",
      avgRevenue: "2,500만원",
      industryAvg: {
         closingRate: "5.0%",
         revenue: "2,100만원"
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto w-full p-6 pb-24 relative scroll-smooth space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header with Disclaimer */}
      <div className="bg-slate-100 p-3 rounded-lg flex items-start space-x-2 text-xs text-slate-500">
        <Info className="w-4 h-4 flex-none mt-0.5" />
        <p>본 분석 결과는 인공지능에 기반한 참고 자료이며, 법적 효력은 없습니다. 최종 결정 전 전문가와 상담하세요.</p>
      </div>

      {/* Summary Score Card */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
        <h2 className="text-lg font-medium text-slate-600 mb-4">계약 안전성 점수</h2>
        
        <div className="mb-6 relative inline-block">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              className="text-slate-100"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
              r="70"
              cx="80"
              cy="80"
            />
            <circle
              className="text-amber-500 transition-all duration-1000 ease-out"
              strokeWidth="12"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * 65) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="70"
              cx="80"
              cy="80"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-slate-900">{reportData.score}</span>
            <span className={cn("text-lg font-bold", reportData.gradeColor)}>{reportData.grade}</span>
          </div>
        </div>
        
        <p className="text-slate-700 leading-relaxed font-medium">
          "{reportData.summary}"
        </p>
      </section>

      {/* Contract Risk Scanner */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-slate-900">독소조항 스캔 결과</h3>
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-full text-slate-600">3건 발견</span>
        </div>
        
        <div className="space-y-3">
          {reportData.risks.map((risk, index) => (
            <div key={risk.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                {risk.type === 'danger' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {risk.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {risk.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                <span className="font-bold text-slate-800">{risk.title}</span>
              </div>
              <p className="text-slate-600 text-sm pl-8">
                {risk.content}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Analysis */}
      <section className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-slate-900 px-1">브랜드 건전성 분석</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 block mb-1">폐점률</span>
            <div className="flex items-end space-x-2">
              <span className="text-xl font-bold text-slate-900">{reportData.brandStats.closingRate}</span>
              <span className="text-xs text-emerald-600 font-medium mb-1">업계 평균 {reportData.brandStats.industryAvg.closingRate}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[60%] rounded-full"></div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 block mb-1">월 평균 매출</span>
            <div className="flex items-end space-x-2">
              <span className="text-xl font-bold text-slate-900">2,500만</span>
            </div>
            <div className="text-xs text-red-500 flex items-center mt-1">
              <TrendingDown className="w-3 h-3 mr-1" />
              <span>전월 대비 감소</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
          <strong>사용자님을 위한 팁:</strong><br/>
          해당 브랜드는 폐점률이 낮아 안정적이지만, 최근 매출 성장세가 둔화되고 있습니다. 인근 가맹점 현황을 직접 방문해보시는 것을 추천드립니다.
        </div>
      </section>

      {/* Back to Chat Floating Button */}
      <div className="fixed bottom-6 w-full max-w-md left-1/2 -translate-x-1/2 px-6 pointer-events-none">
          <button 
            onClick={() => navigate('/chat')}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 flex items-center justify-center space-x-2 pointer-events-auto hover:bg-slate-800 transition-colors"
          >
              <MessageSquare className="w-5 h-5" />
              <span>채팅으로 돌아가기</span>
          </button>
      </div>
    </div>
  );
};

export default Result;
