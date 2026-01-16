
import React, { useState } from 'react';
import { CartItem } from '../types';
import CheckoutModal from './CheckoutModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, delta: number) => void;
  onCheckout: (items: CartItem[], total: number, deliveryInfo?: any, paymentMethod?: string, observation?: string) => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onRemove, onUpdateQuantity, onCheckout }) => {
  const [animatingId, setAnimatingId] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleUpdateQuantity = (id: number, delta: number) => {
    setAnimatingId(id);
    onUpdateQuantity(id, delta);
    setTimeout(() => setAnimatingId(null), 300);
  };

  if (!isOpen) return null;

  const handleFinishClick = () => {
    setShowCheckout(true);
  };

  const handleConfirmOrder = (deliveryInfo: any, paymentMethod: string, adicionaisTotal?: number, observation?: string) => {
    const totalComAdicionais = total + (deliveryInfo.deliveryFee || 0) + (adicionaisTotal || 0);
    onCheckout(items, totalComAdicionais, { ...deliveryInfo, observation }, paymentMethod, observation);
    setShowCheckout(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] overflow-hidden">
        <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="absolute inset-y-0 right-0 max-w-full flex">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l-4 border-gold">

            <div className="px-6 py-6 bg-navy text-white flex items-center justify-between border-b-4 border-gold">
              <div className="flex items-center space-x-4">
                <i className="fas fa-shopping-basket text-3xl text-gold"></i>
                <h2 className="text-2xl font-black uppercase tracking-tight italic">Minha Sacola</h2>
              </div>
              <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50 no-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-cart-plus text-4xl text-gray-300"></i>
                  </div>
                  <p className="text-navy font-black text-xl mb-4 uppercase italic">Sua sacola está vazia</p>
                  <button onClick={onClose} className="bg-navy text-gold px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">EXPLORAR MENU</button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-[2rem] border-2 border-gray-100 shadow-sm flex flex-col space-y-4 group hover:border-gold/30 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-50 flex-shrink-0">
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-navy text-base leading-tight uppercase italic line-clamp-1">{item.name}</h4>
                        <p className="text-green-700 font-black text-lg">R$ {item.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-red-600 w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-center bg-gray-50 p-2 rounded-2xl">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="bg-white border-2 border-navy/10 text-navy h-10 rounded-xl flex items-center justify-center hover:bg-navy hover:text-white transition-all active:scale-90"
                      >
                        <i className="fas fa-minus text-xs"></i>
                      </button>

                      <div className={`text-center font-black text-navy text-xl transition-all duration-300 ${animatingId === item.id ? 'scale-125 text-gold' : 'scale-100'}`}>
                        {item.quantity}
                      </div>

                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="bg-navy text-white h-10 rounded-xl flex items-center justify-center hover:bg-gold hover:text-navy transition-all active:scale-90"
                      >
                        <i className="fas fa-plus text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-white border-t-4 border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total do Pedido</span>
                    <span className="text-4xl font-black text-navy tracking-tighter">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="bg-gold/10 px-4 py-2 rounded-xl border border-gold/30">
                    <span className="text-navy font-black text-[10px] uppercase">{items.length} ITENS</span>
                  </div>
                </div>
                <button
                  onClick={handleFinishClick}
                  className="w-full bg-green-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase shadow-xl hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                  <i className="fas fa-lock text-sm opacity-50"></i>
                  <span>FINALIZAR PEDIDO</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          items={items}
          total={total}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmOrder}
        />
      )}
    </>
  );
};

export default CartDrawer;
