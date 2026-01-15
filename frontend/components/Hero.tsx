
import React from 'react';
import { OFFICIAL_LOGO_URL } from '../constants';

interface HeroProps {
  onOpenMenu: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenMenu }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#FEE135] pt-24 pb-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center z-10">
        <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
          <div className="inline-block px-6 py-2 bg-[#1E3A8A] rounded-full mb-8 shadow-lg">
            <h2 className="text-white font-black tracking-[0.2em] text-sm uppercase italic">Premium Dog Experience</h2>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-[#1E3A8A] leading-none mb-6 uppercase italic">
            CHAPA <br />
            <span className="text-red-600 drop-shadow-md">QUENTE</span>
          </h1>
          <p className="text-[#1E3A8A] text-2xl font-black mb-10 leading-tight uppercase">
            Sabor de verdade <br />
            <span className="bg-white px-2">pra quem tem fome!</span>
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center md:justify-start">
            <button
              onClick={onOpenMenu}
              className="bg-[#1E3A8A] text-white px-12 py-5 rounded-3xl font-black text-xl uppercase shadow-2xl hover:scale-105 transition-all border-b-4 border-black/20"
            >
              VER CARDÁPIO
            </button>
          </div>
        </div>

        <div className="md:w-1/2 flex justify-center relative">
          <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150"></div>
          <img
            src={OFFICIAL_LOGO_URL}
            alt="Chapa Quente"
            className="relative w-full max-w-sm md:max-w-md rounded-full border-8 border-white shadow-2xl animate-float object-cover aspect-square"
          />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
      `}</style>
    </section>
  );
};

export default Hero;
