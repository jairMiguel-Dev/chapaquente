// ============================================
// TIPOS DO BACKEND - CHAPA QUENTE
// ============================================

export type OrderStatus = 'recebido' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
export type DeliveryMode = 'pickup' | 'delivery';
export type ProductCategory = 'Hot Dogs' | 'Lanches' | 'Porcoes' | 'Bebidas';

export interface User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    loyalty_points: number;
    loyalty_started_at?: Date;
    is_admin: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: ProductCategory;
    tags: string[];
    is_active: boolean;
    created_at: Date;
}

export interface Stock {
    product_id: number;
    quantity: number;
    updated_at: Date;
}

export interface OrderItem {
    id: number;
    order_id: string;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    custom_description?: string;
}

export interface Order {
    id: string;
    user_id?: string;
    customer_name: string;
    status: OrderStatus;
    total: number;
    delivery_mode: DeliveryMode;
    delivery_address?: string;
    delivery_fee: number;
    payment_method?: string;
    machine_needed: boolean;
    queue_position?: number;
    observation?: string; // Observação do cliente
    created_at: Date;
    updated_at: Date;
    items?: OrderItem[];
}

// DTOs para requests
export interface CreateOrderDTO {
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

export interface RegisterUserDTO {
    name: string;
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface UpdateStockDTO {
    product_id: number;
    quantity: number;
}

// JWT Payload
export interface JWTPayload {
    userId: string;
    email: string;
    isAdmin: boolean;
}
