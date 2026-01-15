
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import InvoiceModal from './InvoiceModal';

interface OrderTrackerProps {
  order: Order;
  onClose: () => void;
  queuePosition?: number; // Posição na fila (0 = sendo preparado agora)
}

const statusConfig: Record<OrderStatus, { label: string; icon: string; color: string; bgColor: string }> = {
  recebido: {
    label: 'Na Fila',
    icon: 'fa-clock',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  preparando: {
    label: 'Preparando',
    icon: 'fa-fire-burner',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  },
  pronto: {
    label: 'Pronto!',
    icon: 'fa-bell-concierge',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  entregue: {
    label: 'Retirado',
    icon: 'fa-check-circle',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
};

const OrderTracker: React.FC<OrderTrackerProps> = ({ order, onClose, queuePosition = 0 }) => {
  const [showInvoice, setShowInvoice] = useState(false);
  const config = statusConfig[order.status];

  // Calcular quantos estão na frente
  const aheadInQueue = order.status === 'recebido' ? queuePosition : 0;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-navy/80 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-navy p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase italic">Acompanhe seu Pedido</h2>
            <p className="text-gold text-[10px] tracking-widest uppercase mt-1 font-bold">
              Senha: #{order.id}
            </p>
          </div>
          <button onClick={onClose} className="hover:text-gold transition-colors text-2xl">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Status Principal */}
          <div className={`${config.bgColor} rounded-3xl p-8 text-center mb-6`}>
            <div className={`w-20 h-20 ${config.bgColor} ${config.color} rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg`}>
              <i className={`fas ${config.icon} text-3xl`}></i>
            </div>
            <h3 className={`text-3xl font-black uppercase italic ${config.color}`}>
              {config.label}
            </h3>

            {/* Mensagem Inteligente baseada na Fila */}
            {order.status === 'recebido' && (
              <div className="mt-4">
                {aheadInQueue === 0 ? (
                  // Sem pedidos na frente - preparando agora!
                  <div className="bg-white/80 rounded-2xl p-4 border-2 border-green-200">
                    <p className="text-green-700 font-bold text-lg">
                      <i className="fas fa-fire mr-2 text-orange-500"></i>
                      Estamos preparando seu pedido!
                    </p>
                    <p className="text-green-600/80 text-sm mt-1">
                      Já está na chapa! 🔥
                    </p>
                  </div>
                ) : (
                  // Há pedidos na frente
                  <div className="bg-white/80 rounded-2xl p-4 border-2 border-orange-200">
                    <p className="text-orange-700 font-bold text-lg">
                      <i className="fas fa-hourglass-half mr-2"></i>
                      Logo o seu já sai!
                    </p>
                    <p className="text-orange-600/80 text-sm mt-2">
                      {aheadInQueue === 1
                        ? 'Finalizando 1 pedido, o seu é o próximo!'
                        : `Finalizando ${aheadInQueue} pedidos, já já é a sua vez!`}
                    </p>
                    <div className="mt-3 flex items-center justify-center space-x-1">
                      {[...Array(Math.min(aheadInQueue, 5))].map((_, i) => (
                        <div key={i} className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}></div>
                      ))}
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-bounce ml-2"></div>
                    </div>
                    <p className="text-orange-500 text-[10px] uppercase tracking-widest mt-2">
                      🔥 Você está na fila
                    </p>
                  </div>
                )}
              </div>
            )}

            {order.status === 'preparando' && (
              <div className="mt-4 bg-white/80 rounded-2xl p-4 border-2 border-amber-200">
                <p className="text-amber-700 font-bold text-lg animate-pulse">
                  <i className="fas fa-fire-burner mr-2"></i>
                  Seu lanche está na chapa agora!
                </p>
                <p className="text-amber-600/80 text-sm mt-1">
                  Preparando com todo carinho 🌭
                </p>
              </div>
            )}

            {order.status === 'pronto' && (
              <div className="mt-4">
                <p className="text-green-700 font-bold text-lg animate-pulse">
                  <i className="fas fa-hand-sparkles mr-2"></i>
                  Retire no balcão!
                </p>
                <div className="mt-3 bg-green-200 rounded-xl py-3 px-6 inline-block">
                  <span className="text-green-800 font-black text-2xl">
                    SENHA #{order.id}
                  </span>
                </div>
              </div>
            )}

            {order.status === 'entregue' && (
              <p className="text-gray-600/80 mt-4 font-medium">
                Obrigado pela preferência! Volte sempre! 💛
              </p>
            )}
          </div>

          {/* Itens do Pedido */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h4 className="font-black text-navy mb-3 flex items-center uppercase text-xs">
              <i className="fas fa-receipt mr-2 text-gold"></i> Seu Pedido
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    <span className="font-black text-navy">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="font-bold text-navy">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-dashed border-gray-200 mt-3 pt-3 flex justify-between items-center">
              <span className="font-black text-navy uppercase text-sm">Total</span>
              <span className="text-xl font-black text-navy">R$ {order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Modo de Entrega */}
          <div className={`rounded-2xl p-4 border-2 mt-4 ${order.deliveryMode === 'pickup' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.deliveryMode === 'pickup' ? 'bg-green-500' : 'bg-blue-500'}`}>
                <i className={`fas ${order.deliveryMode === 'pickup' ? 'fa-store' : 'fa-motorcycle'} text-white`}></i>
              </div>
              <div className="flex-1">
                <p className={`font-black text-sm ${order.deliveryMode === 'pickup' ? 'text-green-700' : 'text-blue-700'}`}>
                  {order.deliveryMode === 'pickup' ? '🏪 Retirada no Local' : '🏠 Entrega em Casa'}
                </p>
                {order.deliveryMode === 'delivery' && order.deliveryAddress && (
                  <p className="text-blue-600 text-xs mt-1">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {order.deliveryAddress}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botão Nota Fiscal */}
          <button
            onClick={() => setShowInvoice(true)}
            className="w-full mt-4 bg-gray-100 text-navy py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center space-x-2 hover:bg-gray-200 transition-all"
          >
            <i className="fas fa-file-invoice"></i>
            <span>Ver Nota Fiscal</span>
          </button>
        </div>
      </div>

      {/* Modal da Nota Fiscal */}
      {showInvoice && (
        <InvoiceModal order={order} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  );
};

export default OrderTracker;
