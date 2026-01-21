import { useRef } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, TrendingDown, Info, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Result = () => {
  const resultRef = useRef<HTMLDivElement>(null);

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

  const downloadPDF = async () => {
    if (!resultRef.current) return;

    try {
      const element = resultRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`계약분석결과_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  return (
    <div className="h-full relative flex flex-col">
      <div className="flex-1 overflow-y-auto w-full scroll-smooth bg-white">
        <div 
          ref={resultRef}
          className="p-6 pb-24 space-y-6 animate-in slide-in-from-bottom-4 duration-700"
        >
        {/* Header with Disclaimer */}
        <div className="bg-slate-100 p-4 rounded-2xl flex items-start space-x-3 text-xs text-slate-500 border border-slate-200/50">
          <Info className="w-4 h-4 flex-none mt-0.5 text-slate-400" />
          <p className="leading-relaxed">본 분석 결과는 인공지능에 기반한 참고 자료이며, 법적 효력은 없습니다. 최종 결정 전 반드시 법률 전문가와 상담하시기 바랍니다.</p>
        </div>

        {/* Summary Score Card */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <h2 className="text-lg font-bold text-slate-800 mb-6">계약 안전성 점수</h2>
          
          <div className="mb-6 relative inline-block">
            <svg className="w-44 h-44 transform -rotate-90">
              <circle
                className="text-slate-50"
                strokeWidth="14"
                stroke="currentColor"
                fill="transparent"
                r="74"
                cx="88"
                cy="88"
              />
              <circle
                className="text-amber-500 transition-all duration-1000 ease-out"
                strokeWidth="14"
                strokeDasharray={465}
                strokeDashoffset={465 - (465 * 65) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="74"
                cx="88"
                cy="88"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-slate-900 tracking-tight">{reportData.score}</span>
              <span className={cn("text-xl font-bold mt-1", reportData.gradeColor)}>{reportData.grade}</span>
            </div>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
            <p className="text-slate-800 leading-relaxed font-semibold text-lg italic">
              "{reportData.summary}"
            </p>
          </div>
        </section>

        {/* Contract Risk Scanner */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-bold text-slate-900">독소조항 스캔 결과</h3>
            <span className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100">3건 발견</span>
          </div>
          
          <div className="space-y-4">
            {reportData.risks.map((risk) => (
              <div key={risk.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    risk.type === 'danger' ? "bg-red-50" : (risk.type === 'warning' ? "bg-amber-50" : "bg-emerald-50")
                  )}>
                    {risk.type === 'danger' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {risk.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    {risk.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <span className="font-bold text-slate-900 text-lg">{risk.title}</span>
                </div>
                <p className="text-slate-600 text-[15px] leading-relaxed pl-12 border-l-2 border-slate-50 ml-6">
                  {risk.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Brand Analysis */}
        <section className="space-y-4 pt-4">
          <h3 className="text-xl font-bold text-slate-900 px-1">브랜드 건전성 분석</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">폐점률</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">{reportData.brandStats.closingRate}</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">평균 대비 낮음</span>
              </div>
              <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[60%] rounded-full shadow-inner"></div>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">월 평균 매출</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">2,500</span>
                <span className="text-sm font-bold text-slate-600">만원</span>
              </div>
              <div className="text-[10px] text-red-500 flex items-center mt-2 font-bold bg-red-50 w-fit px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3 mr-1" />
                <span>전월 대비 감소</span>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 text-indigo-900 text-sm leading-relaxed shadow-sm">
            <strong className="block text-indigo-700 mb-1 flex items-center">
              <span className="mr-2">💡</span> AI 심층 분석 제언
            </strong>
            해당 브랜드는 폐점률이 낮아 안정적이지만, 최근 매출 성장세가 둔화되고 있습니다. 인근 가맹점 현황을 직접 방문해보시는 것을 추천드립니다.
          </div>
        </section>
      </div>
    </div>

      {/* Download Button Container */}
      <div className="absolute bottom-6 left-0 right-0 px-6 z-20 pointer-events-none">
        <button 
          onClick={downloadPDF}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-2xl flex items-center justify-center space-x-2 hover:bg-slate-800 transition-all active:scale-[0.98] pointer-events-auto ring-4 ring-white/20"
        >
          <Download className="w-5 h-5" />
          <span>분석 결과 리포트 다운로드 (.pdf)</span>
        </button>
      </div>
    </div>
  );
};

export default Result;
