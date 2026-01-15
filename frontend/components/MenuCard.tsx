
import React, { useState } from 'react';
import { HotDog } from '../types';

interface MenuCardProps {
  hotdog: HotDog;
  onAddToCart: (hotdog: HotDog) => void;
  availableStock?: number;
}

const MenuCard: React.FC<MenuCardProps> = ({ hotdog, onAddToCart, availableStock = 999 }) => {
  const [isAdded, setIsAdded] = useState(false);
  const isPremium = hotdog.price > 35;

  const handleAddToCart = () => {
    onAddToCart(hotdog);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className={`bg-white rounded-[2rem] overflow-hidden border-2 transition-all duration-500 flex flex-col h-full group relative ${isPremium ? 'border-gold/50 shadow-[0_0_30px_rgba(254,225,53,0.15)] hover:border-gold' : 'border-gray-100 shadow-md hover:shadow-2xl'
      } hover:scale-[1.03] hover:-translate-y-2`}>

      {/* Badge de Destaque para Itens Premium */}
      {isPremium && (
        <div className="absolute top-0 right-0 z-20 overflow-hidden w-24 h-24">
          <div className="bg-gold text-navy font-black text-[8px] uppercase tracking-widest py-1 w-32 text-center absolute top-4 -right-8 rotate-45 shadow-lg border-b border-navy/10">
            EXCLUSIVO
          </div>
        </div>
      )}

      <div className="relative h-48 md:h-56 overflow-hidden">
        <img
          src={hotdog.image}
          alt={hotdog.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
        />

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-navy/90 backdrop-blur-md text-gold px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-[0.15em] shadow-xl border border-gold/30">
            {hotdog.category}
          </div>
        </div>

        {/* Efeito de Brilho no Hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </div>

      <div className="p-6 flex flex-col flex-grow bg-white">
        <div className="flex flex-wrap gap-1 mb-3">
          {hotdog.tags.map(tag => (
            <span key={tag} className="text-[8px] font-black text-navy/40 uppercase tracking-widest border border-navy/5 px-2 py-1 rounded-lg bg-gray-50">
              #{tag}
            </span>
          ))}
        </div>

        <h3 className="text-xl font-black text-navy mb-2 uppercase italic leading-tight group-hover:text-red-600 transition-colors">
          {hotdog.name}
        </h3>

        <p className="text-gray-500 text-[11px] md:text-sm leading-relaxed mb-6 flex-grow line-clamp-2 font-medium italic">
          {hotdog.description}
        </p>

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Investimento</span>
            <span className={`text-2xl font-black tracking-tighter ${isPremium ? 'text-red-600' : 'text-navy'}`}>
              R$ {hotdog.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdded || availableStock <= 0}
            className={`h-12 md:h-14 px-6 md:px-8 rounded-2xl font-black text-[10px] md:text-xs uppercase transition-all transform active:scale-90 shadow-lg flex items-center space-x-3 relative overflow-hidden ${availableStock <= 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-50'
                : isAdded
                  ? 'bg-green-600 text-white'
                  : 'bg-gold text-navy hover:bg-navy hover:text-white'
              }`}
          >
            <i className={`fas ${availableStock <= 0 ? 'fa-times-circle' : isAdded ? 'fa-check-circle animate-bounce' : 'fa-shopping-bag'}`}></i>
            <span>{availableStock <= 0 ? 'ESGOTADO' : isAdded ? 'NA SACOLA' : 'PEDIR AGORA'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
