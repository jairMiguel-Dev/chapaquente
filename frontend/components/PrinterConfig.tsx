
import React, { useState, useEffect } from 'react';
import { printerService, PrinterConnection } from '../services/BluetoothPrinterService';

interface PrinterConfigProps {
    onClose: () => void;
}

const PrinterConfig: React.FC<PrinterConfigProps> = ({ onClose }) => {
    const [connection, setConnection] = useState<PrinterConnection>(printerService.getConnectionStatus());
    const [isConnecting, setIsConnecting] = useState(false);
    const [autoPrint, setAutoPrint] = useState(() => {
        return localStorage.getItem('chapa_quente_auto_print') === 'true';
    });

    useEffect(() => {
        // Callback para mudanças de conexão
        printerService.setConnectionCallback((connected, deviceName) => {
            setConnection({
                ...printerService.getConnectionStatus(),
                isConnected: connected,
                deviceName: deviceName || ''
            });
        });

        return () => {
            printerService.setConnectionCallback(() => { });
        };
    }, []);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            await printerService.connect();
            setConnection(printerService.getConnectionStatus());
        } catch (error) {
            console.error('Erro ao conectar:', error);
        }
        setIsConnecting(false);
    };

    const handleDisconnect = async () => {
        await printerService.disconnect();
        setConnection(printerService.getConnectionStatus());
    };

    const handleAutoPrintToggle = () => {
        const newValue = !autoPrint;
        setAutoPrint(newValue);
        localStorage.setItem('chapa_quente_auto_print', String(newValue));
    };

    const handleTestPrint = async () => {
        try {
            await printerService.printOrder({
                id: 'TESTE123',
                customerName: 'Teste de Impressao',
                items: [
                    { name: 'Classico Imperial', quantity: 2, price: 28.90 },
                    { name: 'Coca-Cola Lata', quantity: 2, price: 6.00 },
                ],
                total: 69.80,
                createdAt: new Date(),
                paymentMethod: 'PIX'
            });
            alert('✅ Pedido de teste enviado para a impressora!');
        } catch (error) {
            alert('❌ Erro ao imprimir. Verifique a conexão.');
        }
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-navy p-6 text-white flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center">
                            <i className="fas fa-print text-navy text-xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase">Impressora</h2>
                            <p className="text-gold/70 text-[10px] uppercase tracking-widest">Configuração Bluetooth</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white text-xl">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status da Conexão */}
                    <div className={`p-4 rounded-2xl flex items-center justify-between ${connection.isConnected ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'
                        }`}>
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connection.isConnected ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                <i className={`fas ${connection.isConnected ? 'fa-bluetooth' : 'fa-bluetooth-b'}`}></i>
                            </div>
                            <div>
                                <p className={`font-black text-sm uppercase ${connection.isConnected ? 'text-green-700' : 'text-gray-500'}`}>
                                    {connection.isConnected ? 'Conectada' : 'Desconectada'}
                                </p>
                                {connection.isConnected && connection.deviceName && (
                                    <p className="text-green-600/70 text-xs">{connection.deviceName}</p>
                                )}
                            </div>
                        </div>

                        <div className={`w-3 h-3 rounded-full ${connection.isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    </div>

                    {/* Botões de Conexão */}
                    {!connection.isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center space-x-2 transition-all ${isConnecting
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                                }`}
                        >
                            {isConnecting ? (
                                <>
                                    <i className="fas fa-spinner animate-spin"></i>
                                    <span>Buscando...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fab fa-bluetooth-b"></i>
                                    <span>Conectar Impressora</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <button
                                onClick={handleTestPrint}
                                className="w-full py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center space-x-2 bg-gold text-navy hover:bg-gold/90 transition-all shadow-lg"
                            >
                                <i className="fas fa-receipt"></i>
                                <span>Imprimir Teste</span>
                            </button>

                            <button
                                onClick={handleDisconnect}
                                className="w-full py-3 rounded-2xl font-bold text-xs uppercase text-red-600 border-2 border-red-200 hover:bg-red-50 transition-all"
                            >
                                <i className="fas fa-unlink mr-2"></i>
                                Desconectar
                            </button>
                        </div>
                    )}

                    {/* Configuração de Auto-Print */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-navy shadow-sm">
                                    <i className="fas fa-magic"></i>
                                </div>
                                <div>
                                    <p className="font-black text-navy text-sm">Impressão Automática</p>
                                    <p className="text-gray-400 text-[10px] uppercase">Imprime ao receber pedido</p>
                                </div>
                            </div>

                            <button
                                onClick={handleAutoPrintToggle}
                                className={`w-14 h-8 rounded-full flex items-center transition-all ${autoPrint ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                                    }`}
                            >
                                <div className="w-6 h-6 bg-white rounded-full shadow-md mx-1"></div>
                            </button>
                        </div>
                    </div>

                    {/* Instruções */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <div className="flex items-start space-x-3">
                            <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                            <div className="text-xs text-blue-700 space-y-1">
                                <p className="font-bold">Como conectar:</p>
                                <ol className="list-decimal list-inside space-y-1 text-blue-600">
                                    <li>Ligue a impressora térmica</li>
                                    <li>Ative o Bluetooth no seu computador</li>
                                    <li>Clique em "Conectar Impressora"</li>
                                    <li>Selecione sua impressora na lista</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Aviso sobre compatibilidade */}
                    <p className="text-center text-gray-400 text-[9px] uppercase tracking-widest">
                        <i className="fab fa-chrome mr-1"></i>
                        Requer Google Chrome ou Microsoft Edge
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrinterConfig;
