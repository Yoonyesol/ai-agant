import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronLeft, Home } from 'lucide-react';

const MobileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        // Outer Container: Lock scroll
        <div className="h-screen w-screen overflow-hidden bg-gray-100 flex items-center justify-center">
            {/* Mobile Frame: Fixed size or full height, overflow handled inside */}
            <div className="w-full h-full max-w-md bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden">

                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md p-3 px-5 sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center safe-area-top flex-none">
                    {isHome ? (
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                            바른계약
                        </h1>
                    ) : (
                        <div className="flex items-center w-full relative justify-center">
                            <button
                                onClick={() => location.pathname === '/chat' ? navigate('/preview') : navigate(-1)}
                                className="absolute left-0 p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors -ml-2"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-lg font-bold text-slate-800">
                                {location.pathname === '/chat' ? 'AI 분석' : '홈으로'}
                            </h1>
                            <button
                                onClick={() => navigate('/')}
                                className="absolute right-0 p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors -mr-2"
                            >
                                <Home className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </header>

                {/* Main Content: Layout Shell */}
                {/* Each page (Home, Chat, etc.) must handle its own scrolling */}
                <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50">
                    <Outlet />
                </main>

            </div >
        </div >
    );
};

export default MobileLayout;
