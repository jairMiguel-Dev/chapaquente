
import React from 'react';
import { User } from '../types';

interface LoyaltyCardProps {
  user: User | null;
  onOpenAuth: () => void;
}

const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ user, onOpenAuth }) => {
  const maxPoints = 10;
  const points = user?.loyaltyPoints || 0;
  const progress = (points / maxPoints) * 100;

  if (!user) {
    return (
      <div className="bg-navy rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl border border-gold/30 text-center">
        <h2 className="text-3xl font-black text-white uppercase italic mb-4">Membro <span className="text-gold">Imperial</span></h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto font-medium">Faça login para começar a acumular selos e ganhar hot dogs grátis!</p>
        <button
          onClick={onOpenAuth}
          className="bg-gold text-navy px-12 py-5 rounded-2xl font-black uppercase shadow-xl hover:scale-105 transition-all"
        >
          Entrar no Clube
        </button>
      </div>
    );
  }

  return (
    <div className="bg-navy rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-gold/30">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 w-full text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
            <span className="bg-gold text-navy px-3 py-1 rounded-full font-black text-[10px] uppercase">VIP NÍVEL {points >= 5 ? 'OURO' : 'PRATA'}</span>
            {points > 0 && points < maxPoints && (
              <span className="text-green-400 font-black text-[10px] uppercase">
                <i className="fas fa-infinity mr-1"></i> Sem expiração
              </span>
            )}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic mb-4">Olá, {user.name.split(' ')[0]}!</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
            Ganhe <strong className="text-gold">1 selo a cada compra</strong> realizada! Complete 10 selos e resgate seu <strong className="text-gold">hot dog grátis</strong>! 🌭
          </p>

          <div className="relative h-4 bg-white/10 rounded-full overflow-hidden mb-4 border border-white/5">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold to-yellow-300 transition-all duration-1000 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
            <span>{points} DE {maxPoints} SELOS</span>
            {points === maxPoints ? (
              <span className="text-green-500 animate-bounce">PRONTO PARA RESGATAR!</span>
            ) : (
              <span>FALTAM {maxPoints - points} SELOS</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 max-w-[320px]">
          {[...Array(maxPoints)].map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 ${i < points
                  ? 'bg-gold border-gold text-navy shadow-lg rotate-12 scale-110'
                  : 'border-white/10 text-white/5'
                }`}
            >
              <i className={`fas ${i < points ? 'fa-crown animate-pulse' : 'fa-hotdog'} text-xl`}></i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyCard;
