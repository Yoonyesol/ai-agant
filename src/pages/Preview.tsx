import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Check, FileText, Home } from 'lucide-react';
import { useStore } from '../store/useStore';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker correctly for Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Preview = () => {
  const { file } = useStore();
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!file) {
      navigate('/');
    }
  }, [file, navigate]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handleNext = () => {
    if (pageNumber < numPages) setPageNumber(prev => prev + 1);
  };

  const handlePrev = () => {
    if (pageNumber > 1) setPageNumber(prev => prev - 1);
  };

  const startAnalysis = () => {
    navigate('/analysis-loading');
  };

  return (
    // Outer container for desktop centering (Grey background)
    // Outer container for desktop centering (Grey background)
    <div className="fixed inset-0 h-screen w-screen bg-gray-100 flex items-center justify-center overflow-hidden">

      {/* Mobile Frame Container (White background, shadow, max-w-md) */}
      <div className="w-full h-full max-w-md bg-slate-50 relative shadow-2xl flex flex-col overflow-hidden">

        {/* Header - Sticky within the mobile frame */}
        <header className="bg-white/80 backdrop-blur-md p-3 px-5 sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center safe-area-top flex-none">
          <div className="flex items-center w-full relative justify-center">
            <button
              onClick={() => navigate('/')}
              className="absolute left-0 p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors -ml-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              계약서 미리보기
            </h1>
            <button
              onClick={() => navigate('/')}
              className="absolute right-0 p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors -mr-2"
            >
              <Home className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* PDF Viewer Area */}
        <div
          className="flex-1 overflow-auto scrollbar-hide flex items-start justify-center pt-8 pb-32 px-4"
          ref={(el) => {
            if (el && el.clientWidth !== containerWidth) {
              setContainerWidth(el.clientWidth);
            }
          }}
        >
          {file ? (
            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center h-64 w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <span className="text-slate-500 text-sm">로딩 중...</span>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center p-8 text-red-500 text-center">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <span>PDF를 불러올 수 없습니다.</span>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={containerWidth ? containerWidth - 32 : 300} // Dynamic width minus padding
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText className="w-12 h-12 mb-2 opacity-20" />
              <p>파일이 없습니다.</p>
            </div>
          )}
        </div>

        {/* Bottom Controls Layer - Absolute position within mobile frame */}
        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">

          {/* Page Controls - Floating above button */}
          <div className="flex justify-center mb-4 pointer-events-auto">
            <div className="flex items-center bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-200 space-x-4">
              <button
                onClick={handlePrev}
                disabled={pageNumber <= 1}
                className="p-2 text-slate-600 disabled:opacity-30 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-sm font-semibold font-mono text-slate-700">
                {pageNumber} / {numPages || '-'}
              </span>
              <button
                onClick={handleNext}
                disabled={pageNumber >= numPages}
                className="p-2 text-slate-600 disabled:opacity-30 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Action Button - Fixed at bottom of the frame */}
          <div className="bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pointer-events-auto">
            <button
              onClick={startAnalysis}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98]"
            >
              <span>이대로 분석하기</span>
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Preview;
