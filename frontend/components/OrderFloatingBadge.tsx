
import React from 'react';
import { Order, OrderStatus } from '../types';

interface OrderFloatingBadgeProps {
    order: Order;
    onOpenTracker: () => void;
    queuePosition?: number;
}

const OrderFloatingBadge: React.FC<OrderFloatingBadgeProps> = ({ order, onOpenTracker, queuePosition = 0 }) => {
    const getStatusLabel = (): string => {
        switch (order.status) {
            case 'recebido':
                return queuePosition > 0
                    ? `${queuePosition} na frente`
                    : 'Preparando!';
            case 'preparando': return 'Na Chapa 🔥';
            case 'pronto': return 'PRONTO! 🔔';
            default: return '';
        }
    };

    const getStatusIcon = (): string => {
        switch (order.status) {
            case 'recebido': return 'fa-clock';
            case 'preparando': return 'fa-fire-burner';
            case 'pronto': return 'fa-bell-concierge';
            default: return 'fa-check';
        }
    };

    const getStatusColor = (): string => {
        switch (order.status) {
            case 'recebido':
                // Verde se é o primeiro (está sendo preparado), laranja se está na fila
                return queuePosition > 0 ? 'bg-orange-500' : 'bg-green-500';
            case 'preparando': return 'bg-amber-500';
            case 'pronto': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    // Não mostrar se já foi retirado
    if (order.status === 'entregue') return null;

    return (
        <button
            onClick={onOpenTracker}
            className={`fixed bottom-24 right-6 z-[100] ${order.status === 'pronto' ? 'bg-green-500 animate-bounce' : 'bg-gold'} text-navy rounded-2xl shadow-2xl flex items-center overflow-hidden border-b-4 ${order.status === 'pronto' ? 'border-green-700' : 'border-navy/20'} group hover:scale-105 transition-all`}
            title="Ver status do pedido"
        >
            {/* Ícone de Status */}
            <div className={`${getStatusColor()} text-white px-4 py-4 flex flex-col items-center justify-center`}>
                <i className={`fas ${getStatusIcon()} text-2xl ${order.status === 'pronto' ? 'animate-pulse' : ''}`}></i>
            </div>

            {/* Info */}
            <div className="px-4 py-3 flex items-center space-x-3">
                <div className="text-left">
                    <p className={`text-[8px] font-black uppercase tracking-widest ${order.status === 'pronto' ? 'text-white/80' : 'opacity-60'}`}>
                        Senha #{order.id}
                    </p>
                    <p className={`text-sm font-black uppercase leading-tight ${order.status === 'pronto' ? 'text-white' : ''}`}>
                        {getStatusLabel()}
                    </p>
                </div>
                <i className={`fas fa-chevron-right ${order.status === 'pronto' ? 'text-white/50' : 'text-navy/30'} group-hover:text-navy transition-colors ml-1`}></i>
            </div>
        </button>
    );
};

export default OrderFloatingBadge;
