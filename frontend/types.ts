
export interface HotDog {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'Hot Dogs' | 'Lanches' | 'Porcoes' | 'Bebidas';
  tags: string[];
  stock?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  loyaltyPoints: number;
  loyaltyStartedAt?: string;
  isAdmin?: boolean;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customDescription?: string;
}

export type OrderStatus = 'recebido' | 'preparando' | 'pronto' | 'entregue';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  customerName?: string;
  paymentMethod?: string;
  invoiceKey?: string; // Chave de acesso Sefaz
  queuePosition?: number;
  deliveryMode?: 'pickup' | 'delivery'; // Retirar no local ou Entrega
  deliveryAddress?: string; // Endereço de entrega
  deliveryFee?: number; // Taxa de entrega
  machineNeeded?: boolean; // Se o motoboy precisa levar a maquininha
  observation?: string; // Observação do cliente (ex: sem cebola)
}

export interface FinancialStats {
  daily: number;
  weekly: number;
  monthly: number;
  totalOrders: number;
}
