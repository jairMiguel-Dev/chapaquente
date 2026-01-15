
import React, { useState } from 'react';
import { INGREDIENTS, INGREDIENT_IMAGES } from '../constants';
import { CartItem } from '../types';

interface CustomDogBuilderProps {
  onClose: () => void;
  onAddCustomToCart: (item: CartItem) => void;
}

const BASE_PRICE = 18.00;

const CustomDogBuilder: React.FC<CustomDogBuilderProps> = ({ onClose, onAddCustomToCart }) => {
  const [selections, setSelections] = useState({
    pao: INGREDIENTS.paes[0],
    proteina: INGREDIENTS.proteinas[0],
    queijo: INGREDIENTS.queijos[0],
    molhos: [] as any[],
    toppings: [] as any[]
  });

  const totalPrice = BASE_PRICE + 
    selections.pao.price + 
    selections.proteina.price + 
    selections.queijo.price +
    selections.molhos.reduce((acc, m) => acc + m.price, 0) +
    selections.toppings.reduce((acc, t) => acc + t.price, 0);

  const toggleItem = (category: 'molhos' | 'toppings', item: any) => {
    setSelections(prev => {
      const list = [...prev[category]];
      const index = list.findIndex(i => i.name === item.name);
      if (index > -1) list.splice(index, 1);
      else list.push(item);
      return { ...prev, [category]: list };
    });
  };

  const applyChefSuggestion = () => {
    setSelections({
      pao: INGREDIENTS.paes[0], // Brioche
      proteina: INGREDIENTS.proteinas[1], // Wagyu
      queijo: INGREDIENTS.queijos[1], // Gruyere
      molhos: [INGREDIENTS.molhos[0]], // Trufas
      toppings: [INGREDIENTS.toppings[0], INGREDIENTS.toppings[6]] // Cebola Caramelizada + Pistache
    });
  };

  const handleFinish = () => {
    const descriptionParts = [
      `Pão ${selections.pao.name}`,
      selections.proteina.name,
      `Queijo ${selections.queijo.name}`,
      ...selections.molhos.map(m => m.name),
      ...selections.toppings.map(t => t.name)
    ].filter(Boolean);

    onAddCustomToCart({
      id: Date.now(),
      name: "Custom Dog Imperial",
      price: totalPrice,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1612392062631-94dd858cba88?auto=format&fit=crop&q=80&w=400",
      customDescription: descriptionParts.join(', ')
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-6xl h-[95vh] sm:h-[90vh] rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500 border-x-4 border-t-4 sm:border-4 border-gold">
        
        {/* Header */}
        <div className="p-6 sm:p-8 bg-navy text-white flex justify-between items-center border-b-4 border-gold shrink-0 z-30">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full p-1 border-2 border-gold flex-shrink-0">
               <img src="https://c787596d03d324b10b0789710f6396f9.cdn.bubble.io/f1741103635749x379564850785124160/image.jpg" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tighter">Laboratório VIP</h2>
              <p className="text-gold text-[10px] font-black uppercase tracking-widest">A ciência do sabor perfeito</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={applyChefSuggestion}
              className="bg-gold text-navy px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-white transition-all flex items-center space-x-2"
            >
              <i className="fas fa-magic"></i>
              <span className="hidden sm:inline">Sugestão do Chef</span>
            </button>
            <button onClick={onClose} className="bg-red-600 text-white w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center hover:bg-red-700 transition-all shadow-lg">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-12 bg-gray-50 pb-64 scroll-smooth custom-scrollbar">
          
          {/* 1. Escolha o Pão */}
          <section>
            <div className="flex items-center space-x-4 mb-6">
              <span className="bg-navy text-gold w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-md italic">1</span>
              <h3 className="text-navy font-black text-xl uppercase italic">Base: O Pão</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INGREDIENTS.paes.map(p => (
                <button 
                  key={p.name}
                  onClick={() => setSelections({...selections, pao: p})}
                  className={`group relative p-4 rounded-3xl border-4 transition-all duration-300 flex items-center space-x-4 ${selections.pao.name === p.name ? 'border-gold bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-white/50 hover:bg-white hover:border-navy/10'}`}
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                    <img src={INGREDIENT_IMAGES[p.name]} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-navy uppercase text-sm leading-none mb-1">{p.name}</p>
                    <p className="font-bold text-gray-400 text-xs">{p.price > 0 ? `+ R$ ${p.price.toFixed(2)}` : 'Incluso'}</p>
                  </div>
                  {selections.pao.name === p.name && <div className="absolute top-2 right-2 text-gold"><i className="fas fa-check-circle text-xl"></i></div>}
                </button>
              ))}
            </div>
          </section>

          {/* 2. A Proteína */}
          <section>
            <div className="flex items-center space-x-4 mb-6">
              <span className="bg-navy text-gold w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-md italic">2</span>
              <h3 className="text-navy font-black text-xl uppercase italic">Coração: A Proteína</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INGREDIENTS.proteinas.map(p => (
                <button 
                  key={p.name}
                  onClick={() => setSelections({...selections, proteina: p})}
                  className={`group relative p-4 rounded-3xl border-4 transition-all duration-300 flex items-center space-x-4 ${selections.proteina.name === p.name ? 'border-gold bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-white/50 hover:bg-white hover:border-navy/10'}`}
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                    <img src={INGREDIENT_IMAGES[p.name]} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-navy uppercase text-sm leading-none mb-1">{p.name}</p>
                    <p className="font-bold text-gray-400 text-xs">{p.price > 0 ? `+ R$ ${p.price.toFixed(2)}` : 'Incluso'}</p>
                  </div>
                  {selections.proteina.name === p.name && <div className="absolute top-2 right-2 text-gold"><i className="fas fa-check-circle text-xl"></i></div>}
                </button>
              ))}
            </div>
          </section>

          {/* 3. O Queijo */}
          <section>
            <div className="flex items-center space-x-4 mb-6">
              <span className="bg-navy text-gold w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-md italic">3</span>
              <h3 className="text-navy font-black text-xl uppercase italic">Cobertura: Queijo</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {INGREDIENTS.queijos.map(q => (
                <button 
                  key={q.name}
                  onClick={() => setSelections({...selections, queijo: q})}
                  className={`group relative flex flex-col p-4 rounded-[2rem] border-4 transition-all duration-300 ${selections.queijo.name === q.name ? 'border-gold bg-white shadow-xl scale-105' : 'border-transparent bg-white/50'}`}
                >
                  <div className="aspect-square w-full rounded-2xl overflow-hidden mb-3 shadow-md">
                    <img src={INGREDIENT_IMAGES[q.name]} alt={q.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="font-black text-navy uppercase text-[9px] text-center leading-tight">{q.name}</p>
                  {selections.queijo.name === q.name && <div className="absolute top-2 right-2 text-gold animate-bounce"><i className="fas fa-check-circle"></i></div>}
                </button>
              ))}
            </div>
          </section>

          {/* 4. Molhos Gourmet */}
          <section>
            <div className="flex items-center space-x-4 mb-6">
              <span className="bg-navy text-gold w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-md italic">4</span>
              <h3 className="text-navy font-black text-xl uppercase italic">Dips & Molhos</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {INGREDIENTS.molhos.map(m => {
                const isSelected = selections.molhos.some(i => i.name === m.name);
                return (
                  <button 
                    key={m.name}
                    onClick={() => toggleItem('molhos', m)}
                    className={`group relative flex flex-col p-4 rounded-[2rem] border-4 transition-all duration-300 ${isSelected ? 'border-gold bg-white shadow-xl scale-105' : 'border-transparent bg-white/50'}`}
                  >
                    <div className="aspect-square w-full rounded-2xl overflow-hidden mb-3 shadow-md">
                      <img src={INGREDIENT_IMAGES[m.name]} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="font-black text-navy uppercase text-[9px] text-center leading-tight">{m.name}</p>
                    {isSelected && <div className="absolute top-2 right-2 text-gold animate-bounce"><i className="fas fa-check-circle"></i></div>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. Toppings Premium (COM IMAGENS REAIS E DEFINITIVAS) */}
          <section>
            <div className="flex items-center space-x-4 mb-6">
              <span className="bg-navy text-gold w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-md italic">5</span>
              <h3 className="text-navy font-black text-xl uppercase italic text-red-600">Finalização: Toppings Premium</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {INGREDIENTS.toppings.map(t => {
                const isSelected = selections.toppings.some(i => i.name === t.name);
                return (
                  <button 
                    key={t.name}
                    onClick={() => toggleItem('toppings', t)}
                    className={`group relative flex flex-col p-3 rounded-[2rem] border-4 transition-all duration-500 overflow-hidden ${isSelected ? 'border-gold bg-white shadow-2xl scale-[1.08] z-10' : 'border-transparent bg-white/50 hover:bg-white hover:scale-105'}`}
                  >
                    <div className="aspect-square w-full rounded-[1.5rem] overflow-hidden mb-3 relative shadow-lg">
                      <img 
                        src={INGREDIENT_IMAGES[t.name] || INGREDIENT_IMAGES["Default"]} 
                        alt={t.name} 
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" 
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-navy/40 flex items-center justify-center animate-in fade-in zoom-in">
                          <div className="bg-gold text-navy w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 border-white">
                            <i className="fas fa-check text-xl"></i>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center px-2">
                      <p className="font-black text-navy uppercase text-[10px] leading-tight mb-1">{t.name}</p>
                      <p className="font-black text-green-700 text-xs tracking-tighter">R$ {t.price.toFixed(2)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

        </div>

        {/* Footer de Fechamento */}
        <div className="bg-white border-t-4 border-gold p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 z-50 shadow-[0_-15px_30px_rgba(0,0,0,0.15)]">
          <div className="text-center sm:text-left">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Investimento Imperial</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-black text-navy">R$</span>
              <span className="text-4xl sm:text-5xl font-black text-navy tracking-tighter">{totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={handleFinish}
            className="w-full sm:w-auto bg-green-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl uppercase shadow-xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center space-x-4 group/btn"
          >
            <i className="fas fa-check-double text-xl group-hover/btn:scale-125 transition-transform"></i>
            <span>CONFIRMAR OBRA-PRIMA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDogBuilder;
