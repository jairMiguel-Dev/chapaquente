
import { HotDog } from './types';

export const OFFICIAL_LOGO_URL = "/logo.png";

// Ingredientes para o montador de hot dog personalizado
export const INGREDIENTS = {
  paes: [
    { name: "Pão Tradicional", price: 0 },
    { name: "Pão Brioche", price: 2.00 },
  ],
  proteinas: [
    { name: "Salsicha (Vina)", price: 0 },
    { name: "2 Salsichas", price: 4.00 },
    { name: "Frango Desfiado", price: 5.00 },
    { name: "Calabresa", price: 5.00 },
    { name: "Bacon", price: 5.00 },
    { name: "Hambúrguer", price: 6.00 },
  ],
  queijos: [
    { name: "Cheddar", price: 4.00 },
    { name: "Catupiry", price: 4.00 },
    { name: "2 Queijos (Cheddar + Catupiry)", price: 6.00 },
  ],
  molhos: [
    { name: "Maionese", price: 0 },
    { name: "Ketchup", price: 0 },
    { name: "Mostarda", price: 0 },
  ],
  toppings: [
    { name: "Milho", price: 0 },
    { name: "Vinagrete", price: 0 },
    { name: "Farofa", price: 0 },
    { name: "Batata Palha", price: 0 },
    { name: "Ovo", price: 4.00 },
  ]
};

// Imagens para os ingredientes
export const INGREDIENT_IMAGES: Record<string, string> = {
  "Pão Tradicional": "/images/ingredients/pao-tradicional.png",
  "Pão Brioche": "/images/ingredients/pao-brioche.png",
  "Salsicha (Vina)": "/images/ingredients/vina.png",
  "2 Salsichas": "/images/ingredients/vina.png",
  "Frango Desfiado": "/images/ingredients/frango.png",
  "Calabresa": "/images/ingredients/calabresa.png",
  "Bacon": "/images/ingredients/bacon.png",
  "Hambúrguer": "/images/ingredients/hamburguer.png",
  "Cheddar": "/images/ingredients/cheddar.png",
  "Catupiry": "/images/ingredients/catupiry.png",
  "2 Queijos (Cheddar + Catupiry)": "/images/ingredients/cheddar.png",
  "Maionese": "/images/ingredients/maionese.png",
  "Ketchup": "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&q=80&w=400",
  "Mostarda": "https://images.unsplash.com/photo-1549468057-5b7fa1a41d7a?auto=format&fit=crop&q=80&w=400",
  "Milho": "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=400",
  "Vinagrete": "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?auto=format&fit=crop&q=80&w=400",
  "Farofa": "https://images.unsplash.com/photo-1596450514735-392061e86976?auto=format&fit=crop&q=80&w=400",
  "Batata Palha": "https://images.unsplash.com/photo-1626078299034-9c9244422bb4?auto=format&fit=crop&q=80&w=400",
  "Ovo": "https://images.unsplash.com/photo-1521513919009-be90ad5876ef?auto=format&fit=crop&q=80&w=400",
  "Default": "/images/products/dog-simples.png"
};

export const HOT_DOGS: HotDog[] = [
  // ============ HOT DOGS ============
  {
    id: 1,
    name: "Dog Simples",
    description: "Pão, Maionese, Vina, Milho, Vinagrete, Farofa e Batata palha",
    price: 14.00,
    image: "/images/products/dog-simples.png",
    category: "Hot Dogs",
    tags: ["Tradicional", "Econômico"]
  },
  {
    id: 2,
    name: "Dog Duplo",
    description: "Pão, Maionese, 2 Vinas, Milho, Vinagrete, Farofa e Batata palha",
    price: 16.00,
    image: "/images/products/dog-simples.png",
    category: "Hot Dogs",
    tags: ["Reforçado", "2 Salsichas"]
  },
  {
    id: 3,
    name: "Dog Frango",
    description: "Pão, Maionese, Vina, Frango, Milho, Vinagrete, Farofa e Batata palha",
    price: 18.00,
    image: "/images/products/dog-frango.png",
    category: "Hot Dogs",
    tags: ["Frango", "Saboroso"]
  },
  {
    id: 4,
    name: "Dog Frango Cheddar",
    description: "Pão, Maionese, Vina, Frango, Cheddar, Milho, Vinagrete, Farofa e Batata palha",
    price: 20.00,
    image: "/images/products/dog-frango.png",
    category: "Hot Dogs",
    tags: ["Frango", "Cheddar"]
  },
  {
    id: 5,
    name: "Dog Frango Catupiry",
    description: "Pão, Maionese, Vina, Frango, Catupiry, Milho, Vinagrete, Farofa e Batata palha",
    price: 20.00,
    image: "/images/products/dog-frango.png",
    category: "Hot Dogs",
    tags: ["Frango", "Catupiry"]
  },
  {
    id: 6,
    name: "Dog Frango 2 Queijos",
    description: "Pão, Maionese, Vina, Frango, Cheddar, Catupiry, Milho, Vinagrete, Farofa e Batata palha",
    price: 22.00,
    image: "/images/products/dog-frango-2queijos.png",
    category: "Hot Dogs",
    tags: ["Frango", "2 Queijos", "Best Seller"]
  },
  {
    id: 7,
    name: "Dog Bacon",
    description: "Pão, Maionese, Vina, Bacon, Milho, Vinagrete, Farofa e Batata palha",
    price: 22.00,
    image: "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&q=80&w=800",
    category: "Hot Dogs",
    tags: ["Bacon", "Crocante"]
  },
  {
    id: 8,
    name: "Dog Calabresa",
    description: "Pão, Maionese, Vina, Calabresa, Milho, Vinagrete, Farofa e Batata palha",
    price: 22.00,
    image: "/images/products/dog-calabresa.png",
    category: "Hot Dogs",
    tags: ["Calabresa", "Defumado"]
  },
  {
    id: 9,
    name: "Doguíssimo",
    description: "Pão, Maionese, 2 Vinas, Frango, Calabresa, Bacon, Cheddar, Catupiry, Milho, Vinagrete, Farofa e Batata palha",
    price: 30.00,
    image: "/images/products/doguissimo.png",
    category: "Hot Dogs",
    tags: ["Completo", "Mega", "Best Seller"]
  },

  // ============ LANCHES (X-BURGUER) ============
  {
    id: 10,
    name: "X Burguer",
    description: "Pão, Maionese, Hambúrguer, Queijo, Presunto, Milho, Batata palha",
    price: 18.00,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    category: "Lanches",
    tags: ["Clássico", "Tradicional"]
  },
  {
    id: 11,
    name: "X Salada",
    description: "Pão, Maionese, Hambúrguer, Queijo, Presunto, Alface, Tomate, Milho, Batata palha",
    price: 20.00,
    image: "/images/products/xsalada.png",
    category: "Lanches",
    tags: ["Salada", "Leve"]
  },
  {
    id: 12,
    name: "X Calabresa",
    description: "Pão, Maionese, Hambúrguer, Calabresa, Queijo, Presunto, Milho, Batata palha",
    price: 22.00,
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800",
    category: "Lanches",
    tags: ["Calabresa", "Defumado"]
  },
  {
    id: 13,
    name: "X Bacon",
    description: "Pão, Maionese, Hambúrguer, Bacon, Queijo, Presunto, Milho, Batata palha",
    price: 22.00,
    image: "/images/products/xbacon.png",
    category: "Lanches",
    tags: ["Bacon", "Crocante"]
  },
  {
    id: 14,
    name: "X Egg",
    description: "Pão, Maionese, Hambúrguer, Ovo, Queijo, Presunto, Milho, Batata palha",
    price: 22.00,
    image: "/images/products/xegg.png",
    category: "Lanches",
    tags: ["Ovo", "Cremoso"]
  },
  {
    id: 15,
    name: "X Frango",
    description: "Pão, Maionese, Hambúrguer, Frango, Queijo, Presunto, Milho, Batata palha",
    price: 22.00,
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&q=80&w=800",
    category: "Lanches",
    tags: ["Frango", "Saboroso"]
  },
  {
    id: 16,
    name: "X Tudo",
    description: "Pão, Maionese, Hambúrguer, Queijo, Presunto, Calabresa, Bacon, Ovo, Frango, Alface, Tomate, Milho, Batata palha",
    price: 30.00,
    image: "/images/products/xtudo.png",
    category: "Lanches",
    tags: ["Completo", "Mega", "Best Seller"]
  },

  // ============ PORÇÕES ============
  {
    id: 17,
    name: "Anéis de Cebola 300g",
    description: "Porção crocante de anéis de cebola empanados",
    price: 20.00,
    image: "/images/products/aneis-cebola.png",
    category: "Porcoes",
    tags: ["Crocante", "Para Dividir"]
  },
  {
    id: 18,
    name: "Anéis de Cebola 500g",
    description: "Porção grande de anéis de cebola empanados",
    price: 30.00,
    image: "/images/products/aneis-cebola.png",
    category: "Porcoes",
    tags: ["Crocante", "Família"]
  },
  {
    id: 19,
    name: "Mandioca Frita 300g",
    description: "Porção de mandioca frita crocante por fora e macia por dentro",
    price: 20.00,
    image: "/images/products/mandioca-frita.png",
    category: "Porcoes",
    tags: ["Tradicional", "Crocante"]
  },
  {
    id: 20,
    name: "Mandioca Frita 500g",
    description: "Porção grande de mandioca frita crocante",
    price: 30.00,
    image: "/images/products/mandioca-frita.png",
    category: "Porcoes",
    tags: ["Tradicional", "Família"]
  },
  {
    id: 21,
    name: "Iscas de Frango 300g",
    description: "Iscas de frango empanadas crocantes",
    price: 20.00,
    image: "/images/products/iscas-frango.png",
    category: "Porcoes",
    tags: ["Frango", "Crocante"]
  },
  {
    id: 22,
    name: "Iscas de Frango 500g",
    description: "Porção grande de iscas de frango empanadas",
    price: 30.00,
    image: "/images/products/iscas-frango.png",
    category: "Porcoes",
    tags: ["Frango", "Família"]
  },
  {
    id: 23,
    name: "Batata Frita 300g",
    description: "Porção de batata frita sequinha e crocante",
    price: 20.00,
    image: "/images/products/batata-frita.png",
    category: "Porcoes",
    tags: ["Clássico", "Crocante"]
  },
  {
    id: 24,
    name: "Batata Frita 500g",
    description: "Porção grande de batata frita sequinha",
    price: 30.00,
    image: "/images/products/batata-frita.png",
    category: "Porcoes",
    tags: ["Clássico", "Família"]
  },
  {
    id: 25,
    name: "Combo 4 Porções 250g",
    description: "4 porções de 250g cada: Batata, Mandioca, Iscas e Anéis + Cheddar e Bacon (Cine de brinde)",
    price: 60.00,
    image: "/images/products/combo-4-porcoes.png",
    category: "Porcoes",
    tags: ["Combo", "Família", "Brinde"]
  },
  {
    id: 26,
    name: "Combo 4 Porções 350g",
    description: "4 porções de 350g cada: Batata, Mandioca, Iscas e Anéis + Cheddar e Bacon (Cine de brinde)",
    price: 80.00,
    image: "/images/products/combo-4-porcoes.png",
    category: "Porcoes",
    tags: ["Combo", "Super Família", "Brinde"]
  },

  // ============ BEBIDAS (LATAS) ============
  {
    id: 27,
    name: "Coca-Cola Lata",
    description: "Lata 350ml gelada",
    price: 6.00,
    image: "/images/products/coca-lata.png",
    category: "Bebidas",
    tags: ["Lata", "Coca-Cola"]
  },
  {
    id: 28,
    name: "Guaraná Lata",
    description: "Lata 350ml gelada",
    price: 6.00,
    image: "/images/products/guarana-lata.png",
    category: "Bebidas",
    tags: ["Lata", "Guaraná"]
  },
  {
    id: 29,
    name: "Fanta Laranja Lata",
    description: "Lata 350ml gelada",
    price: 6.00,
    image: "/images/products/fanta-lata.png",
    category: "Bebidas",
    tags: ["Lata", "Fanta"]
  },
  {
    id: 30,
    name: "Sprite Lata",
    description: "Lata 350ml gelada",
    price: 6.00,
    image: "/images/products/sprite-lata.png",
    category: "Bebidas",
    tags: ["Lata", "Sprite"]
  },
  {
    id: 31,
    name: "Cerveja Lata",
    description: "Cerveja 350ml gelada",
    price: 6.00,
    image: "/images/products/cerveja-lata.png",
    category: "Bebidas",
    tags: ["Lata", "Alcoólico"]
  },
  // ============ BEBIDAS (2 LITROS) ============
  {
    id: 32,
    name: "Coca-Cola 2L",
    description: "Garrafa 2 litros gelada",
    price: 15.00,
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=800",
    category: "Bebidas",
    tags: ["2 Litros", "Família"]
  },
  {
    id: 33,
    name: "Guaraná 2L",
    description: "Garrafa 2 litros gelada",
    price: 13.00,
    image: "/images/products/guarana-2l.png",
    category: "Bebidas",
    tags: ["2 Litros", "Família"]
  },
  {
    id: 34,
    name: "Fanta Laranja 2L",
    description: "Garrafa 2 litros gelada",
    price: 13.00,
    image: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=800",
    category: "Bebidas",
    tags: ["2 Litros", "Família"]
  }
];

// Adicionais oferecidos durante o checkout
export interface AdicionalItem {
  id: number;
  name: string;
  price: number;
  icon: string;
}

export const ADICIONAIS_CHECKOUT: AdicionalItem[] = [
  { id: 1, name: "Bacon", price: 5.00, icon: "🥓" },
  { id: 2, name: "Calabresa", price: 5.00, icon: "🌭" },
  { id: 3, name: "Frango", price: 5.00, icon: "🍗" },
  { id: 4, name: "Cheddar", price: 4.00, icon: "🧀" },
  { id: 5, name: "Catupiry", price: 4.00, icon: "🫕" },
  { id: 6, name: "Ovo", price: 4.00, icon: "🍳" },
  { id: 7, name: "Vina Extra", price: 4.00, icon: "🌭" },
  { id: 8, name: "Hambúrguer", price: 6.00, icon: "🍔" },
];
