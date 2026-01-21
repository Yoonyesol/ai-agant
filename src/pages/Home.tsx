import React, { useRef, useState } from 'react';
import { Upload, ShieldCheck, Search, FileSearch } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const Home = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { file, setFile, setIsAnalyzing } = useStore(); // Get file from store
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    const fileName = file.name.toLowerCase();
    if (file.type !== "application/pdf" && !fileName.endsWith(".pdf")) {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    setFile(file);
    // Navigate to preview first, do not start analysis yet
    // setIsAnalyzing(true); 
    setTimeout(() => {
        navigate('/preview');
    }, 500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="space-y-4 pt-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>안심 창업 파트너</span>
        </div>
        <h2 className="text-3xl font-bold leading-tight text-slate-800">
          계약서, <br />
          <span className="text-blue-600">찍어서 올리면</span> <br />
          독소조항 끝.
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          어려운 프랜차이즈 계약서,<br/>
          전문가처럼 꼼꼼하게 분석해드립니다.
        </p>
      </section>

      {/* Upload Card */}
      <section>
        {file ? (
           <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg text-center animate-in fade-in zoom-in duration-300">
              <div className="bg-green-100 p-6 rounded-full inline-flex mb-4">
                <ShieldCheck className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">파일이 준비되었습니다</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-[200px] mx-auto truncate font-medium bg-slate-100 px-3 py-1 rounded-full">{file.name}</p>
              
              <div className="grid gap-3">
                <button 
                    onClick={() => navigate('/preview')}
                    className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors"
                >
                    미리보기로 이동
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white text-slate-500 border border-slate-200 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  다른 파일 선택하기
                </button>
              </div>
              
               <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,image/*"
                onChange={handleFileChange}
              />
           </div>
        ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-12 px-6 text-center bg-white shadow-lg",
            isDragging ? "border-blue-500 bg-blue-50 scale-[1.02]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
          )}
        >
          <div className="bg-blue-100 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">계약서 업로드</h3>
          <p className="text-slate-500">
            PDF 파일이나 사진을 <br/>여기에 끌어다 놓으세요
          </p>
          <div className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-900/20 group-hover:bg-blue-600 transition-colors">
            파일 선택하기
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf, application/pdf"
            onChange={handleFileChange}
          />
        </div>
        )}
      </section>

      {/* Feature Preview List */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 px-1">주요 기능</h3>
        <div className="grid gap-4">
          <FeatureCard 
            icon={FileSearch} 
            title="독소조항 스캐너" 
            desc="숨겨진 위험 조항 7가지를 찾아냅니다."
            color="bg-red-100 text-red-600"
          />
          <FeatureCard 
            icon={Search} 
            title="브랜드 안전성 분석" 
            desc="본사의 재무 상태와 폐점률을 진단합니다."
            color="bg-emerald-100 text-emerald-600"
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
  <div className="flex items-start space-x-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className="font-bold text-slate-900 text-lg mb-1">{title}</h4>
      <p className="text-slate-500 text-sm leading-snug">{desc}</p>
    </div>
  </div>
);

export default Home;
