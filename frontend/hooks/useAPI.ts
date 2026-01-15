import { useState, useEffect, useCallback } from 'react';
import { api, Product, Order, OrderStatus, User } from '../services/api';
import { HotDog, CartItem, Order as LocalOrder } from '../types';
import { printerService } from '../services/BluetoothPrinterService';

// Converter Product da API para HotDog do frontend
const productToHotDog = (product: Product): HotDog => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category,
    tags: product.tags,
    stock: product.stock,
});

// Hook principal para integração com a API
export function useAPI() {
    const [user, setUser] = useState<User | null>(null);
    const [products, setProducts] = useState<HotDog[]>([]);
    const [stock, setStock] = useState<Record<number, number>>({});
    const [orders, setOrders] = useState<LocalOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Carregar usuário do localStorage ao iniciar
    useEffect(() => {
        const savedUser = api.auth.getCurrentUser();
        if (savedUser) {
            setUser(savedUser as User);
        }
    }, []);

    // Carregar produtos da API
    const loadProducts = useCallback(async () => {
        try {
            const apiProducts = await api.products.getAll();
            const hotdogs = apiProducts.map(productToHotDog);
            setProducts(hotdogs);

            // Atualizar estoque
            const stockMap: Record<number, number> = {};
            apiProducts.forEach(p => {
                stockMap[p.id] = p.stock;
            });
            setStock(stockMap);
        } catch (err) {
            console.error('Erro ao carregar produtos:', err);
            setError('Erro ao carregar cardápio');
        }
    }, []);

    // Carregar pedidos da API
    const loadOrders = useCallback(async () => {
        try {
            const apiOrders = await api.orders.getAll();
            const localOrders: LocalOrder[] = apiOrders.map(o => ({
                id: o.id,
                items: o.items.map(item => ({
                    id: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: '', // API não retorna imagem nos itens
                    customDescription: item.customDescription,
                })),
                total: o.total,
                status: o.status as LocalOrder['status'],
                createdAt: new Date(o.createdAt),
                customerName: o.customerName,
                paymentMethod: o.paymentMethod,
                queuePosition: o.queuePosition,
                deliveryMode: o.deliveryMode,
                deliveryAddress: o.deliveryAddress,
                deliveryFee: o.deliveryFee,
            }));
            setOrders(localOrders);
        } catch (err) {
            console.error('Erro ao carregar pedidos:', err);
        }
    }, []);

    // Inicialização
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadProducts();
            await loadOrders();
            setLoading(false);
        };
        init();
    }, [loadProducts, loadOrders]);

    // Polling para atualizar pedidos em tempo real (a cada 10 segundos)
    useEffect(() => {
        const interval = setInterval(() => {
            loadOrders();
        }, 10000);
        return () => clearInterval(interval);
    }, [loadOrders]);

    // Auth functions
    const login = async (email: string, password: string) => {
        try {
            const response = await api.auth.login(email, password);
            setUser(response.user as User);
            return response.user;
        } catch (err: any) {
            throw new Error(err.message || 'Erro no login');
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const response = await api.auth.register(name, email, password);
            setUser(response.user as User);
            return response.user;
        } catch (err: any) {
            throw new Error(err.message || 'Erro no cadastro');
        }
    };

    const guestLogin = async (name: string) => {
        try {
            const response = await api.auth.guest(name);
            setUser(response.user as User);
            return response.user;
        } catch (err: any) {
            throw new Error(err.message || 'Erro no login');
        }
    };

    const logout = () => {
        api.auth.logout();
        setUser(null);
    };

    // Order functions
    const createOrder = async (
        items: CartItem[],
        total: number,
        deliveryInfo?: {
            deliveryMode: 'pickup' | 'delivery';
            address?: string;
            deliveryFee?: number;
        },
        paymentMethod?: string
    ): Promise<LocalOrder> => {
        try {
            const orderData = {
                customer_name: user?.name || 'Visitante',
                items: items.map(item => ({
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    custom_description: item.customDescription,
                })),
                total,
                delivery_mode: deliveryInfo?.deliveryMode || 'pickup',
                delivery_address: deliveryInfo?.address,
                delivery_fee: deliveryInfo?.deliveryFee || 0,
                payment_method: paymentMethod,
            };

            const apiOrder = await api.orders.create(orderData);

            const newOrder: LocalOrder = {
                id: apiOrder.id,
                items: items,
                total: apiOrder.total,
                status: apiOrder.status as LocalOrder['status'],
                createdAt: new Date(apiOrder.createdAt),
                customerName: apiOrder.customerName,
                paymentMethod: apiOrder.paymentMethod,
                queuePosition: apiOrder.queuePosition,
                deliveryMode: apiOrder.deliveryMode,
                deliveryAddress: apiOrder.deliveryAddress,
                deliveryFee: apiOrder.deliveryFee,
            };

            // Atualizar lista de pedidos
            setOrders(prev => [newOrder, ...prev]);

            // Atualizar pontos de fidelidade do usuário
            if (user && !user.isGuest) {
                const updatedUser = {
                    ...user,
                    loyaltyPoints: Math.min((user.loyaltyPoints || 0) + 1, 10),
                };
                setUser(updatedUser);
                api.auth.updateLocalUser(updatedUser);
            }

            // Recarregar estoque
            await loadProducts();

            // Impressão automática
            const autoPrintEnabled = localStorage.getItem('chapa_quente_auto_print') === 'true';
            if (autoPrintEnabled && printerService.getConnectionStatus().isConnected) {
                try {
                    await printerService.printOrder({
                        id: newOrder.id,
                        customerName: newOrder.customerName || 'Cliente',
                        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                        total: newOrder.total,
                        createdAt: newOrder.createdAt,
                        paymentMethod: paymentMethod,
                        deliveryMode: newOrder.deliveryMode,
                        deliveryAddress: newOrder.deliveryAddress,
                    });
                    await printerService.printKitchenTicket({
                        id: newOrder.id,
                        customerName: newOrder.customerName || 'Cliente',
                        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                        total: newOrder.total,
                        createdAt: newOrder.createdAt,
                        deliveryMode: newOrder.deliveryMode,
                    });
                } catch (printErr) {
                    console.error('Erro na impressão automática:', printErr);
                }
            }

            return newOrder;
        } catch (err: any) {
            throw new Error(err.message || 'Erro ao criar pedido');
        }
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            await api.orders.updateStatus(orderId, status);
            setOrders(prev =>
                prev.map(o => (o.id === orderId ? { ...o, status: status as LocalOrder['status'] } : o))
            );
        } catch (err: any) {
            throw new Error(err.message || 'Erro ao atualizar status');
        }
    };

    // Stock functions
    const updateStock = async (productId: number, quantity: number) => {
        try {
            await api.stock.update(productId, quantity);
            setStock(prev => ({ ...prev, [productId]: quantity }));
        } catch (err: any) {
            console.error('Erro ao atualizar estoque:', err);
        }
    };

    // Resgatar fidelidade
    const redeemLoyalty = async () => {
        try {
            const result = await api.users.redeemLoyalty();
            if (user) {
                const updatedUser = { ...user, loyaltyPoints: result.newPoints };
                setUser(updatedUser);
                api.auth.updateLocalUser(updatedUser);
            }
            return result;
        } catch (err: any) {
            throw new Error(err.message || 'Erro ao resgatar prêmio');
        }
    };

    return {
        // State
        user,
        products,
        stock,
        orders,
        loading,
        error,

        // Auth
        login,
        register,
        guestLogin,
        logout,
        setUser,

        // Orders
        createOrder,
        updateOrderStatus,
        loadOrders,

        // Stock
        updateStock,
        loadProducts,

        // Loyalty
        redeemLoyalty,
    };
}

export default useAPI;
