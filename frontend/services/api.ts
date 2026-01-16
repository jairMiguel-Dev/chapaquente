// ============================================
// API SERVICE - CHAPA QUENTE
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'https://chapaquente-api.onrender.com';

// Token storage
let authToken: string | null = localStorage.getItem('chapa_quente_token');

// Helper para fazer requisições
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    // Adicionar token se existir
    if (authToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// ============================================
// AUTH
// ============================================

export interface LoginResponse {
    user: {
        id: string;
        name: string;
        email: string;
        loyaltyPoints: number;
        loyaltyStartedAt?: string;
        isAdmin: boolean;
    };
    token: string;
}

export interface User {
    id: string;
    name: string;
    email: string | null;
    loyaltyPoints: number;
    loyaltyStartedAt?: string;
    isAdmin: boolean;
    isGuest?: boolean;
}

export const authAPI = {
    // Registrar novo usuário
    register: async (name: string, email: string, password: string): Promise<LoginResponse> => {
        const response = await request<LoginResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        authToken = response.token;
        localStorage.setItem('chapa_quente_token', response.token);
        localStorage.setItem('chapa_quente_user', JSON.stringify(response.user));
        return response;
    },

    // Login
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await request<LoginResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        authToken = response.token;
        localStorage.setItem('chapa_quente_token', response.token);
        localStorage.setItem('chapa_quente_user', JSON.stringify(response.user));
        return response;
    },

    // Login como visitante
    guest: async (name: string): Promise<{ user: User }> => {
        const response = await request<{ user: User }>('/api/auth/guest', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
        localStorage.setItem('chapa_quente_user', JSON.stringify(response.user));
        return response;
    },

    // Logout
    logout: () => {
        authToken = null;
        localStorage.removeItem('chapa_quente_token');
        localStorage.removeItem('chapa_quente_user');
    },

    // Pegar usuário atual do localStorage
    getCurrentUser: (): User | null => {
        const saved = localStorage.getItem('chapa_quente_user');
        return saved ? JSON.parse(saved) : null;
    },

    // Verificar se está autenticado
    isAuthenticated: (): boolean => {
        return !!authToken;
    },

    // Atualizar dados do usuário no localStorage
    updateLocalUser: (user: User) => {
        localStorage.setItem('chapa_quente_user', JSON.stringify(user));
    }
};

// ============================================
// PRODUCTS
// ============================================

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: 'Hot Dogs' | 'Lanches' | 'Porcoes' | 'Bebidas';
    tags: string[];
    stock: number;
    isActive: boolean;
}

export const productsAPI = {
    // Listar todos os produtos
    getAll: async (category?: string): Promise<Product[]> => {
        const params = category ? `?category=${category}` : '';
        const response = await request<{ products: Product[] }>(`/api/products${params}`);
        return response.products;
    },

    // Buscar produto por ID
    getById: async (id: number): Promise<Product> => {
        return request<Product>(`/api/products/${id}`);
    },
};

// ============================================
// STOCK
// ============================================

export interface StockItem {
    productId: number;
    productName: string;
    category: string;
    quantity: number;
    updatedAt: string;
}

export const stockAPI = {
    // Listar estoque
    getAll: async (): Promise<StockItem[]> => {
        const response = await request<{ stock: StockItem[] }>('/api/stock');
        return response.stock;
    },

    // Buscar estoque de um produto
    getByProductId: async (productId: number): Promise<StockItem> => {
        return request<StockItem>(`/api/stock/${productId}`);
    },

    // Atualizar estoque (admin)
    update: async (productId: number, quantity: number): Promise<StockItem> => {
        return request<StockItem>(`/api/stock/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        });
    },

    // Atualização em lote (admin)
    batchUpdate: async (updates: { productId: number; quantity: number }[]): Promise<void> => {
        await request('/api/stock/batch', {
            method: 'POST',
            body: JSON.stringify({ updates }),
        });
    },
};

// ============================================
// ORDERS
// ============================================

export type OrderStatus = 'recebido' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
export type DeliveryMode = 'pickup' | 'delivery';

export interface OrderItem {
    id?: number;
    productId: number;
    name: string;
    quantity: number;
    price: number;
    customDescription?: string;
}

export interface Order {
    id: string;
    customerName: string;
    status: OrderStatus;
    total: number;
    deliveryMode: DeliveryMode;
    deliveryAddress?: string;
    deliveryFee: number;
    paymentMethod?: string;
    machineNeeded?: boolean;
    queuePosition?: number;
    observation?: string; // Observação do cliente
    createdAt: string;
    items: OrderItem[];
}

export interface CreateOrderData {
    customer_name: string;
    items: {
        product_id: number;
        product_name: string;
        quantity: number;
        unit_price: number;
        custom_description?: string;
    }[];
    total: number;
    delivery_mode: DeliveryMode;
    delivery_address?: string;
    delivery_fee?: number;
    payment_method?: string;
    machine_needed?: boolean;
    observation?: string; // Observação do cliente (ex: sem cebola)
}

export const ordersAPI = {
    // Listar pedidos
    getAll: async (status?: OrderStatus): Promise<Order[]> => {
        const params = status ? `?status=${status}` : '';
        const response = await request<{ orders: Order[] }>(`/api/orders${params}`);
        return response.orders;
    },

    // Buscar pedido por ID
    getById: async (id: string): Promise<Order> => {
        return request<Order>(`/api/orders/${id}`);
    },

    // Criar novo pedido
    create: async (data: CreateOrderData): Promise<Order> => {
        return request<Order>('/api/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Atualizar status (admin)
    updateStatus: async (id: string, status: OrderStatus): Promise<{ id: string; status: OrderStatus }> => {
        return request(`/api/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    // Estatísticas financeiras (admin)
    getFinancialStats: async (): Promise<{
        daily: number;
        weekly: number;
        monthly: number;
        totalOrders: number;
    }> => {
        return request('/api/orders/stats/financial');
    },
};

// ============================================
// USERS
// ============================================

export const usersAPI = {
    // Dados do usuário logado
    getMe: async (): Promise<User> => {
        return request<User>('/api/users/me');
    },

    // Atualizar perfil
    updateProfile: async (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }): Promise<User> => {
        return request<User>('/api/users/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Resgatar prêmio fidelidade
    redeemLoyalty: async (): Promise<{ message: string; newPoints: number }> => {
        return request('/api/users/loyalty/redeem', {
            method: 'POST',
        });
    },

    // Listar usuários (admin)
    getAll: async (): Promise<User[]> => {
        const response = await request<{ users: User[] }>('/api/users');
        return response.users;
    },
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthAPI = {
    check: async (): Promise<{ status: string; timestamp: string; service: string }> => {
        return request('/health');
    },
};

// Export all APIs
export const api = {
    auth: authAPI,
    products: productsAPI,
    stock: stockAPI,
    orders: ordersAPI,
    users: usersAPI,
    health: healthAPI,
};

export default api;
