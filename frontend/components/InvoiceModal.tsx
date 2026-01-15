
import React from 'react';
import { Order } from '../types';
import { OFFICIAL_LOGO_URL } from '../constants';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

/**
 * Componente de Nota Fiscal Digital Simulada
 * 
 * ARQUITETURA PARA BACKEND FUTURO:
 * - Este componente exibe dados simulados localmente
 * - No futuro, substituir `generateInvoiceData()` por:
 *   GET /api/invoices/:orderId -> retorna NF real do SEFAZ
 * - A chave de acesso virá do backend após integração com SEFAZ
 * - Campos como CNPJ, IE, série serão configuráveis via API
 */

// Gera dados simulados da NF (será substituído por API no futuro)
const generateInvoiceData = (order: Order) => {
  const now = new Date();
  const invoiceNumber = Math.floor(Math.random() * 900000) + 100000;
  const seriesNumber = 1;

  // Chave de acesso simulada (44 dígitos - padrão SEFAZ)
  const accessKey = Array.from({ length: 11 }, () =>
    Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  ).join('');

  // Protocolo de autorização simulado
  const authProtocol = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;

  return {
    // Dados do Emitente (Restaurante)
    emitter: {
      name: 'CHAPA QUENTE DOG LANCHES LTDA',
      tradeName: 'Chapa Quente',
      cnpj: '12.345.678/0001-90',
      ie: '123.456.789.012',
      address: 'Av. Paulista, 1000 - Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      cep: '01310-100',
      phone: '(11) 99999-9999',
    },
    // Dados da NF-e
    invoice: {
      number: invoiceNumber,
      series: seriesNumber,
      model: 65, // NFC-e (Nota Fiscal de Consumidor Eletrônica)
      issueDate: now,
      accessKey: accessKey,
      authProtocol: authProtocol,
      authDate: now,
      qrCodeUrl: `https://nfce.fazenda.sp.gov.br/qrcode?p=${accessKey}`,
    },
    // Dados do Consumidor
    consumer: {
      name: order.customerName || 'CONSUMIDOR NÃO IDENTIFICADO',
      cpf: null, // CPF na nota é opcional
    },
    // Totais
    totals: {
      subtotal: order.total,
      discount: 0,
      total: order.total,
    },
    // Forma de Pagamento
    payment: {
      method: order.paymentMethod || 'Não informado',
      methodLabel: getPaymentLabel(order.paymentMethod),
    },
  };
};

const getPaymentLabel = (method?: string): string => {
  const labels: Record<string, string> = {
    pix: 'PIX',
    credito: 'Cartão de Crédito',
    debito: 'Cartão de Débito',
  };
  return labels[method || ''] || 'Dinheiro';
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (date: Date): string => {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatAccessKey = (key: string): string => {
  // Formata a chave em grupos de 4 dígitos
  return key.match(/.{1,4}/g)?.join(' ') || key;
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const invoiceData = generateInvoiceData(order);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Futuro: GET /api/invoices/:orderId/pdf
    alert('📥 No futuro, aqui será feito o download do XML/PDF oficial da NF-e via integração com SEFAZ.');
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-md max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in duration-300">

        {/* Header */}
        <div className="sticky top-0 bg-navy px-6 py-4 flex justify-between items-center border-b-4 border-gold z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full p-1">
              <img src={OFFICIAL_LOGO_URL} alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h2 className="text-white font-black uppercase text-sm">NFC-e</h2>
              <p className="text-gold text-[9px] uppercase tracking-widest">Documento Fiscal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-gold transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Corpo da Nota Fiscal */}
        <div className="p-6 space-y-6 text-[11px]">

          {/* Cabeçalho da NF */}
          <div className="text-center border-b-2 border-dashed border-gray-200 pb-6">
            <p className="font-black text-navy text-base uppercase">{invoiceData.emitter.tradeName}</p>
            <p className="text-gray-500 font-bold">{invoiceData.emitter.name}</p>
            <p className="text-gray-400">CNPJ: {invoiceData.emitter.cnpj}</p>
            <p className="text-gray-400">IE: {invoiceData.emitter.ie}</p>
            <p className="text-gray-400">{invoiceData.emitter.address}</p>
            <p className="text-gray-400">{invoiceData.emitter.city} - {invoiceData.emitter.state} | CEP: {invoiceData.emitter.cep}</p>
          </div>

          {/* Tipo de Documento */}
          <div className="bg-navy text-white text-center py-3 rounded-2xl">
            <p className="font-black uppercase tracking-widest text-xs">
              Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
            </p>
          </div>

          {/* Dados da NF */}
          <div className="grid grid-cols-2 gap-4 text-center border-b-2 border-dashed border-gray-200 pb-6">
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-gray-400 uppercase text-[9px] font-bold">Nº da NFC-e</p>
              <p className="font-black text-navy text-lg">{invoiceData.invoice.number}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-gray-400 uppercase text-[9px] font-bold">Série</p>
              <p className="font-black text-navy text-lg">{invoiceData.invoice.series.toString().padStart(3, '0')}</p>
            </div>
            <div className="col-span-2 bg-gray-50 p-3 rounded-xl">
              <p className="text-gray-400 uppercase text-[9px] font-bold">Data/Hora de Emissão</p>
              <p className="font-bold text-navy">{formatDate(invoiceData.invoice.issueDate)}</p>
            </div>
          </div>

          {/* Consumidor */}
          <div className="border-b-2 border-dashed border-gray-200 pb-6">
            <p className="text-gray-400 uppercase text-[9px] font-bold mb-1">Consumidor</p>
            <p className="font-bold text-navy">{invoiceData.consumer.name}</p>
            <p className="text-gray-400">CPF: Não informado (consumidor final)</p>
          </div>

          {/* Itens */}
          <div className="border-b-2 border-dashed border-gray-200 pb-6">
            <p className="text-gray-400 uppercase text-[9px] font-bold mb-3">Itens do Pedido</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-start text-[10px]">
                  <div className="flex-1">
                    <p className="font-bold text-navy uppercase">
                      {idx + 1}. {item.name}
                    </p>
                    <p className="text-gray-400">
                      Qtd: {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-black text-navy">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="bg-gold/10 p-4 rounded-2xl border-2 border-gold/30">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500 font-bold">Subtotal</span>
              <span className="font-bold text-navy">{formatCurrency(invoiceData.totals.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-500 font-bold">Descontos</span>
              <span className="font-bold text-navy">{formatCurrency(invoiceData.totals.discount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-gold/30">
              <span className="font-black text-navy uppercase">Total</span>
              <span className="font-black text-navy text-xl">{formatCurrency(invoiceData.totals.total)}</span>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center">
                <i className={`fas ${invoiceData.payment.method === 'pix' ? 'fa-pix' : 'fa-credit-card'} text-gold`}></i>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold">Forma de Pagamento</p>
                <p className="font-black text-navy">{invoiceData.payment.methodLabel}</p>
              </div>
            </div>
            <p className="font-black text-green-600">{formatCurrency(invoiceData.totals.total)}</p>
          </div>

          {/* Modo de Entrega */}
          <div className={`p-4 rounded-2xl border-2 ${order.deliveryMode === 'pickup' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.deliveryMode === 'pickup' ? 'bg-green-600' : 'bg-blue-600'}`}>
                <i className={`fas ${order.deliveryMode === 'pickup' ? 'fa-store' : 'fa-motorcycle'} text-white`}></i>
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-gray-400 uppercase font-bold">Modo de Entrega</p>
                <p className={`font-black ${order.deliveryMode === 'pickup' ? 'text-green-700' : 'text-blue-700'}`}>
                  {order.deliveryMode === 'pickup' ? 'Retirada no Local' : 'Entrega em Domicílio'}
                </p>
                {order.deliveryMode === 'delivery' && order.deliveryAddress && (
                  <p className="text-blue-600 text-[10px] mt-1">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {order.deliveryAddress}
                  </p>
                )}
                {order.deliveryFee && order.deliveryFee > 0 && (
                  <p className="text-blue-500 text-[10px] mt-1">
                    Taxa de entrega: {formatCurrency(order.deliveryFee)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Simulado */}
          <div className="text-center border-t-2 border-dashed border-gray-200 pt-6">
            <div className="inline-block bg-white p-4 border-2 border-gray-200 rounded-2xl mb-3">
              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded-xl">
                <i className="fas fa-qrcode text-5xl text-gray-300"></i>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">
              Consulte pela Chave de Acesso em:
            </p>
            <p className="text-[9px] text-navy font-bold">www.nfce.fazenda.sp.gov.br/consulta</p>
          </div>

          {/* Chave de Acesso */}
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-[9px] text-gray-400 uppercase font-bold mb-2 text-center">
              Chave de Acesso
            </p>
            <p className="text-[8px] font-mono text-navy text-center leading-relaxed break-all">
              {formatAccessKey(invoiceData.invoice.accessKey)}
            </p>
          </div>

          {/* Protocolo de Autorização SEFAZ */}
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded-2xl">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
              <p className="text-green-700 font-black uppercase text-xs">NFC-e Autorizada</p>
            </div>
            <div className="text-center text-[9px]">
              <p className="text-gray-500 font-bold">Protocolo de Autorização SEFAZ</p>
              <p className="font-mono text-green-700 font-bold">{invoiceData.invoice.authProtocol}</p>
              <p className="text-gray-400 mt-1">Data: {formatDate(invoiceData.invoice.authDate)}</p>
            </div>
          </div>

          {/* Rodapé Legal */}
          <div className="text-center text-[8px] text-gray-400 leading-relaxed">
            <p className="uppercase font-bold mb-1">Informações Adicionais de Interesse do Fisco</p>
            <p>Documento emitido por ME ou EPP optante pelo Simples Nacional.</p>
            <p>Não gera direito a crédito fiscal de IPI.</p>
          </div>

          {/* Ações */}
          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleDownload}
              className="flex-1 bg-gray-100 text-navy py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2 hover:bg-gray-200 transition-all"
            >
              <i className="fas fa-download"></i>
              <span>Baixar XML</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-navy text-gold py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center space-x-2 hover:bg-navy/90 transition-all"
            >
              <i className="fas fa-print"></i>
              <span>Imprimir</span>
            </button>
          </div>

          {/* Aviso de Simulação (remover em produção) */}
          <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-2xl text-center">
            <p className="text-yellow-700 font-black text-[10px] uppercase flex items-center justify-center space-x-2">
              <i className="fas fa-flask"></i>
              <span>Ambiente de Demonstração</span>
            </p>
            <p className="text-yellow-600 text-[9px] mt-1">
              Esta é uma simulação para apresentação. A integração com SEFAZ será implementada no backend.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
