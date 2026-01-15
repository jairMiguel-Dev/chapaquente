
import React from 'react';
import { Order } from '../types';

interface OrderHistoryProps {
    orders: Order[];
    onClose: () => void;
    userName: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    recebido: { label: 'Na Fila', color: 'bg-orange-100 text-orange-700', icon: 'fa-clock' },
    preparando: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-700', icon: 'fa-fire-burner' },
    pronto: { label: 'Pronto!', color: 'bg-green-100 text-green-700', icon: 'fa-bell-concierge' },
    entregue: { label: 'Retirado', color: 'bg-gray-100 text-gray-700', icon: 'fa-check-circle' },
};

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders, onClose, userName }) => {
    const formatDate = (date: Date | string): string => {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (value: number): string => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Filtra apenas pedidos do usuário atual
    const userOrders = orders.filter(o => o.customerName === userName);

    // Ordena por data (mais recente primeiro)
    const sortedOrders = [...userOrders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calcula totais
    const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);
    const totalOrders = userOrders.length;

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">

                {/* Header */}
                <div className="bg-navy p-6 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-navy text-xl font-black">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic">Meus Pedidos</h2>
                            <p className="text-gold text-[10px] tracking-widest uppercase font-bold">Olá, {userName}!</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:text-gold transition-colors text-2xl">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Stats do Usuário */}
                <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 border-b border-gray-100 shrink-0">
                    <div className="bg-white p-4 rounded-2xl text-center shadow-sm border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total de Pedidos</p>
                        <p className="text-3xl font-black text-navy">{totalOrders}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl text-center shadow-sm border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Investido</p>
                        <p className="text-2xl font-black text-green-600">{formatCurrency(totalSpent)}</p>
                    </div>
                </div>

                {/* Lista de Pedidos */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {sortedOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-shopping-bag text-gray-300 text-3xl"></i>
                            </div>
                            <p className="text-gray-400 font-black uppercase text-sm">Nenhum pedido ainda</p>
                            <p className="text-gray-300 text-xs mt-2">Faça seu primeiro pedido e ele aparecerá aqui!</p>
                        </div>
                    ) : (
                        sortedOrders.map((order) => {
                            const status = statusLabels[order.status] || statusLabels.recebido;
                            return (
                                <div
                                    key={order.id}
                                    className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-gold/30 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                {formatDate(order.createdAt)}
                                            </p>
                                            <p className="text-lg font-black text-navy">Pedido #{order.id}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${status.color} flex items-center space-x-1`}>
                                            <i className={`fas ${status.icon}`}></i>
                                            <span>{status.label}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600">
                                                    <span className="font-black text-navy">{item.quantity}x</span> {item.name}
                                                </span>
                                                <span className="font-bold text-gray-500">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Total</span>
                                        <span className="text-xl font-black text-navy">{formatCurrency(order.total)}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer com ações */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-navy text-gold py-4 rounded-2xl font-black uppercase text-sm hover:bg-navy/90 transition-all"
                    >
                        Voltar ao Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderHistory;
