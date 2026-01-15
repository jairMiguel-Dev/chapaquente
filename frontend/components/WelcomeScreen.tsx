
import React from 'react';
import { OFFICIAL_LOGO_URL } from '../constants';

interface WelcomeScreenProps {
    onStartOrder: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartOrder }) => {
    return (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center overflow-hidden">
            {/* Solid Background - Garante que nada embaixo seja visível */}
            <div className="absolute inset-0 bg-navy"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#0a1628] to-black"></div>

            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gold/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-red-600/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gold/3 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

                {/* Floating Icons */}
                <div className="absolute top-[15%] left-[10%] text-gold/10 text-6xl animate-bounce" style={{ animationDuration: '3s' }}>
                    <i className="fas fa-hotdog"></i>
                </div>
                <div className="absolute top-[25%] right-[15%] text-gold/10 text-5xl animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                    <i className="fas fa-fire"></i>
                </div>
                <div className="absolute bottom-[20%] left-[15%] text-gold/10 text-5xl animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '1s' }}>
                    <i className="fas fa-pepper-hot"></i>
                </div>
                <div className="absolute bottom-[30%] right-[10%] text-gold/10 text-6xl animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.3s' }}>
                    <i className="fas fa-crown"></i>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-xl">
                {/* Logo Container */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gold rounded-full blur-3xl opacity-30 animate-pulse scale-150"></div>
                    <div className="relative">
                        <div className="w-44 h-44 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-gold via-amber-400 to-gold p-1.5 shadow-2xl shadow-gold/30 animate-in zoom-in duration-700">
                            <img
                                src={OFFICIAL_LOGO_URL}
                                alt="Chapa Quente Logo"
                                className="w-full h-full rounded-full object-cover border-4 border-navy"
                            />
                        </div>
                        {/* Glowing Ring */}
                        <div className="absolute -inset-3 rounded-full border-2 border-gold/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                    </div>
                </div>

                {/* Brand Name */}
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic leading-none mb-3 tracking-tight animate-in fade-in slide-in-from-bottom duration-500">
                    CHAPA <span className="text-gold">QUENTE</span>
                </h1>

                <p className="text-red-500 font-black text-xs md:text-sm uppercase tracking-[0.3em] mb-8 animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
                    Dog Lanches Gourmet
                </p>

                {/* Welcome Message */}
                <div className="bg-white/5 backdrop-blur-sm rounded-3xl px-8 py-6 mb-10 border border-white/10 animate-in fade-in slide-in-from-bottom duration-500" style={{ animationDelay: '400ms' }}>
                    <p className="text-white/80 text-lg md:text-xl font-medium leading-relaxed">
                        Bem-vindo ao <span className="text-gold font-black">melhor hot dog gourmet</span> da cidade!
                    </p>
                    <p className="text-white/50 text-sm mt-2">
                        Para começar seu pedido, faça login ou crie sua conta.
                    </p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onStartOrder}
                    className="group relative bg-gradient-to-r from-gold via-amber-400 to-gold text-navy px-16 py-6 rounded-full font-black text-xl uppercase shadow-2xl shadow-gold/40 hover:shadow-gold/60 hover:scale-105 active:scale-95 transition-all duration-300 animate-in fade-in zoom-in duration-500 border-b-4 border-amber-600"
                    style={{ animationDelay: '600ms' }}
                >
                    <span className="flex items-center justify-center gap-3">
                        <i className="fas fa-user-circle text-2xl"></i>
                        Iniciar Pedido
                    </span>

                    {/* Button Glow Effect */}
                    <div className="absolute inset-0 rounded-full bg-gold/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>

                {/* Touch Hint for Totem */}
                <div className="mt-8 flex items-center gap-2 text-white/30 animate-pulse">
                    <i className="fas fa-hand-pointer text-lg"></i>
                    <span className="text-xs uppercase tracking-widest font-bold">Toque para continuar</span>
                </div>
            </div>

            {/* Bottom Branding */}
            <div className="absolute bottom-8 text-center">
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">
                    Autoatendimento Exclusivo
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
