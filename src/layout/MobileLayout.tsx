import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Mic, Home, FileText, Menu } from 'lucide-react';
import { cn } from '../lib/utils';

const MobileLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: '홈', path: '/' },
    { icon: Mic, label: 'AI 비서', path: '/chat' },
    { icon: FileText, label: '분석 결과', path: '/result' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Dynamic Header */}
      <header className="bg-white/80 backdrop-blur-md p-4 sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center safe-area-top">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
          돌다리
        </h1>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 py-3 pb-6 safe-area-bottom z-50 px-6 flex justify-between items-center shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-all duration-300",
                isActive ? "text-blue-600 transform -translate-y-1" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive ? "bg-blue-50" : "bg-transparent"
              )}>
                <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileLayout;
