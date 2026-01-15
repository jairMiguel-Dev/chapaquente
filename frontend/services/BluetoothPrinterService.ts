/**
 * Serviço de Impressão Bluetooth para Impressoras Térmicas
 * Compatível com impressoras que usam protocolo ESC/POS (maioria das térmicas)
 */

// UUIDs padrão para impressoras Bluetooth SPP (Serial Port Profile)
const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

// UUIDs alternativos comuns
const ALTERNATE_SERVICE_UUIDS = [
    '0000ff00-0000-1000-8000-00805f9b34fb', // Comum em impressoras chinesas
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Nordic UART
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Algumas impressoras genéricas
];

export interface PrinterConnection {
    device: BluetoothDevice | null;
    characteristic: BluetoothRemoteGATTCharacteristic | null;
    isConnected: boolean;
    deviceName: string;
}

export interface OrderForPrint {
    id: string;
    customerName: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    createdAt: Date;
    paymentMethod?: string;
    deliveryMode?: 'pickup' | 'delivery';
    deliveryAddress?: string;
}

class BluetoothPrinterService {
    private device: BluetoothDevice | null = null;
    private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private isConnected: boolean = false;
    private onConnectionChange: ((connected: boolean, deviceName?: string) => void) | null = null;

    // Comandos ESC/POS
    private ESC = 0x1B;
    private GS = 0x1D;
    private INIT = [0x1B, 0x40]; // Inicializa impressora
    private ALIGN_CENTER = [0x1B, 0x61, 0x01];
    private ALIGN_LEFT = [0x1B, 0x61, 0x00];
    private ALIGN_RIGHT = [0x1B, 0x61, 0x02];
    private BOLD_ON = [0x1B, 0x45, 0x01];
    private BOLD_OFF = [0x1B, 0x45, 0x00];
    private DOUBLE_HEIGHT_ON = [0x1B, 0x21, 0x10];
    private DOUBLE_WIDTH_ON = [0x1B, 0x21, 0x20];
    private DOUBLE_SIZE_ON = [0x1B, 0x21, 0x30];
    private NORMAL_SIZE = [0x1B, 0x21, 0x00];
    private FEED_LINE = [0x0A];
    private FEED_PAPER = [0x1B, 0x64, 0x04]; // Avança 4 linhas
    private CUT_PAPER = [0x1D, 0x56, 0x00]; // Corte total
    private PARTIAL_CUT = [0x1D, 0x56, 0x01]; // Corte parcial

    setConnectionCallback(callback: (connected: boolean, deviceName?: string) => void) {
        this.onConnectionChange = callback;
    }

    async connect(): Promise<boolean> {
        try {
            // Verifica se Web Bluetooth está disponível
            if (!navigator.bluetooth) {
                alert('⚠️ Bluetooth não suportado neste navegador.\n\nUse Google Chrome ou Microsoft Edge em um computador com Bluetooth.');
                return false;
            }

            // Solicita dispositivo Bluetooth
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [PRINTER_SERVICE_UUID, ...ALTERNATE_SERVICE_UUIDS]
            });

            if (!this.device) {
                return false;
            }

            // Conecta ao GATT Server
            console.log('Conectando ao dispositivo:', this.device.name);
            const server = await this.device.gatt?.connect();

            if (!server) {
                throw new Error('Não foi possível conectar ao servidor GATT');
            }

            // Tenta encontrar o serviço de impressão
            let service: BluetoothRemoteGATTService | null = null;
            const allServiceUuids = [PRINTER_SERVICE_UUID, ...ALTERNATE_SERVICE_UUIDS];

            for (const uuid of allServiceUuids) {
                try {
                    service = await server.getPrimaryService(uuid);
                    console.log('Serviço encontrado:', uuid);
                    break;
                } catch (e) {
                    console.log('Serviço não encontrado:', uuid);
                }
            }

            if (!service) {
                // Tenta listar todos os serviços disponíveis
                const services = await server.getPrimaryServices();
                console.log('Serviços disponíveis:', services.map(s => s.uuid));

                if (services.length > 0) {
                    service = services[0];
                    console.log('Usando primeiro serviço disponível:', service.uuid);
                } else {
                    throw new Error('Nenhum serviço de impressão encontrado');
                }
            }

            // Encontra a característica de escrita
            const characteristics = await service.getCharacteristics();
            console.log('Características disponíveis:', characteristics.map(c => c.uuid));

            // Procura por uma característica que permita escrita
            this.characteristic = characteristics.find(c =>
                c.properties.write || c.properties.writeWithoutResponse
            ) || null;

            if (!this.characteristic) {
                // Tenta a característica padrão
                try {
                    this.characteristic = await service.getCharacteristic(PRINTER_CHARACTERISTIC_UUID);
                } catch (e) {
                    throw new Error('Nenhuma característica de escrita encontrada');
                }
            }

            this.isConnected = true;
            console.log('✅ Impressora conectada:', this.device.name);

            // Monitora desconexão
            this.device.addEventListener('gattserverdisconnected', () => {
                this.isConnected = false;
                this.onConnectionChange?.(false);
                console.log('❌ Impressora desconectada');
            });

            this.onConnectionChange?.(true, this.device.name || 'Impressora');

            // Teste de conexão - imprime uma linha
            await this.printTestPage();

            return true;
        } catch (error) {
            console.error('Erro ao conectar:', error);
            this.isConnected = false;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert(`❌ Erro ao conectar à impressora:\n\n${errorMessage}\n\nVerifique se:\n1. A impressora está ligada\n2. O Bluetooth está ativado\n3. A impressora está pareada com o computador`);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        this.onConnectionChange?.(false);
    }

    getConnectionStatus(): PrinterConnection {
        return {
            device: this.device,
            characteristic: this.characteristic,
            isConnected: this.isConnected,
            deviceName: this.device?.name || ''
        };
    }

    private textToBytes(text: string): number[] {
        // Converte texto para bytes (ASCII)
        const bytes: number[] = [];
        for (let i = 0; i < text.length; i++) {
            let charCode = text.charCodeAt(i);
            // Substitui caracteres especiais por equivalentes ASCII
            if (charCode > 127) {
                const replacements: Record<string, number> = {
                    'á': 97, 'à': 97, 'ã': 97, 'â': 97, 'ä': 97,
                    'é': 101, 'è': 101, 'ê': 101, 'ë': 101,
                    'í': 105, 'ì': 105, 'î': 105, 'ï': 105,
                    'ó': 111, 'ò': 111, 'õ': 111, 'ô': 111, 'ö': 111,
                    'ú': 117, 'ù': 117, 'û': 117, 'ü': 117,
                    'ç': 99, 'ñ': 110,
                    'Á': 65, 'À': 65, 'Ã': 65, 'Â': 65, 'Ä': 65,
                    'É': 69, 'È': 69, 'Ê': 69, 'Ë': 69,
                    'Í': 73, 'Ì': 73, 'Î': 73, 'Ï': 73,
                    'Ó': 79, 'Ò': 79, 'Õ': 79, 'Ô': 79, 'Ö': 79,
                    'Ú': 85, 'Ù': 85, 'Û': 85, 'Ü': 85,
                    'Ç': 67, 'Ñ': 78,
                };
                charCode = replacements[text[i]] || 63; // 63 = '?'
            }
            bytes.push(charCode);
        }
        return bytes;
    }

    private async sendData(data: number[]): Promise<void> {
        if (!this.characteristic || !this.isConnected) {
            throw new Error('Impressora não conectada');
        }

        // Envia em chunks de 20 bytes (limite do BLE)
        const chunkSize = 20;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const buffer = new Uint8Array(chunk);

            if (this.characteristic.properties.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(buffer);
            } else {
                await this.characteristic.writeValue(buffer);
            }

            // Pequeno delay entre chunks para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 20));
        }
    }

    async printTestPage(): Promise<void> {
        const data = [
            ...this.INIT,
            ...this.ALIGN_CENTER,
            ...this.BOLD_ON,
            ...this.textToBytes('=== TESTE DE IMPRESSAO ==='),
            ...this.FEED_LINE,
            ...this.BOLD_OFF,
            ...this.textToBytes('Impressora conectada!'),
            ...this.FEED_LINE,
            ...this.textToBytes('CHAPA QUENTE'),
            ...this.FEED_LINE,
            ...this.FEED_PAPER,
        ];

        await this.sendData(data);
    }

    async printOrder(order: OrderForPrint): Promise<void> {
        if (!this.isConnected) {
            console.warn('Impressora não conectada, pedido não impresso');
            return;
        }

        const now = new Date(order.createdAt);
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Linha separadora
        const separator = '--------------------------------';
        const doubleSeparator = '================================';

        const data: number[] = [
            ...this.INIT,

            // Cabeçalho
            ...this.ALIGN_CENTER,
            ...this.DOUBLE_SIZE_ON,
            ...this.textToBytes('CHAPA QUENTE'),
            ...this.FEED_LINE,
            ...this.NORMAL_SIZE,
            ...this.textToBytes('Dog Lanches Gourmet'),
            ...this.FEED_LINE,
            ...this.textToBytes(doubleSeparator),
            ...this.FEED_LINE,

            // Info do pedido
            ...this.DOUBLE_HEIGHT_ON,
            ...this.BOLD_ON,
            ...this.textToBytes(`SENHA: #${order.id}`),
            ...this.FEED_LINE,
            ...this.NORMAL_SIZE,
            ...this.BOLD_OFF,
            ...this.textToBytes(separator),
            ...this.FEED_LINE,

            // Cliente e data
            ...this.ALIGN_LEFT,
            ...this.textToBytes(`Cliente: ${order.customerName}`),
            ...this.FEED_LINE,
            ...this.textToBytes(`Data: ${dateStr} ${timeStr}`),
            ...this.FEED_LINE,
            ...this.textToBytes(separator),
            ...this.FEED_LINE,

            // Título itens
            ...this.BOLD_ON,
            ...this.textToBytes('ITENS DO PEDIDO:'),
            ...this.FEED_LINE,
            ...this.BOLD_OFF,
            ...this.FEED_LINE,
        ];

        // Itens do pedido
        for (const item of order.items) {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            const itemLine = `${item.quantity}x ${item.name}`;
            const priceLine = `   R$ ${itemTotal}`;

            data.push(
                ...this.textToBytes(itemLine),
                ...this.FEED_LINE,
                ...this.ALIGN_RIGHT,
                ...this.textToBytes(priceLine),
                ...this.FEED_LINE,
                ...this.ALIGN_LEFT,
            );
        }

        // Total
        data.push(
            ...this.textToBytes(separator),
            ...this.FEED_LINE,
            ...this.ALIGN_RIGHT,
            ...this.DOUBLE_SIZE_ON,
            ...this.BOLD_ON,
            ...this.textToBytes(`TOTAL: R$ ${order.total.toFixed(2)}`),
            ...this.FEED_LINE,
            ...this.NORMAL_SIZE,
            ...this.BOLD_OFF,

            // Pagamento
            ...this.ALIGN_LEFT,
            ...this.textToBytes(`Pagamento: ${order.paymentMethod || 'Nao informado'}`),
            ...this.FEED_LINE,
        );

        // Modo de entrega
        if (order.deliveryMode === 'pickup') {
            data.push(
                ...this.BOLD_ON,
                ...this.textToBytes('>> RETIRADA NO LOCAL <<'),
                ...this.FEED_LINE,
                ...this.BOLD_OFF,
            );
        } else if (order.deliveryMode === 'delivery' && order.deliveryAddress) {
            data.push(
                ...this.BOLD_ON,
                ...this.textToBytes('>> ENTREGA <<'),
                ...this.FEED_LINE,
                ...this.BOLD_OFF,
                ...this.textToBytes(`Endereco:`),
                ...this.FEED_LINE,
                ...this.textToBytes(order.deliveryAddress.substring(0, 32)),
                ...this.FEED_LINE,
            );
            // Se endereço for maior que 32 caracteres, continua na linha seguinte
            if (order.deliveryAddress.length > 32) {
                data.push(
                    ...this.textToBytes(order.deliveryAddress.substring(32, 64)),
                    ...this.FEED_LINE,
                );
            }
        }

        data.push(
            ...this.textToBytes(separator),
            ...this.FEED_LINE,

            // Rodapé
            ...this.ALIGN_CENTER,
            ...this.textToBytes('*** AGUARDE SER CHAMADO ***'),
            ...this.FEED_LINE,
            ...this.textToBytes('Obrigado pela preferencia!'),
            ...this.FEED_LINE,
            ...this.FEED_PAPER,
            ...this.PARTIAL_CUT,
        );

        try {
            await this.sendData(data);
            console.log('✅ Pedido impresso:', order.id);
        } catch (error) {
            console.error('❌ Erro ao imprimir:', error);
            throw error;
        }
    }

    // Imprime cópia para cozinha (mais simples)
    async printKitchenTicket(order: OrderForPrint): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        const data: number[] = [
            ...this.INIT,

            // Cabeçalho grande
            ...this.ALIGN_CENTER,
            ...this.DOUBLE_SIZE_ON,
            ...this.BOLD_ON,
            ...this.textToBytes('>> COZINHA <<'),
            ...this.FEED_LINE,
            ...this.textToBytes(`#${order.id}`),
            ...this.FEED_LINE,
            ...this.NORMAL_SIZE,
            ...this.BOLD_OFF,
            ...this.textToBytes('================================'),
            ...this.FEED_LINE,
            ...this.FEED_LINE,
        ];

        // Itens em tamanho grande
        for (const item of order.items) {
            data.push(
                ...this.DOUBLE_SIZE_ON,
                ...this.BOLD_ON,
                ...this.ALIGN_LEFT,
                ...this.textToBytes(`${item.quantity}x ${item.name}`),
                ...this.FEED_LINE,
                ...this.NORMAL_SIZE,
                ...this.BOLD_OFF,
            );
        }

        data.push(
            ...this.FEED_LINE,
            ...this.ALIGN_CENTER,
            ...this.textToBytes('================================'),
            ...this.FEED_LINE,
            ...this.textToBytes(`Cliente: ${order.customerName}`),
            ...this.FEED_LINE,
            // Modo de entrega na cozinha
            ...this.BOLD_ON,
            ...this.textToBytes(order.deliveryMode === 'pickup' ? '** RETIRADA **' : '** ENTREGA **'),
            ...this.FEED_LINE,
            ...this.BOLD_OFF,
            ...this.FEED_PAPER,
            ...this.PARTIAL_CUT,
        );

        await this.sendData(data);
    }
}

// Instância singleton
export const printerService = new BluetoothPrinterService();
