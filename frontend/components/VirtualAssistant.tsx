
import React, { useState, useEffect, useRef } from 'react';
import { HOT_DOGS, OFFICIAL_LOGO_URL } from '../constants';
import { HotDog, CartItem } from '../types';

interface VirtualAssistantProps {
  onAddToCart: (hotdog: HotDog) => void;
  onCheckout: (items: CartItem[], total: number) => void;
  cartItems: CartItem[];
}

// Estado pendente para confirmação
interface PendingAction {
  type: 'add_to_cart' | 'checkout' | 'remove_item' | 'clear_cart' | 'add_combo';
  product?: HotDog;
  quantity?: number;
  itemId?: number;
}

// ==================== SISTEMA DE NLP OFFLINE EXPANDIDO ====================

// Mapeamento de palavras-chave para cada produto (Hot Dogs)
const PRODUCT_KEYWORDS: Record<number, string[]> = {
  1: ['simples', 'basico', 'básico', 'normal', 'barato', 'economico', 'econômico'],
  2: ['duplo', 'duas', 'dois', '2 vina', '2 salsicha', 'dobrado'],
  3: ['frango', 'galinha', 'ave'],
  4: ['frango', 'cheddar', 'queijo'],
  5: ['frango', 'catupiry', 'requeijao', 'requeijão'],
  6: ['frango', '2 queijos', 'dois queijos', 'cheddar', 'catupiry'],
  7: ['bacon', 'porco', 'defumado'],
  8: ['calabresa', 'linguica', 'linguiça'],
  9: ['doguissimo', 'completo', 'tudo', 'mega', 'grande', 'especial'],
  // Lanches
  10: ['x burguer', 'xburguer', 'hamburguer', 'lanche', 'simples'],
  11: ['x salada', 'xsalada', 'salada', 'alface', 'tomate'],
  12: ['x calabresa', 'xcalabresa'],
  13: ['x bacon', 'xbacon'],
  14: ['x egg', 'xegg', 'ovo'],
  15: ['x frango', 'xfrango'],
  16: ['x tudo', 'xtudo', 'completo', 'mega'],
  // Bebidas
  27: ['refri', 'refrigerante', 'coca', 'guarana', 'guaraná', 'fanta', 'sprite', 'lata'],
  28: ['cerveja', 'beer', 'gelada', 'alcool', 'álcool'],
  29: ['refri', 'refrigerante', '2 litros', '2l', 'grande', 'familia', 'família']
};

// ===================== INTENÇÕES EXPANDIDAS =====================

// Palavras que indicam intenção de pedir
const ORDER_INTENTS = [
  'quero', 'queria', 'me vê', 'me ve', 'me da', 'me dá', 'pedir', 'peço', 'peco',
  'manda', 'traz', 'trazer', 'pode ser', 'vou querer', 'vou de', 'bora', 'fecha',
  'adiciona', 'coloca', 'bota', 'põe', 'poe', 'inclui', 'add', 'pra mim', 'favor',
  'gostaria', 'quero um', 'quero uma', 'me arruma', 'separa', 'reserva',
  // Gírias e expressões coloquiais
  'cola um', 'cola uma', 'manda bala', 'manda ver', 'solta', 'libera', 'desenrola',
  'me arranja', 'arranja aí', 'tô afim', 'to afim', 'tô querendo', 'to querendo',
  'bora de', 'partiu', 'quero experimentar', 'deixa eu provar', 'vou provar',
  'pega um', 'pega uma', 'me pega', 'traz aí', 'manda aí', 'me manda',
  'vou pedir', 'vou querer', 'pode mandar', 'pode trazer', 'traz pra mim',
  'quero comer', 'quero experimentar', 'deixa eu ver', 'vou levar', 'me leva'
];

// Palavras que indicam pedido de cardápio
const MENU_INTENTS = [
  'cardápio', 'cardapio', 'menu', 'opções', 'opcoes', 'tem o que', 'o que tem',
  'quais', 'lista', 'produtos', 'oferece', 'disponível', 'disponivel', 'catalogo',
  'catálogo', 'ver tudo', 'mostrar', 'mostra', 'quais são', 'quais sao',
  'o que vocês tem', 'o que voces tem', 'o que vende', 'vende o que',
  'quais lanches', 'quais hot dog', 'quais cachorro', 'tipos de', 'variedades'
];

// Palavras que indicam finalização
const CHECKOUT_INTENTS = [
  'finalizar', 'fechar', 'pagar', 'pagamento', 'checkout', 'conta', 'total',
  'quanto deu', 'quanto ficou', 'terminar', 'concluir', 'encerrar', 'confirmar pedido',
  'fecha a conta', 'fecha o pedido', 'só isso', 'so isso', 'é só isso', 'e so isso',
  'pode fechar', 'já pode', 'pronto', 'acabou', 'terminei', 'era isso',
  'quero pagar', 'vou pagar', 'bora pagar', 'manda a conta'
];

// Palavras que indicam carrinho/sacola
const CART_INTENTS = [
  'carrinho', 'sacola', 'pedido', 'meu pedido', 'o que eu pedi', 'meus itens',
  'revisar', 'ver pedido', 'conferir', 'o que tem', 'o que tá', 'o que ta',
  'quanto tá', 'quanto ta', 'quanto está', 'quanto esta', 'ver sacola',
  'minha sacola', 'meus lanches', 'minhas coisas'
];

// Saudações
const GREETING_INTENTS = [
  'oi', 'olá', 'ola', 'hey', 'eae', 'e aí', 'e ai', 'opa', 'bom dia', 'boa tarde',
  'boa noite', 'salve', 'fala', 'beleza', 'tudo bem', 'como vai', 'iae', 'eai',
  'fala aí', 'fala ai', 'opa mano', 'e aew', 'eaew', 'oie', 'oii', 'oiii',
  'buenas', 'boas', 'boa', 'dae', 'qual é', 'qual e'
];

// Confirmação positiva
const CONFIRM_INTENTS = [
  'sim', 's', 'yes', 'isso', 'isso mesmo', 'pode', 'pode ser', 'confirma', 'confirmo',
  'pode adicionar', 'quero', 'quero sim', 'bora', 'vai', 'manda', 'fechou', 'beleza',
  'ok', 'okay', 'certo', 'correto', 'exato', 'perfeito', 'isso aí', 'isso ai',
  'com certeza', 'claro', 'óbvio', 'obvio', 'lógico', 'logico', 'positivo', 'afirmativo',
  'isso mesmo', 'é isso', 'e isso', 'é esse', 'e esse', 'esse mesmo', 'quero esse',
  'manda esse', 'pode mandar', 'tá certo', 'ta certo', 'tá bom', 'ta bom', 'boa'
];

// Negação
const DENY_INTENTS = [
  'não', 'nao', 'n', 'no', 'cancela', 'cancelar', 'deixa', 'deixa pra lá',
  'esquece', 'não quero', 'nao quero', 'mudei de ideia', 'errado', 'outro',
  'outra coisa', 'diferente', 'nada', 'nenhum', 'desisto', 'para', 'pare',
  'peraí', 'perai', 'espera', 'calma', 'não é', 'nao e', 'não era', 'nao era',
  'não é esse', 'nao e esse', 'errei', 'me enganei', 'troquei'
];

// Perguntar preço
const PRICE_INTENTS = [
  'quanto', 'preço', 'preco', 'valor', 'custa', 'custar', 'sai por', 'fica',
  'qual o preço', 'qual o preco', 'quanto custa', 'quanto é', 'quanto e',
  'quanto sai', 'quanto fica', 'quanto tá', 'quanto ta', 'é caro', 'e caro',
  'é barato', 'e barato', 'valores', 'tabela de preços', 'mais barato', 'mais caro'
];

// Perguntar ingredientes/descrição
const INGREDIENT_INTENTS = [
  'ingrediente', 'o que tem', 'o que vem', 'como é', 'como e', 'qual é', 'qual e',
  'descreve', 'descrição', 'descricao', 'fala sobre', 'conta sobre', 'explica',
  'o que é', 'o que e', 'feito de', 'leva o que', 'tem o que dentro',
  'composição', 'composicao', 'acompanha', 'vem com', 'inclui o que'
];

// Pedir recomendação
const RECOMMENDATION_INTENTS = [
  'recomend', 'indica', 'sugest', 'melhor', 'mais pedido', 'mais vendido',
  'famoso', 'popular', 'sucesso', 'top', 'campeão', 'campeao', 'favorito',
  'o que você indica', 'o que voce indica', 'qual você indica', 'qual voce indica',
  'o que é bom', 'o que e bom', 'qual é bom', 'qual e bom', 'dica',
  'me indica', 'indica aí', 'indica ai', 'qual pedir', 'o que pedir',
  'não sei o que', 'nao sei o que', 'estou em dúvida', 'estou em duvida',
  'me ajuda a escolher', 'ajuda a escolher', 'escolher', 'qual escolho',
  'novidade', 'especial do dia', 'promoção', 'promocao'
];

// Pedir por categoria
const CATEGORY_INTENTS = {
  bebidas: ['bebida', 'beber', 'tomar', 'refrescar', 'sede', 'líquido', 'liquido', 'drink', 'refresco'],
  hotdogs: ['dog', 'hotdog', 'cachorro quente', 'cachorro-quente', 'salsicha', 'vina'],
  lanches: ['lanche', 'hamburguer', 'hambúrguer', 'x-', 'burger', 'sanduiche', 'sanduíche'],
  porcoes: ['porcao', 'porção', 'batata', 'mandioca', 'isca', 'cebola', 'frita', 'petisco']
};

// Agradecimentos
const THANKS_INTENTS = [
  'obrigado', 'obrigada', 'valeu', 'vlw', 'tmj', 'thanks', 'agradeço', 'agradeco',
  'muito obrigado', 'muito obrigada', 'brigadão', 'brigadao', 'brigado', 'top demais',
  'show', 'perfeito', 'excelente', 'maravilha', 'sensacional'
];

// Despedidas
const GOODBYE_INTENTS = [
  'tchau', 'até', 'ate', 'bye', 'adeus', 'falou', 'flw', 'fui', 'já vou',
  'ja vou', 'tenho que ir', 'preciso ir', 'até mais', 'ate mais', 'até logo',
  'ate logo', 'nos vemos', 'fuiii'
];

// Remover item
const REMOVE_INTENTS = [
  'remov', 'tira', 'tirar', 'exclu', 'delet', 'apaga', 'cancela', 'retira',
  'não quero mais', 'nao quero mais', 'desist', 'remove', 'elimina'
];

// Limpar carrinho
const CLEAR_CART_INTENTS = [
  'limpa', 'limpar', 'esvazia', 'esvaziar', 'zerar', 'apagar tudo', 'remover tudo',
  'tirar tudo', 'cancelar tudo', 'começar de novo', 'comecar de novo', 'recomeçar'
];

// Combo
const COMBO_INTENTS = [
  'combo', 'promoção', 'promocao', 'promo', 'junto', 'acompanha', 'pacote',
  'combinado', 'oferta', 'desconto', 'mais bebida', 'com bebida'
];

// Fome/urgência (expressões divertidas)
const HUNGRY_INTENTS = [
  'fome', 'morrendo de fome', 'faminto', 'esfomeado', 'precisando comer',
  'barriga roncando', 'urgente', 'rápido', 'rapido', 'depressa', 'logo'
];

// Elogios
const COMPLIMENT_INTENTS = [
  'bom', 'delicioso', 'gostoso', 'maravilhoso', 'incrível', 'incrivel',
  'melhor', 'excelente', 'fantástico', 'fantastico', 'sensacional', 'top',
  'demais', 'animal', 'show', 'nota 10', 'perfeito'
];

// Reclamação/problema
const COMPLAINT_INTENTS = [
  'problema', 'ruim', 'péssimo', 'pessimo', 'horrível', 'horrivel', 'demor',
  'errad', 'reclamaç', 'reclamac', 'insatisf'
];

// Palavras para quantidade
const QUANTITY_WORDS: Record<string, number> = {
  'um': 1, 'uma': 1, 'uno': 1,
  'dois': 2, 'duas': 2, 'duplo': 2, 'dupla': 2,
  'três': 3, 'tres': 3, 'triplo': 3,
  'quatro': 4, 'cinco': 5, 'seis': 6,
  'meia dúzia': 6, 'meia duzia': 6,
  'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10
};

// ===================== FUNÇÕES AUXILIARES =====================

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const similarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return (longer.length - costs[s2.length]) / longer.length;
};

const findProductByKeywords = (text: string, products: HotDog[]): { product: HotDog | null; confidence: number } => {
  const normalizedText = normalizeText(text);
  const words = normalizedText.split(' ');

  let bestMatch: HotDog | null = null;
  let bestScore = 0;

  for (const product of products) {
    let score = 0;
    const keywords = PRODUCT_KEYWORDS[product.id] || [];
    const productNameNormalized = normalizeText(product.name);
    const productNameWords = productNameNormalized.split(' ');

    if (normalizedText.includes(productNameNormalized)) {
      score += 10;
    }

    for (const nameWord of productNameWords) {
      if (nameWord.length > 2) {
        for (const word of words) {
          if (word.length > 2) {
            if (word === nameWord) {
              score += 5;
            } else if (word.includes(nameWord) || nameWord.includes(word)) {
              score += 3;
            } else if (similarity(word, nameWord) > 0.7) {
              score += 2;
            }
          }
        }
      }
    }

    for (const keyword of keywords) {
      for (const word of words) {
        if (word === keyword) {
          score += 4;
        } else if (word.includes(keyword) || keyword.includes(word)) {
          score += 2;
        } else if (similarity(word, keyword) > 0.75) {
          score += 1;
        }
      }
    }

    const categoryNormalized = normalizeText(product.category);
    if (normalizedText.includes(categoryNormalized)) {
      score += 2;
    }

    for (const tag of product.tags || []) {
      const tagNormalized = normalizeText(tag);
      if (normalizedText.includes(tagNormalized)) {
        score += 3;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  const confidence = bestScore > 0 ? Math.min(bestScore / 15, 1) : 0;
  return {
    product: confidence > 0.2 ? bestMatch : null,
    confidence
  };
};

const findProductsByCategory = (text: string, products: HotDog[]): HotDog[] => {
  const normalizedText = normalizeText(text);

  if (CATEGORY_INTENTS.bebidas.some(k => normalizedText.includes(k))) {
    return products.filter(p => p.category === 'Bebidas');
  }
  if (CATEGORY_INTENTS.hotdogs.some(k => normalizedText.includes(k))) {
    return products.filter(p => p.category === 'Hot Dogs');
  }
  if (CATEGORY_INTENTS.lanches.some(k => normalizedText.includes(k))) {
    return products.filter(p => p.category === 'Lanches');
  }
  if (CATEGORY_INTENTS.porcoes.some(k => normalizedText.includes(k))) {
    return products.filter(p => p.category === 'Porcoes');
  }

  return [];
};

const extractQuantity = (text: string): number => {
  const normalizedText = normalizeText(text);

  for (const [word, num] of Object.entries(QUANTITY_WORDS)) {
    if (normalizedText.includes(word)) {
      return num;
    }
  }

  const numMatch = text.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num > 0 && num <= 10) return num;
  }

  return 1;
};

const checkIntent = (text: string, intents: string[]): boolean => {
  const normalizedText = normalizeText(text);
  return intents.some(intent => normalizedText.includes(normalizeText(intent)));
};

const checkIntentPartial = (text: string, intents: string[]): boolean => {
  const normalizedText = normalizeText(text);
  return intents.some(intent => {
    const normalizedIntent = normalizeText(intent);
    return normalizedText.includes(normalizedIntent) || normalizedIntent.includes(normalizedText);
  });
};

// ===================== RESPOSTAS =====================

const getGreetingResponse = (): string => {
  const responses = [
    "E aí, campeão! 🔥 Tá com fome grande hoje?\n\nO que vai ser? Pode pedir ou digita 'cardápio'!",
    "Fala, parceiro! Aqui é o Chapa Quente! 🌭\n\nQual dogão vai encarar hoje?",
    "Opa! Beleza? Bora matar essa fome! 😋\n\nO que você quer pedir?",
    "Salve, salve! 🔥 Tô pronto pra anotar!\n\nManda ver! O que vai querer?",
    "E aí! Chegou no lugar certo! 🌭\n\nDiz aí, o que tá afim de comer?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getMenuResponse = (products: HotDog[]): string => {
  const categories = [...new Set(products.map(p => p.category))];
  let menu = "🌭 CARDÁPIO CHAPA QUENTE 🔥\n\n";

  for (const category of categories) {
    menu += `━━ ${category.toUpperCase()} ━━\n`;
    const categoryProducts = products.filter(p => p.category === category);
    for (const p of categoryProducts) {
      menu += `• ${p.name}\n   R$ ${p.price.toFixed(2)}\n`;
    }
    menu += "\n";
  }

  menu += "Qual desses você quer? 😋";
  return menu;
};

const getCartResponse = (cartItems: CartItem[]): string => {
  if (cartItems.length === 0) {
    return "📦 Sua sacola tá vazia ainda! 😅\n\nBora pedir algo? Diz aí o que você quer ou pede o cardápio!";
  }

  let response = "📦 SEU PEDIDO ATUAL:\n\n";
  let total = 0;

  for (const item of cartItems) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    response += `🌭 ${item.quantity}x ${item.name}\n   R$ ${itemTotal.toFixed(2)}\n`;
  }

  response += `\n━━━━━━━━━━━━━━━━━\n`;
  response += `💰 TOTAL: R$ ${total.toFixed(2)}\n\n`;
  response += "Quer mais alguma coisa?\nOu diz 'finalizar' pra fechar!";

  return response;
};

const getNotUnderstoodResponse = (): string => {
  const responses = [
    "Hmm, não entendi bem... 🤔\n\nTenta assim:\n• \"Quero um Clássico Imperial\"\n• \"Mostra o cardápio\"\n• \"O que você indica?\"",
    "Opa, não peguei essa! 😅\n\nPode falar:\n• Nome do lanche\n• \"Cardápio\" pra ver opções\n• \"Ajuda\" se precisar",
    "Eita, essa não entendi!\n\nDicas:\n• Diz o nome do lanche\n• Ou pede \"recomendação\"\n• Ou \"cardápio\" pra ver tudo",
    "Não captei, parceiro! 🤔\n\nTenta de novo ou digita:\n• \"Cardápio\" - ver opções\n• \"Ajuda\" - como usar\n• Ou o nome do lanche!"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getConfirmationRequest = (product: HotDog, quantity: number): string => {
  return `Entendi! Você quer:\n\n🌭 ${quantity}x ${product.name}\n💰 R$ ${(product.price * quantity).toFixed(2)}\n\n"${product.description}"\n\n✅ Confirma? (sim/não)`;
};

const getAddedToCartResponse = (product: HotDog, quantity: number): string => {
  const responses = [
    `Fechou! ✅ ${quantity}x ${product.name} na sacola!\n\nQuer mais alguma coisa? 🔥`,
    `Boa! ✅ ${quantity}x ${product.name} garantido!\n\nMais algo? Uma bebida talvez?`,
    `Anotado! ✅ ${quantity}x ${product.name} confirmado!\n\nPode pedir mais ou dizer 'finalizar'!`,
    `Show! ✅ ${quantity}x ${product.name} adicionado!\n\nO que mais vai querer?`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getCancelResponse = (): string => {
  const responses = [
    "Beleza, cancelei! 👍\n\nO que você quer então?",
    "Ok, esquece isso! 👍\n\nQuer ver outras opções?",
    "Tranquilo, cancelado! 👍\n\nÉ só pedir outra coisa!",
    "Sem problemas! 👍\n\nManda outro pedido aí!"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getCheckoutConfirmation = (cartItems: CartItem[]): string => {
  if (cartItems.length === 0) {
    return "Opa, sua sacola tá vazia! 😅\n\nPede algo primeiro!";
  }

  let response = "📋 RESUMO DO PEDIDO:\n\n";
  let total = 0;

  for (const item of cartItems) {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    response += `🌭 ${item.quantity}x ${item.name} - R$ ${itemTotal.toFixed(2)}\n`;
  }

  response += `\n━━━━━━━━━━━━━━━━━\n`;
  response += `💰 TOTAL: R$ ${total.toFixed(2)}\n\n`;
  response += `✅ Confirma? (sim/não)`;

  return response;
};

const getCheckoutCompleteResponse = (total: number): string => {
  return `🎉 PEDIDO CONFIRMADO! 🎉\n\n💰 Total: R$ ${total.toFixed(2)}\n\n✅ Enviado pra cozinha!\n\n🔥 Valeu pela preferência!\nVolta sempre pro CHAPA QUENTE! 🌭`;
};

const getPriceResponse = (product: HotDog): string => {
  return `💰 ${product.name}\n\nPreço: R$ ${product.price.toFixed(2)}\n\n"${product.description}"\n\nQuer adicionar? (sim/não)`;
};

const getIngredientResponse = (product: HotDog): string => {
  return `🌭 ${product.name}\n\n📝 ${product.description}\n\n💰 R$ ${product.price.toFixed(2)}\n📌 ${product.tags?.join(', ')}\n\nQuer pedir esse? (sim/não)`;
};

const getRecommendationResponse = (products: HotDog[]): string => {
  const topPicks = products.filter(p => p.category !== 'Bebidas').slice(0, 3);
  let response = "🏆 MAIS PEDIDOS DA CASA:\n\n";

  for (const p of topPicks) {
    response += `⭐ ${p.name}\n   R$ ${p.price.toFixed(2)}\n   "${p.description.substring(0, 50)}..."\n\n`;
  }

  response += "Qual desses te interessou? 😋";
  return response;
};

const getCategoryResponse = (products: HotDog[], categoryName: string): string => {
  if (products.length === 0) {
    return "Hmm, não encontrei nada nessa categoria! 🤔\n\nQuer ver o cardápio completo?";
  }

  let response = `🔥 ${categoryName.toUpperCase()}:\n\n`;

  for (const p of products) {
    response += `• ${p.name} - R$ ${p.price.toFixed(2)}\n`;
  }

  response += "\nQual você quer?";
  return response;
};

const getThanksResponse = (): string => {
  const responses = [
    "Valeu, campeão! 🔥 Precisando, é só chamar!",
    "Tmj! 🌭 Fico feliz em ajudar!",
    "Show! 😄 Qualquer coisa, tô aqui!",
    "Opa, por nada! 🔥 Bom apetite!"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getGoodbyeResponse = (): string => {
  const responses = [
    "Falou, campeão! 🔥 Volta sempre!\n\nCHAPA QUENTE - Pra quem tem fome grande! 🌭",
    "Até mais! 😄 Foi um prazer atender!\n\nQualquer fome, já sabe onde ir!",
    "Tchau! 🌭 Valeu pela preferência!\n\nTe esperamos de volta!",
    "Fui! 🔥 Qualquer hora a gente se vê!\n\nAbraço do Chapa Quente!"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getHungryResponse = (): string => {
  const responses = [
    "Eita, fome braba hein! 🔥🔥\n\nBora resolver isso AGORA!\n\nQual dogão vai ser? Ou quer ver o cardápio?",
    "FOME GRANDE detectada! 🚨🌭\n\nCalma que o Chapa resolve!\n\nManda o pedido aí, rapidão!",
    "Barriga roncando? 😱\n\nTá no lugar certo!\n\nMe diz o que quer e a gente mata essa fome!"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getHelpResponse = (): string => {
  return `🤝 COMO POSSO AJUDAR:\n
📋 VER CARDÁPIO
"Mostra o cardápio"
"O que tem pra comer?"

🌭 FAZER PEDIDO
"Quero um Clássico Imperial"
"Me vê 2 com cheddar e bacon"
"Manda um vegetariano"

💡 PEDIR SUGESTÃO
"O que você indica?"
"Qual o mais pedido?"

💰 VER PREÇOS
"Quanto custa o Ouro Real?"
"Qual o preço do combo?"

🛒 VER SACOLA
"Meu pedido"
"O que eu pedi?"

✅ FINALIZAR
"Quero fechar"
"Finalizar pedido"

É só mandar! 🔥`;
};

const getComplimentResponse = (): string => {
  const responses = [
    "É nóis! 🔥 Aqui a qualidade é garantida!\n\nQual vai pedir?",
    "Valeu! 😄 Tamo sempre melhorando!\n\nBora matar essa fome?",
    "Show! 🌭 A galera curte mesmo!\n\nO que vai querer hoje?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

const getComplaintResponse = (): string => {
  return "Poxa, sinto muito! 😔\n\nSe tiver algum problema com seu pedido, por favor entre em contato pelo WhatsApp ou fale com nossa equipe!\n\nQueremos resolver isso pra você! 🙏";
};

// ===================== COMPONENTE PRINCIPAL =====================

const VirtualAssistant: React.FC<VirtualAssistantProps> = ({ onAddToCart, onCheckout, cartItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'E aí, campeão! Aqui é o Chapa Quente! 🔥\n\nCom fome grande hoje? Qual dogão vai encarar?\n\n(Pode pedir direto ou digitar "cardápio"!)' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const processMessage = (userText: string): string => {
    const normalizedText = normalizeText(userText);

    // ============ VERIFICAR SE HÁ AÇÃO PENDENTE ============
    if (pendingAction) {
      if (checkIntent(userText, CONFIRM_INTENTS)) {
        if (pendingAction.type === 'add_to_cart' && pendingAction.product && pendingAction.quantity) {
          for (let i = 0; i < pendingAction.quantity; i++) {
            onAddToCart(pendingAction.product);
          }
          const response = getAddedToCartResponse(pendingAction.product, pendingAction.quantity);
          setPendingAction(null);
          return response;
        }

        if (pendingAction.type === 'checkout') {
          const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          onCheckout(cartItems, total);
          setPendingAction(null);
          return getCheckoutCompleteResponse(total);
        }
      }

      if (checkIntent(userText, DENY_INTENTS)) {
        setPendingAction(null);
        return getCancelResponse();
      }

      // Continuar tentando processar como novo comando
      setPendingAction(null);
    }

    // ============ PROCESSAR NOVA MENSAGEM ============

    // Saudação
    if (checkIntent(userText, GREETING_INTENTS) && normalizedText.split(' ').length <= 5) {
      return getGreetingResponse();
    }

    // Agradecimento
    if (checkIntent(userText, THANKS_INTENTS)) {
      return getThanksResponse();
    }

    // Despedida
    if (checkIntent(userText, GOODBYE_INTENTS)) {
      return getGoodbyeResponse();
    }

    // Fome urgente
    if (checkIntent(userText, HUNGRY_INTENTS) && !checkIntent(userText, ORDER_INTENTS)) {
      return getHungryResponse();
    }

    // Elogio
    if (checkIntent(userText, COMPLIMENT_INTENTS) && normalizedText.split(' ').length <= 4) {
      return getComplimentResponse();
    }

    // Reclamação
    if (checkIntent(userText, COMPLAINT_INTENTS)) {
      return getComplaintResponse();
    }

    // Ajuda
    if (normalizedText.includes('ajuda') || normalizedText.includes('help') || normalizedText.includes('como faz')) {
      return getHelpResponse();
    }

    // Cardápio
    if (checkIntent(userText, MENU_INTENTS)) {
      return getMenuResponse(HOT_DOGS);
    }

    // Carrinho
    if (checkIntent(userText, CART_INTENTS)) {
      return getCartResponse(cartItems);
    }

    // Checkout
    if (checkIntent(userText, CHECKOUT_INTENTS)) {
      if (cartItems.length === 0) {
        return "Opa, sua sacola tá vazia! 😅\n\nPede algo primeiro!\nDigita 'cardápio' pra ver as opções.";
      }
      setPendingAction({ type: 'checkout' });
      return getCheckoutConfirmation(cartItems);
    }

    // Recomendação
    if (checkIntent(userText, RECOMMENDATION_INTENTS)) {
      return getRecommendationResponse(HOT_DOGS);
    }

    // Busca por categoria
    const categoryProducts = findProductsByCategory(userText, HOT_DOGS);
    if (categoryProducts.length > 0 && !checkIntent(userText, ORDER_INTENTS)) {
      const categoryName = categoryProducts[0].category;
      return getCategoryResponse(categoryProducts, categoryName);
    }

    // Preço de produto específico
    if (checkIntent(userText, PRICE_INTENTS)) {
      const { product } = findProductByKeywords(userText, HOT_DOGS);
      if (product) {
        setPendingAction({ type: 'add_to_cart', product, quantity: 1 });
        return getPriceResponse(product);
      }
      // Preço geral - mostrar cardápio
      return getMenuResponse(HOT_DOGS);
    }

    // Ingredientes/descrição
    if (checkIntent(userText, INGREDIENT_INTENTS)) {
      const { product } = findProductByKeywords(userText, HOT_DOGS);
      if (product) {
        setPendingAction({ type: 'add_to_cart', product, quantity: 1 });
        return getIngredientResponse(product);
      }
    }

    // Limpar carrinho
    if (checkIntent(userText, CLEAR_CART_INTENTS)) {
      if (cartItems.length === 0) {
        return "Sua sacola já tá vazia! 😅\n\nBora pedir algo?";
      }
      return "⚠️ Pra limpar a sacola, você pode clicar no ícone do carrinho no topo da página!\n\nOu quer continuar pedindo?";
    }

    // Tentar identificar produto (pedido)
    const hasOrderIntent = checkIntent(userText, ORDER_INTENTS);
    const { product, confidence } = findProductByKeywords(userText, HOT_DOGS);

    if (product && (hasOrderIntent || confidence > 0.4)) {
      const quantity = extractQuantity(userText);
      setPendingAction({ type: 'add_to_cart', product, quantity });
      return getConfirmationRequest(product, quantity);
    }

    // Se encontrou produto mas sem muita certeza
    if (product && confidence > 0.25) {
      setPendingAction({ type: 'add_to_cart', product, quantity: extractQuantity(userText) });
      return `Você tá falando do ${product.name}? 🤔\n\n💰 R$ ${product.price.toFixed(2)}\n\n"${product.description}"\n\nÉ esse? (sim/não)`;
    }

    // Não entendeu
    return getNotUnderstoodResponse();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputValue('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));

    const response = processMessage(userText);
    setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start pointer-events-none">
      {isOpen && (
        <div className="pointer-events-auto w-[340px] sm:w-[400px] bg-[#1E3A8A] border-4 border-[#FEE135] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-left fade-in duration-300">
          {/* Header */}
          <div className="p-5 bg-[#FEE135] flex items-center justify-between">
            <div className="flex items-center space-x-3 text-[#1E3A8A]">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-[#1E3A8A] overflow-hidden shadow-md">
                <img src={OFFICIAL_LOGO_URL} alt="Chapa Quente Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-sm uppercase">Atendimento Chapa</p>
                <p className="text-[10px] font-black opacity-70 uppercase tracking-tighter">
                  🟢 Online • {cartItems.length > 0 ? `${cartItems.reduce((s, i) => s + i.quantity, 0)} item(s)` : 'Fome Grande!'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#1E3A8A] w-10 h-10 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/40 transition-colors">
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* Messages - Scrollbar Estilizada */}
          <div
            ref={scrollRef}
            className="chat-scrollbar flex-1 h-[350px] overflow-y-scroll p-5 space-y-4 bg-gradient-to-b from-[#1E3A8A] to-[#1a3276]"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-semibold whitespace-pre-line leading-relaxed ${m.role === 'user'
                  ? 'bg-[#FEE135] text-[#1E3A8A] rounded-tr-none shadow-lg'
                  : 'bg-white text-[#1E3A8A] rounded-tl-none shadow-xl'
                  }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-[#FEE135] rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-[#FEE135] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2.5 h-2.5 bg-[#FEE135] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!pendingAction && (
            <div className="px-4 pt-3 pb-1 bg-black/20 flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setMessages(prev => [...prev, { role: 'user', text: 'Cardápio' }]);
                  setTimeout(() => {
                    setMessages(prev => [...prev, { role: 'assistant', text: getMenuResponse(HOT_DOGS) }]);
                  }, 500);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors"
              >
                📋 Cardápio
              </button>
              <button
                onClick={() => {
                  setMessages(prev => [...prev, { role: 'user', text: 'Me indica algo' }]);
                  setTimeout(() => {
                    setMessages(prev => [...prev, { role: 'assistant', text: getRecommendationResponse(HOT_DOGS) }]);
                  }, 500);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors"
              >
                ⭐ Sugestões
              </button>
              <button
                onClick={() => {
                  setMessages(prev => [...prev, { role: 'user', text: 'Meu pedido' }]);
                  setTimeout(() => {
                    setMessages(prev => [...prev, { role: 'assistant', text: getCartResponse(cartItems) }]);
                  }, 500);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors"
              >
                🛒 Sacola
              </button>
              {cartItems.length > 0 && (
                <button
                  onClick={() => {
                    setMessages(prev => [...prev, { role: 'user', text: 'Finalizar' }]);
                    setPendingAction({ type: 'checkout' });
                    setTimeout(() => {
                      setMessages(prev => [...prev, { role: 'assistant', text: getCheckoutConfirmation(cartItems) }]);
                    }, 500);
                  }}
                  className="px-3 py-1.5 bg-green-500/80 hover:bg-green-500 text-white text-xs font-bold rounded-full transition-colors"
                >
                  ✅ Finalizar
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-black/20 border-t border-white/10">
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-inner">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={pendingAction ? "Digite 'sim' ou 'não'..." : "O que vai querer hoje?"}
                className="flex-1 bg-transparent text-[#1E3A8A] border-none focus:ring-0 focus:outline-none text-sm px-3 font-bold placeholder:text-gray-400"
              />
              <button
                onClick={handleSendMessage}
                className="w-12 h-12 rounded-xl bg-[#1E3A8A] text-[#FEE135] flex items-center justify-center active:scale-95 transition-all hover:bg-[#1E3A8A]/90"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative group w-24 h-24"
      >
        <div className="absolute inset-0 bg-[#FEE135] rounded-full animate-ping opacity-30 group-hover:opacity-0"></div>
        <div className="relative w-full h-full bg-white border-4 border-[#1E3A8A] rounded-full shadow-2xl flex items-center justify-center overflow-hidden hover:scale-110 transition-transform">
          <img
            src={OFFICIAL_LOGO_URL}
            alt="Abrir Chat"
            className="w-full h-full object-cover"
          />
        </div>
        {cartItems.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-black shadow-lg">
            {cartItems.reduce((s, i) => s + i.quantity, 0)}
          </div>
        )}
        {!isOpen && cartItems.length === 0 && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-black animate-bounce shadow-lg">
            1
          </div>
        )}
      </button>
    </div>
  );
};

export default VirtualAssistant;
