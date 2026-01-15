
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, FinancialStats } from '../types';
import { HOT_DOGS } from '../constants';
import PrinterConfig from './PrinterConfig';
import { printerService } from '../services/BluetoothPrinterService';

interface AdminDashboardProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onClose: () => void;
  stock: Record<number, number>;
  onUpdateStock: (id: number, quantity: number) => void;
}

const statusThemes: Record<OrderStatus, { bg: string; text: string; btn: string; label: string; icon: string }> = {
  recebido: { bg: 'bg-orange-50', text: 'text-orange-700', btn: 'bg-orange-600', label: 'NA FILA', icon: 'fa-clock' },
  preparando: { bg: 'bg-yellow-50', text: 'text-yellow-700', btn: 'bg-yellow-500', label: 'NA CHAPA', icon: 'fa-fire' },
  pronto: { bg: 'bg-green-50', text: 'text-green-700', btn: 'bg-green-600', label: 'PRONTO!', icon: 'fa-bell-concierge' },
  entregue: { bg: 'bg-gray-50', text: 'text-gray-500', btn: 'bg-gray-400', label: 'RETIRADO', icon: 'fa-check-double' },
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, onUpdateStatus, onClose, stock, onUpdateStock }) => {
  const [activeTab, setActiveTab] = useState<'operacional' | 'lucros' | 'estoque'>('operacional');
  const [showPrinterConfig, setShowPrinterConfig] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(printerService.getConnectionStatus().isConnected);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0));
    const startOfWeek = new Date(new Date(now).setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.reduce((acc, order) => {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= startOfDay) acc.daily += order.total;
      if (orderDate >= startOfWeek) acc.weekly += order.total;
      if (orderDate >= startOfMonth) acc.monthly += order.total;
      acc.totalOrders += 1;
      return acc;
    }, { daily: 0, weekly: 0, monthly: 0, totalOrders: 0 } as FinancialStats);
  }, [orders]);

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const sequence: OrderStatus[] = ['recebido', 'preparando', 'pronto', 'entregue'];
    const idx = sequence.indexOf(current);
    return idx < sequence.length - 1 ? sequence[idx + 1] : null;
  };

  const handleEmitSefaz = (order: Order) => {
    const key = Math.random().toString().slice(2, 14).match(/.{1,4}/g)?.join('-') || "KEY-ERROR";
    alert(`✅ NOTA FISCAL EMITIDA!\n\nPedido: #${order.id}\nChave Sefaz: ${key}\n\nO cliente receberá o link no WhatsApp automaticamente.`);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-gray-100 flex flex-col font-sans">
      {/* Topbar Simplificada */}
      <header className="bg-navy p-4 md:p-6 flex flex-col md:flex-row items-center justify-between border-b-8 border-gold shadow-xl gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white rounded-2xl p-1 shadow-lg flex-shrink-0">
            <img src="https://c787596d03d324b10b0789710f6396f9.cdn.bubble.io/f1741103635749x379564850785124160/image.jpg" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic leading-none">Painel do <span className="text-gold">Dono</span></h1>
            <p className="text-gold/60 text-[10px] font-bold uppercase tracking-widest mt-1">Gerencie sua loja de forma fácil</p>
          </div>
        </div>

        <nav className="flex bg-white/10 p-1 rounded-2xl border border-white/10 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('operacional')}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center space-x-2 whitespace-nowrap ${activeTab === 'operacional' ? 'bg-gold text-navy shadow-lg' : 'text-white hover:bg-white/5'}`}
          >
            <i className="fas fa-list-check"></i>
            <span>Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab('estoque')}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center space-x-2 whitespace-nowrap ${activeTab === 'estoque' ? 'bg-gold text-navy shadow-lg' : 'text-white hover:bg-white/5'}`}
          >
            <i className="fas fa-boxes-stacked"></i>
            <span>Estoque</span>
          </button>
          <button
            onClick={() => setActiveTab('lucros')}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all flex items-center justify-center space-x-2 whitespace-nowrap ${activeTab === 'lucros' ? 'bg-gold text-navy shadow-lg' : 'text-white hover:bg-white/5'}`}
          >
            <i className="fas fa-hand-holding-dollar"></i>
            <span>Financeiro</span>
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {/* Botão Impressora */}
          <button
            onClick={() => setShowPrinterConfig(true)}
            className={`px-4 py-3 rounded-xl font-black text-xs uppercase flex items-center space-x-2 transition-all shadow-lg ${printerConnected
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            title="Configurar Impressora"
          >
            <i className="fas fa-print"></i>
            <span className="hidden md:inline">{printerConnected ? 'Impressora OK' : 'Impressora'}</span>
          </button>

          <button onClick={onClose} className="bg-red-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center space-x-2 hover:bg-red-600 transition-all shadow-lg">
            <i className="fas fa-sign-out-alt"></i>
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100">
        {activeTab === 'operacional' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Legenda de Fluxo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(['recebido', 'preparando', 'pronto', 'entregue'] as OrderStatus[]).map(s => (
                <div key={s} className={`p-4 rounded-3xl border-2 flex items-center justify-center space-x-3 ${statusThemes[s].bg} ${statusThemes[s].text} border-current/10 shadow-sm`}>
                  <i className={`fas ${statusThemes[s].icon}`}></i>
                  <span className="font-black text-[10px] uppercase tracking-widest">{statusThemes[s].label}</span>
                  <span className="bg-white/50 px-2 py-0.5 rounded-lg text-xs">{orders.filter(o => o.status === s).length}</span>
                </div>
              ))}
            </div>

            {/* Listagem de Pedidos em Cards Grandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders
                .filter(o => o.status !== 'entregue')
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map(order => {
                  const theme = statusThemes[order.status];
                  const next = getNextStatus(order.status);
                  return (
                    <div key={order.id} className="bg-white rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-gold transition-all overflow-hidden flex flex-col">
                      <div className={`p-6 ${theme.bg} ${theme.text} flex justify-between items-center border-b border-black/5`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl ${theme.btn} text-white flex items-center justify-center shadow-lg`}>
                            <i className={`fas ${theme.icon}`}></i>
                          </div>
                          <div>
                            <p className="font-black text-xs uppercase leading-none">{theme.label}</p>
                            <p className="text-[10px] font-bold opacity-60">Pedido #{order.id}</p>
                            {order.status === 'recebido' && (
                              <p className="text-[9px] font-black text-red-600 uppercase mt-1">
                                <i className="fas fa-hourglass-half mr-1"></i> Aguardando Fila
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black tracking-tighter">R$ {order.total.toFixed(2)}</p>
                          <p className="text-[9px] font-bold uppercase">{order.customerName || 'Cliente'}</p>
                          {/* Badge de Entrega/Retirada */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[8px] font-black uppercase mt-1 ${order.deliveryMode === 'pickup'
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white'
                            }`}>
                            <i className={`fas ${order.deliveryMode === 'pickup' ? 'fa-store' : 'fa-motorcycle'} mr-1`}></i>
                            {order.deliveryMode === 'pickup' ? 'RETIRADA' : 'ENTREGA'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 flex-1 space-y-4">
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">O que preparar:</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm text-navy font-bold"><span className="text-red-600 font-black">{item.quantity}x</span> {item.name}</span>
                              {item.customDescription && <i className="fas fa-magic text-gold text-[10px]" title="Item Customizado"></i>}
                            </div>
                          ))}
                        </div>

                        {/* Informação de Entrega/Retirada */}
                        <div className={`rounded-2xl p-4 border-2 ${order.deliveryMode === 'pickup' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${order.deliveryMode === 'pickup' ? 'bg-green-500' : 'bg-blue-500'}`}>
                              <i className={`fas ${order.deliveryMode === 'pickup' ? 'fa-store' : 'fa-motorcycle'} text-white text-lg`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-black text-sm uppercase ${order.deliveryMode === 'pickup' ? 'text-green-700' : 'text-blue-700'}`}>
                                {order.deliveryMode === 'pickup' ? '🏪 RETIRAR NO LOCAL' : '🏠 ENTREGA'}
                              </p>
                              {order.deliveryMode === 'delivery' && order.deliveryAddress && (
                                <p className="text-blue-600 text-xs mt-1 truncate" title={order.deliveryAddress}>
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {order.deliveryAddress}
                                </p>
                              )}
                              {order.deliveryMode === 'delivery' && order.deliveryFee && order.deliveryFee > 0 && (
                                <p className="text-blue-500 text-[10px] mt-1">
                                  Taxa: R$ {order.deliveryFee.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEmitSefaz(order)}
                            className="flex-1 bg-navy text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center space-x-2 hover:bg-navy/90 transition-all border-b-4 border-black/20"
                          >
                            <i className="fas fa-file-invoice"></i>
                            <span>Emitir Nota</span>
                          </button>

                          {next && (
                            <button
                              onClick={() => onUpdateStatus(order.id, next)}
                              className={`flex-[2] ${statusThemes[next].btn} text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center space-x-2 animate-pulse hover:animate-none transition-all border-b-4 border-black/20`}
                            >
                              <span>AVANÇAR PARA: {statusThemes[next].label}</span>
                              <i className="fas fa-arrow-right"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {orders.filter(o => o.status !== 'entregue').length === 0 && (
                <div className="col-span-full py-20 bg-white rounded-[3rem] text-center border-4 border-dashed border-gray-200">
                  <i className="fas fa-mug-hot text-gray-200 text-6xl mb-6"></i>
                  <h3 className="text-2xl font-black text-gray-300 uppercase italic">Nenhum pedido pendente</h3>
                  <p className="text-gray-400 font-bold">Relaxe um pouco ou aproveite para conferir os lucros!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'estoque' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden">
              <div className="p-10 bg-navy text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-3xl font-black uppercase italic mb-2">Controle de <span className="text-gold">Estoque</span></h2>
                  <p className="text-gold/60 text-xs font-bold uppercase tracking-widest">Defina a quantidade disponível para cada item</p>
                </div>
                <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/10 text-center">
                  <p className="text-gold font-black text-2xl leading-none">{HOT_DOGS.length}</p>
                  <p className="text-[9px] font-bold uppercase opacity-60">Produtos Ativos</p>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {HOT_DOGS.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 rounded-3xl p-6 border-2 border-transparent hover:border-gold/30 transition-all group">
                      <div className="flex items-center space-x-4 mb-6">
                        <img src={item.image} className="w-16 h-16 rounded-2xl object-cover shadow-lg" alt={item.name} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-navy font-black uppercase text-xs truncate leading-tight">{item.name}</h4>
                          <p className="text-gray-400 text-[10px] font-bold uppercase italic">{item.category}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-navy/40 uppercase tracking-widest block text-center">Quantidade no Estoque</label>
                        <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-inner border border-black/5">
                          <button
                            onClick={() => onUpdateStock(item.id, Math.max(0, (stock[item.id] || 0) - 1))}
                            className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all font-black"
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <input
                            type="number"
                            value={stock[item.id] || 0}
                            onChange={(e) => onUpdateStock(item.id, parseInt(e.target.value) || 0)}
                            className="bg-transparent text-center font-black text-2xl text-navy w-20 outline-none"
                          />
                          <button
                            onClick={() => onUpdateStock(item.id, (stock[item.id] || 0) + 1)}
                            className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all font-black"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <div className={`text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${(stock[item.id] || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {(stock[item.id] || 0) > 0 ? 'Disponível para Venda' : 'Esgotado no Cardápio'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lucros' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Cards Financeiros para Leigos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'O que entrou HOJE', val: stats.daily, desc: 'Dinheiro no caixa hoje', icon: 'fa-sun', color: 'bg-green-600' },
                { label: 'O que entrou na SEMANA', val: stats.weekly, desc: 'Soma dos últimos 7 dias', icon: 'fa-calendar-week', color: 'bg-blue-600' },
                { label: 'O que entrou no MÊS', val: stats.monthly, desc: 'Seu faturamento mensal', icon: 'fa-chart-pie', color: 'bg-purple-600' },
              ].map(card => (
                <div key={card.label} className="bg-white p-8 rounded-[3rem] shadow-xl border-b-8 border-navy/5 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-5 rounded-bl-full`}></div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`w-12 h-12 ${card.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                      <i className={`fas ${card.icon} text-xl`}></i>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-navy/40 uppercase tracking-widest leading-none">{card.label}</h4>
                      <p className="text-gray-400 text-[9px] font-bold uppercase">{card.desc}</p>
                    </div>
                  </div>
                  <p className="text-5xl font-black text-navy tracking-tighter">
                    <span className="text-xl mr-2">R$</span>{card.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>

            {/* Painel de Volume */}
            <div className="bg-navy p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-gold font-black text-4xl uppercase italic leading-tight">Você já serviu <br /> <span className="text-white text-6xl">{stats.totalOrders}</span> <br /> Clientes Famintos!</h3>
                </div>
                <div className="w-full md:w-1/2 bg-white/5 rounded-3xl p-6 border border-white/10">
                  <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em] mb-6">Seu Crescimento Anual</p>
                  <div className="h-40 flex items-end space-x-3">
                    {[30, 45, 25, 60, 80, 55, 90, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-gold rounded-t-xl opacity-20 hover:opacity-100 transition-all cursor-help relative group" style={{ height: `${h}%` }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-navy font-black text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                          Mês {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de Vendas */}
            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden">
              <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center">
                    <i className="fas fa-history text-gold"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-navy uppercase text-sm">Histórico de Vendas</h3>
                    <p className="text-gray-400 text-[9px] uppercase">Todos os pedidos registrados</p>
                  </div>
                </div>
                <span className="bg-navy text-gold px-4 py-2 rounded-xl text-[10px] font-black">
                  {orders.length} PEDIDOS
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="fas fa-inbox text-gray-200 text-5xl mb-4"></i>
                    <p className="text-gray-400 font-black uppercase text-sm">Nenhum pedido ainda</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="text-left p-4">Data</th>
                        <th className="text-left p-4">Pedido</th>
                        <th className="text-left p-4">Cliente</th>
                        <th className="text-left p-4">Itens</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-right p-4">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((order) => {
                          const theme = statusThemes[order.status];
                          return (
                            <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <p className="text-navy font-bold text-xs">
                                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                                <p className="text-gray-400 text-[9px]">
                                  {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </td>
                              <td className="p-4">
                                <span className="text-navy font-black text-xs">#{order.id}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-gray-600 text-xs font-bold">{order.customerName || 'Visitante'}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-gray-500 text-xs">
                                  {order.items.length > 0
                                    ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').substring(0, 40) + (order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').length > 40 ? '...' : '')
                                    : '-'
                                  }
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${theme.bg} ${theme.text}`}>
                                  {theme.label}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <span className="text-navy font-black text-sm">
                                  R$ {order.total.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer de Suporte */}
      <footer className="bg-white p-4 border-t border-gray-200 text-center">
        <p className="text-[10px] font-black text-navy/20 uppercase tracking-widest flex items-center justify-center space-x-2">
          <i className="fas fa-headset text-gold"></i>
          <span>Precisa de ajuda com o sistema? Ligue para o Suporte VIP: 0800-CHAPA-HOT</span>
        </p>
      </footer>

      {/* Modal de Configuração de Impressora */}
      {showPrinterConfig && (
        <PrinterConfig
          onClose={() => {
            setShowPrinterConfig(false);
            setPrinterConnected(printerService.getConnectionStatus().isConnected);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
