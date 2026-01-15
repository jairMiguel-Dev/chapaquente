
import React, { useState } from 'react';
import { HOT_DOGS, OFFICIAL_LOGO_URL } from '../constants';
import { HotDog } from '../types';
import MenuCard from './MenuCard';

interface FullMenuPageProps {
  onClose: () => void;
  onAddToCart: (hotdog: HotDog) => void;
  onCartClick?: () => void;
  cartCount?: number;
  stock?: Record<number, number>;
}

const categories = [
  { id: 'All', label: 'Todos', icon: 'fa-border-all' },
  { id: 'Hot Dogs', label: 'Hot Dogs', icon: 'fa-hotdog' },
  { id: 'Lanches', label: 'Lanches', icon: 'fa-burger' },
  { id: 'Porcoes', label: 'Porções', icon: 'fa-bowl-food' },
  { id: 'Bebidas', label: 'Bebidas', icon: 'fa-glass-water' }
];

const FullMenuPage: React.FC<FullMenuPageProps> = ({ onClose, onAddToCart, onCartClick, cartCount = 0, stock = {} }) => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredItems = activeCategory === 'All'
    ? HOT_DOGS
    : HOT_DOGS.filter(item => item.category === activeCategory);

  return (
    <div className="fixed inset-0 z-[180] bg-white overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header Fixo */}
      <header className="bg-navy p-6 flex items-center justify-between border-b-4 border-gold shadow-xl">
        <div className="flex items-center space-x-4">
          <img src={OFFICIAL_LOGO_URL} alt="Logo" className="w-12 h-12 rounded-full border-2 border-gold" />
          <h2 className="text-white font-black text-2xl uppercase italic tracking-tighter">Nosso Cardápio</h2>
        </div>
        <div className="flex items-center space-x-3">
          {/* Botão do Carrinho */}
          {onCartClick && (
            <button
              onClick={onCartClick}
              className="relative bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
            >
              <i className="fas fa-shopping-basket text-xl"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gold text-navy w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg hover:scale-110 transition-transform"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de Categorias (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-gray-50 border-r-2 border-gray-100 p-6 space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Filtrar por</p>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-4 p-4 rounded-2xl font-black text-xs uppercase transition-all ${activeCategory === cat.id
                ? 'bg-navy text-gold shadow-lg translate-x-2'
                : 'text-gray-400 hover:bg-gray-100'
                }`}
            >
              <i className={`fas ${cat.icon} w-5`}></i>
              <span>{cat.label}</span>
            </button>
          ))}
        </aside>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-white scroll-smooth">
          {/* Categorias (Mobile) */}
          <div className="flex md:hidden space-x-4 overflow-x-auto pb-6 no-scrollbar mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-black text-[10px] uppercase border-2 transition-all ${activeCategory === cat.id ? 'bg-navy text-gold border-gold' : 'border-gray-100 text-gray-400'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map(item => (
              <div key={item.id} className="animate-in fade-in zoom-in duration-300">
                <MenuCard hotdog={item} onAddToCart={onAddToCart} availableStock={stock[item.id]} />
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-24">
              <i className="fas fa-utensils text-gray-200 text-6xl mb-4"></i>
              <p className="text-gray-400 font-black uppercase tracking-widest italic">Nenhum item encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullMenuPage;
