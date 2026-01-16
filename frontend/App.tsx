
import React, { useState, useEffect, useCallback } from 'react';
import { HotDog, CartItem, Order, OrderStatus, User } from './types';
import { HOT_DOGS, OFFICIAL_LOGO_URL } from './constants';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MenuCard from './components/MenuCard';
import CartDrawer from './components/CartDrawer';
import OrderTracker from './components/OrderTracker';
import OrderFloatingBadge from './components/OrderFloatingBadge';
import OrderHistory from './components/OrderHistory';
import CustomDogBuilder from './components/CustomDogBuilder';
import LoyaltyCard from './components/LoyaltyCard';
import VirtualAssistant from './components/VirtualAssistant';
import FullMenuPage from './components/FullMenuPage';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import WelcomeScreen from './components/WelcomeScreen';
import { printerService } from './services/BluetoothPrinterService';
import { api, ordersAPI, productsAPI, Product } from './services/api';

// Chaves do localStorage (mantidas para fallback)
const ORDERS_STORAGE_KEY = 'chapa_quente_orders';
const STOCK_STORAGE_KEY = 'chapa_quente_stock';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFullMenuOpen, setIsFullMenuOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Central de pedidos para Admin
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showAddNotification, setShowAddNotification] = useState(false);
  const [showComboUpsell, setShowComboUpsell] = useState(false);
  const [socialToast, setSocialToast] = useState<{ name: string, location: string } | null>(null);

  const [stock, setStock] = useState<Record<number, number>>({});
  const [apiProducts, setApiProducts] = useState<HotDog[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Carregar produtos da API
  const loadProductsFromAPI = useCallback(async () => {
    try {
      const products = await productsAPI.getAll();
      const hotdogs: HotDog[] = products.map((p: Product) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        category: p.category,
        tags: p.tags,
        stock: p.stock,
      }));
      setApiProducts(hotdogs);

      // Atualizar estoque
      const stockMap: Record<number, number> = {};
      products.forEach((p: Product) => {
        stockMap[p.id] = p.stock;
      });
      setStock(stockMap);
      setIsLoadingProducts(false);
    } catch (error) {
      console.error('Erro ao carregar produtos da API, usando fallback local:', error);
      // Fallback para produtos locais
      setApiProducts(HOT_DOGS);
      setStock(HOT_DOGS.reduce((acc, hd) => ({ ...acc, [hd.id]: 50 }), {}));
      setIsLoadingProducts(false);
    }
  }, []);

  // Carregar pedidos da API
  const loadOrdersFromAPI = useCallback(async () => {
    try {
      const orders = await ordersAPI.getAll();
      const localOrders: Order[] = orders.map(o => ({
        id: o.id,
        items: o.items.map(item => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: '',
          customDescription: item.customDescription,
        })),
        total: o.total,
        status: o.status as OrderStatus,
        createdAt: new Date(o.createdAt),
        customerName: o.customerName,
        paymentMethod: o.paymentMethod,
        queuePosition: o.queuePosition,
        deliveryMode: o.deliveryMode,
        deliveryAddress: o.deliveryAddress,
        deliveryFee: o.deliveryFee,
      }));
      setAllOrders(localOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos da API:', error);
    }
  }, []);

  // Usar produtos da API ou fallback
  const products = apiProducts.length > 0 ? apiProducts : HOT_DOGS;
  const featuredItems = products.slice(0, 5);

  // Carregar produtos e pedidos da API ao iniciar
  useEffect(() => {
    loadProductsFromAPI();
    loadOrdersFromAPI();
  }, [loadProductsFromAPI, loadOrdersFromAPI]);

  // Polling para atualizar pedidos em tempo real (a cada 15 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrdersFromAPI();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadOrdersFromAPI]);

  useEffect(() => {
    const locations = ['Centro', 'Jardins', 'Barra', 'Batista Campos', 'Umarizal', 'Meireles', 'Itaim Bibi', 'Vila Madalena'];
    const interval = setInterval(() => {
      const randomDog = HOT_DOGS[Math.floor(Math.random() * 5)];
      const randomLoc = locations[Math.floor(Math.random() * locations.length)];
      setSocialToast({ name: randomDog.name, location: randomLoc });
      setTimeout(() => setSocialToast(null), 4000);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('chapa_quente_user');
    if (saved) {
      const savedUser = JSON.parse(saved);
      setUser(savedUser);
      // Se for admin, abre o painel automaticamente
      if (savedUser.isAdmin) {
        setIsAdminOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stock));
  }, [stock]);

  const updateStock = (id: number, quantity: number) => {
    setStock(prev => ({ ...prev, [id]: quantity }));
  };

  // Função auxiliar para calcular posição na fila
  const getQueuePosition = (orderId: string): number => {
    const pendingOrders = allOrders
      .filter(o => o.status === 'recebido' || o.status === 'preparando')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const position = pendingOrders.findIndex(o => o.id === orderId);
    return position >= 0 ? position : 0;
  };

  // Sincroniza o activeOrder com o estado global allOrders
  useEffect(() => {
    if (!activeOrder) return;
    const synced = allOrders.find(o => o.id === activeOrder.id);
    if (synced && synced.status !== activeOrder.status) {
      setActiveOrder(synced);
    }
  }, [allOrders, activeOrder?.id]);

  const addToCart = (hotdog: HotDog) => {
    const currentStock = stock[hotdog.id] || 0;
    const inCart = cartItems.find(i => i.id === hotdog.id)?.quantity || 0;

    if (inCart >= currentStock) {
      alert(`⚠️ Ops! Só temos ${currentStock} unidades de "${hotdog.name}" disponíveis no momento.`);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.id === hotdog.id);
      if (existing) {
        return prev.map(item =>
          item.id === hotdog.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: hotdog.id,
        name: hotdog.name,
        price: hotdog.price,
        quantity: 1,
        image: hotdog.image
      }];
    });

    if (hotdog.category !== 'Bebidas') {
      setShowComboUpsell(true);
    }

    setShowAddNotification(true);
    setTimeout(() => setShowAddNotification(false), 3000);
  };

  // Versão silenciosa para o assistente virtual (sem modais/notificações)
  const addToCartSilent = (hotdog: HotDog) => {
    const currentStock = stock[hotdog.id] || 0;
    const inCart = cartItems.find(i => i.id === hotdog.id)?.quantity || 0;

    if (inCart >= currentStock) {
      // No assistant, podemos retornar false ou apenas não adicionar
      return false;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.id === hotdog.id);
      if (existing) {
        return prev.map(item =>
          item.id === hotdog.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: hotdog.id,
        name: hotdog.name,
        price: hotdog.price,
        quantity: 1,
        image: hotdog.image
      }];
    });
    return true;
  };

  const addCombo = () => {
    const soda = HOT_DOGS.find(h => h.id === 7);
    if (soda) addToCart(soda);
    setShowComboUpsell(false);
  };

  const handleCheckout = async (items: CartItem[], total: number, deliveryInfo?: any, paymentMethod?: string, observation?: string) => {
    try {
      // Criar pedido na API
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
        delivery_mode: (deliveryInfo?.deliveryMode || 'pickup') as 'pickup' | 'delivery',
        delivery_address: deliveryInfo?.address,
        delivery_fee: deliveryInfo?.deliveryFee || 0,
        payment_method: paymentMethod,
        observation: observation || deliveryInfo?.observation || undefined, // Observação do cliente
      };

      const apiOrder = await ordersAPI.create(orderData);

      const newOrder: Order = {
        id: apiOrder.id,
        items: [...items],
        total: apiOrder.total,
        status: apiOrder.status as OrderStatus,
        createdAt: new Date(apiOrder.createdAt),
        customerName: apiOrder.customerName,
        queuePosition: apiOrder.queuePosition,
        paymentMethod: apiOrder.paymentMethod,
        deliveryMode: apiOrder.deliveryMode,
        deliveryAddress: apiOrder.deliveryAddress,
        deliveryFee: apiOrder.deliveryFee,
        observation: observation || deliveryInfo?.observation,
      };

      setActiveOrder(newOrder);
      setAllOrders(prev => [newOrder, ...prev]);

      // Adiciona 1 selo ao usuário (a cada compra realizada)
      if (user) {
        const updatedUser = {
          ...user,
          loyaltyPoints: Math.min((user.loyaltyPoints || 0) + 1, 10)
        };
        setUser(updatedUser);
        localStorage.setItem('chapa_quente_user', JSON.stringify(updatedUser));
      }

      // Recarregar estoque da API
      await loadProductsFromAPI();

      // Impressão automática se configurada
      const autoPrintEnabled = localStorage.getItem('chapa_quente_auto_print') === 'true';
      if (autoPrintEnabled && printerService.getConnectionStatus().isConnected) {
        printerService.printOrder({
          id: newOrder.id,
          customerName: newOrder.customerName || 'Cliente',
          items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          total: newOrder.total,
          createdAt: newOrder.createdAt,
          paymentMethod: paymentMethod,
          deliveryMode: newOrder.deliveryMode,
          deliveryAddress: newOrder.deliveryAddress
        }).then(() => {
          printerService.printKitchenTicket({
            id: newOrder.id,
            customerName: newOrder.customerName || 'Cliente',
            items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
            total: newOrder.total,
            createdAt: newOrder.createdAt,
            deliveryMode: newOrder.deliveryMode
          });
        }).catch(err => {
          console.error('Erro na impressão automática:', err);
        });
      }

      setCartItems([]);
      setIsCartOpen(false);
      setIsTrackingOpen(true);

    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao criar pedido. Tente novamente.');
    }
  };

  // Versão silenciosa do checkout para o assistente virtual (sem abrir modal de tracking)
  const handleCheckoutSilent = (items: CartItem[], total: number) => {
    const ordersAhead = allOrders.filter(o => o.status === 'recebido' || o.status === 'preparando').length;

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      items: [...items],
      total,
      status: 'recebido',
      createdAt: new Date(),
      customerName: user?.name || 'Visitante',
      queuePosition: ordersAhead + 1
    };
    setActiveOrder(newOrder);

    const updatedOrders = [newOrder, ...allOrders];
    setAllOrders(updatedOrders);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));

    // Deduz do estoque
    setStock(prev => {
      const newStock = { ...prev };
      items.forEach(item => {
        if (newStock[item.id] !== undefined) {
          newStock[item.id] = Math.max(0, newStock[item.id] - item.quantity);
        }
      });
      return newStock;
    });

    setCartItems([]);
    // Não abre o modal de tracking - a confirmação fica no chat
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      const updatedOrders = allOrders.map(o => o.id === orderId ? { ...o, status } : o);
      setAllOrders(updatedOrders);

      if (activeOrder?.id === orderId) {
        setActiveOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        user={user}
        onLoginClick={() => setShowAuth(true)}
        onLogout={() => {
          api.auth.logout();
          setUser(null);
          setIsAdminOpen(false);
        }}
        onOrdersClick={() => setShowOrderHistory(true)}
        onAdminClick={user?.isAdmin ? () => setIsAdminOpen(true) : undefined}
      />



      {/* Balão Flutuante de Pedido em Andamento */}
      {activeOrder && activeOrder.status !== 'entregue' && !isTrackingOpen && (
        <OrderFloatingBadge
          order={activeOrder}
          onOpenTracker={() => setIsTrackingOpen(true)}
          queuePosition={getQueuePosition(activeOrder.id)}
        />
      )}

      {socialToast && (
        <div className="fixed bottom-24 left-6 z-[200] bg-white border-l-4 border-gold p-4 rounded-2xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-left duration-500 max-w-[280px]" role="alert">
          <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center text-navy shrink-0">
            <i className="fas fa-shopping-bag"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-navy uppercase leading-tight">Alguém em {socialToast.location}</p>
            <p className="text-[9px] text-gray-400 font-bold">Acabou de pedir um {socialToast.name}</p>
          </div>
        </div>
      )}

      {showAddNotification && (
        <div className="fixed top-24 right-6 z-[200] bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right" role="status">
          <i className="fas fa-check-circle"></i>
          <span className="font-black text-sm uppercase italic">Adicionado ao Banquete!</span>
        </div>
      )}

      {showComboUpsell && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/90 backdrop-blur-md" onClick={() => setShowComboUpsell(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in border-4 border-gold">
            <div className="w-24 h-24 bg-gold rounded-full flex items-center justify-center mx-auto -mt-20 mb-6 shadow-2xl border-4 border-white">
              <i className="fas fa-glass-cheers text-navy text-4xl"></i>
            </div>
            <h3 className="text-3xl font-black text-navy uppercase italic mb-2">Combo <span className="text-red-600">Imperial?</span></h3>
            <p className="text-gray-500 font-medium mb-8">Ninguém come um Dogão desse sozinho! Adicione nossa Soda Real de Hibisco por apenas <span className="text-green-600 font-black">R$ 14,50</span>.</p>
            <div className="space-y-4">
              <button onClick={addCombo} className="w-full bg-navy text-gold py-5 rounded-2xl font-black uppercase text-sm shadow-xl hover:scale-105 transition-all">
                SIM, EU QUERO O COMBO!
              </button>
              <button onClick={() => setShowComboUpsell(false)} className="w-full text-navy/40 font-black uppercase text-[10px] tracking-widest hover:text-navy">
                Vou passar dessa vez...
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <Hero onOpenMenu={() => setIsFullMenuOpen(true)} />

        <section className="py-20 md:py-32 bg-white" id="menu">
          <div className="container mx-auto px-6">
            <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-8">
              <div className="text-center md:text-left">
                <h4 className="text-red-600 font-black tracking-[0.4em] text-[10px] uppercase mb-4">A Elite do Hot Dog Gourmet</h4>
                <h2 className="text-5xl md:text-7xl font-black text-navy uppercase italic leading-none">Melhores <span className="text-gold">Escolhas</span></h2>
              </div>
              <button onClick={() => setIsFullMenuOpen(true)} className="bg-navy text-gold px-12 py-5 rounded-2xl font-black uppercase text-sm shadow-xl hover:scale-110 transition-all border-b-4 border-black/20">
                VER CARDÁPIO COMPLETO
              </button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {featuredItems.slice(0, 3).map(item => (
                <MenuCard key={item.id} hotdog={item} onAddToCart={addToCart} availableStock={stock[item.id]} />
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50" id="laboratorio">
          <div className="container mx-auto px-6">
            <div className="bg-navy rounded-[4rem] p-12 md:p-20 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden border-b-[12px] border-gold group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-gold/10 transition-colors duration-1000"></div>
              <div className="z-10 text-center md:text-left mb-12 md:mb-0">
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic mb-8 leading-tight">Monte a Sua <br /><span className="text-gold">Obra-Prima</span></h2>
                <p className="text-gray-400 max-w-sm font-medium text-lg mb-10 leading-relaxed italic">No Laboratório Imperial, a chapa nunca esfria e o SEO é otimizado para sua fome.</p>
                <button onClick={() => setIsBuilderOpen(true)} className="w-full md:w-auto bg-gold text-navy px-16 py-6 rounded-3xl font-black text-xl uppercase shadow-2xl hover:scale-105 transition-all active:scale-95 border-b-4 border-black/10">
                  Abrir Simulador VIP
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gold rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <img src={OFFICIAL_LOGO_URL} className="w-56 h-56 md:w-80 md:h-80 rounded-full border-8 border-gold shadow-2xl z-10 hidden sm:block rotate-6 group-hover:rotate-0 transition-transform duration-700" alt="Logo Chapa Quente" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white" id="fidelidade">
          <div className="container mx-auto px-6">
            <LoyaltyCard user={user} onOpenAuth={() => setShowAuth(true)} />
          </div>
        </section>

        <footer className="bg-navy py-24 border-t-8 border-gold">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center mb-16">
              <img src={OFFICIAL_LOGO_URL} className="w-24 h-24 rounded-full mb-8 border-4 border-gold shadow-2xl" alt="Footer Logo Chapa Quente" />
              <div className="space-y-4 text-center">
                <h2 className="text-white font-black uppercase text-sm tracking-[0.5em]">Chapa Quente Dog Lanches</h2>
                <p className="text-gold/60 text-xs font-bold uppercase">Liderando a revolução Gourmet desde 2024</p>
                <div className="flex justify-center space-x-6 text-gold/50 text-xl pt-4">
                  <a href="#" aria-label="Instagram"><i className="fab fa-instagram hover:text-gold cursor-pointer transition-colors"></i></a>
                  <a href="#" aria-label="WhatsApp"><i className="fab fa-whatsapp hover:text-gold cursor-pointer transition-colors"></i></a>
                  <a href="#" aria-label="TikTok"><i className="fab fa-tiktok hover:text-gold cursor-pointer transition-colors"></i></a>
                </div>
              </div>
            </div>

            {/* SEO Local Footer Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-16 text-center md:text-left">
              <div>
                <h3 className="text-gold font-black uppercase text-[10px] tracking-widest mb-6">Nossas Unidades</h3>
                <ul className="text-white/40 text-[10px] space-y-3 font-bold uppercase">
                  <li>Centro Histórico</li>
                  <li>Jardins Premium</li>
                  <li>Barra da Tijuca</li>
                  <li>Batista Campos</li>
                </ul>
              </div>
              <div>
                <h3 className="text-gold font-black uppercase text-[10px] tracking-widest mb-6">Áreas de Entrega</h3>
                <ul className="text-white/40 text-[10px] space-y-3 font-bold uppercase">
                  <li>Entrega Rápida Paulista</li>
                  <li>Delivery Faria Lima</li>
                  <li>Hot Dog Zona Sul</li>
                  <li>Dog Gourmet Zona Oeste</li>
                </ul>
              </div>
              <div>
                <h3 className="text-gold font-black uppercase text-[10px] tracking-widest mb-6">Institucional</h3>
                <ul className="text-white/40 text-[10px] space-y-3 font-bold uppercase">
                  <li>Sobre o Chef</li>
                  <li>Política de Privacidade</li>
                  <li>Termos de Uso</li>
                  <li>Trabalhe Conosco</li>
                </ul>
              </div>
              <div>
                <h3 className="text-gold font-black uppercase text-[10px] tracking-widest mb-6">Horários</h3>
                <ul className="text-white/40 text-[10px] space-y-3 font-bold uppercase">
                  <li>Dom - Qui: 18h às 00h</li>
                  <li>Sex - Sáb: 18h às 04h</li>
                  <li className="text-red-500">Aberto Agora!</li>
                </ul>
              </div>
            </div>

            <div className="text-center text-white/10 text-[9px] font-black uppercase mt-24 tracking-[0.3em]">
              © 2025 - CHAPA QUENTE | DESIGNED FOR MAX CONVERSION & SEO 2026
            </div>
          </div>
        </footer>
      </main>

      {/* Tela de Boas-Vindas para Totem - Exigir Login */}
      {!user && !showAuth && (
        <WelcomeScreen onStartOrder={() => setShowAuth(true)} />
      )}

      {/* Modal de Auth - Obrigatório quando não há usuário */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={(loggedUser) => {
            setUser(loggedUser);
            localStorage.setItem('chapa_quente_user', JSON.stringify(loggedUser));
            // Se for admin, abre o painel administrativo automaticamente
            if (loggedUser.isAdmin) {
              setIsAdminOpen(true);
            }
          }}
          required={!user} // Não pode fechar se não estiver logado
        />
      )}
      {isFullMenuOpen && <FullMenuPage
        onClose={() => setIsFullMenuOpen(false)}
        onAddToCart={addToCart}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        stock={stock}
      />}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={(id) => setCartItems(prev => prev.filter(i => i.id !== id))}
        onUpdateQuantity={(id, delta) => setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))}
        onCheckout={handleCheckout}
      />
      {isBuilderOpen && <CustomDogBuilder onClose={() => setIsBuilderOpen(false)} onAddCustomToCart={(item) => {
        setCartItems(prev => [...prev, item]);
        setShowAddNotification(true);
        setTimeout(() => setShowAddNotification(false), 3000);
      }} />}
      {activeOrder && isTrackingOpen && (
        <OrderTracker
          order={activeOrder}
          onClose={() => setIsTrackingOpen(false)}
          queuePosition={getQueuePosition(activeOrder.id)}
        />
      )}

      {/* Histórico de Pedidos do Usuário */}
      {showOrderHistory && user && (
        <OrderHistory
          orders={allOrders}
          onClose={() => setShowOrderHistory(false)}
          userName={user.name}
        />
      )}

      {/* Area Admin */}
      {isAdminOpen && <AdminDashboard
        orders={allOrders}
        onUpdateStatus={updateOrderStatus}
        onClose={() => setIsAdminOpen(false)}
        stock={stock}
        onUpdateStock={updateStock}
      />}

      <VirtualAssistant onAddToCart={addToCartSilent} onCheckout={handleCheckoutSilent} cartItems={cartItems} />
    </div>
  );
};

export default App;
