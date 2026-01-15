
import React, { useState } from 'react';
import { CartItem } from '../types';
import { ADICIONAIS_CHECKOUT, AdicionalItem } from '../constants';

interface CheckoutModalProps {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onConfirm: (deliveryInfo: any, paymentMethod: string, adicionaisTotal?: number) => void;
}

type DeliveryMode = 'pickup' | 'delivery' | null;

// Coordenadas REAIS da Loja - Rua Olegario Garcia, 235 - Campo Largo da Roseira, São José dos Pinhais - PR
// Coordenadas obtidas diretamente do Google Maps
const STORE_LOCATION = {
  lat: -25.6478987,
  lng: -49.186565,
  address: "Rua Olegário Garcia, 235 - Campo Largo da Roseira, São José dos Pinhais - PR"
};

// Taxa por KM e limites
const DELIVERY_RATE_PER_KM = 2.00;
const MIN_DELIVERY_FEE = 5.00; // Taxa mínima
const MAX_DELIVERY_DISTANCE = 15; // Limite de 15km

// Função para calcular distância REAL de rota usando OSRM (Open Source Routing Machine)
const calculateRealRouteDistance = async (
  storeLat: number,
  storeLng: number,
  customerLat: number,
  customerLng: number
): Promise<{ distance: number; duration: number } | null> => {
  try {
    // OSRM usa formato: longitude,latitude (inverso do Google Maps)
    const url = `https://router.project-osrm.org/route/v1/driving/${storeLng},${storeLat};${customerLng},${customerLat}?overview=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: route.distance / 1000, // Converte metros para km
        duration: route.duration / 60 // Converte segundos para minutos
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao calcular rota OSRM:', error);
    return null;
  }
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ items, total, onClose, onConfirm }) => {
  const [step, setStep] = useState(1); // 1: Modo, 2: Endereço (se delivery), 3: Adicionais, 4: Pagamento
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(null);
  const [streetAddress, setStreetAddress] = useState(''); // Rua e bairro
  const [houseNumber, setHouseNumber] = useState(''); // Número da residência
  const [complement, setComplement] = useState(''); // Complemento (opcional)
  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0); // Distância real em km
  const [estimatedMinutes, setEstimatedMinutes] = useState(0); // Tempo estimado de entrega
  const [isOutOfRange, setIsOutOfRange] = useState(false); // Fora da área de entrega
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedAdicionais, setSelectedAdicionais] = useState<Record<number, number>>({});
  const [customerCoords, setCustomerCoords] = useState<{ lat: number, lng: number } | null>(null);

  // Estados para Autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calcula taxa e verifica limite
  const calculateDeliveryFee = async (customerLat: number, customerLng: number) => {
    const routeData = await calculateRealRouteDistance(
      STORE_LOCATION.lat,
      STORE_LOCATION.lng,
      customerLat,
      customerLng
    );

    if (routeData) {
      const distance = Math.round(routeData.distance * 10) / 10; // 1 casa decimal
      setDistanceKm(distance);
      setEstimatedMinutes(Math.round(routeData.duration));

      // Verifica se está dentro do limite de 15km
      if (distance > MAX_DELIVERY_DISTANCE) {
        setIsOutOfRange(true);
        setDeliveryFee(0);
      } else {
        setIsOutOfRange(false);
        const fee = Math.max(MIN_DELIVERY_FEE, distance * DELIVERY_RATE_PER_KM);
        setDeliveryFee(Math.round(fee * 100) / 100);
      }
    } else {
      // Fallback se OSRM falhar - usa taxa mínima
      setDistanceKm(0);
      setDeliveryFee(MIN_DELIVERY_FEE);
      setIsOutOfRange(false);
    }
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    setShowSuggestions(false);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Salva as coordenadas do cliente
          setCustomerCoords({ lat: latitude, lng: longitude });

          // Calcula a distância REAL de rota
          await calculateDeliveryFee(latitude, longitude);

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
              { headers: { 'Accept-Language': 'pt-BR' } }
            );
            const data = await response.json();
            if (data && data.address) {
              const { road, suburb, city, town, village } = data.address;
              const cityName = city || town || village || "";
              const mainStreet = road || "Rua não identificada";
              const neighborhood = suburb ? `, ${suburb}` : "";
              const streetOnly = `${mainStreet}${neighborhood} - ${cityName}`;
              setStreetAddress(streetOnly);
            } else {
              setStreetAddress("Endereço não encontrado. Por favor, digite manualmente.");
            }
          } catch (error) {
            console.error("Erro na geolocalização reversa:", error);
            setStreetAddress("Erro ao buscar endereço. Por favor, digite manualmente.");
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Erro GPS:", error);
          alert("Não conseguimos obter sua localização. Verifique as permissões do seu navegador.");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Seu navegador não suporta geolocalização.");
      setLocationLoading(false);
    }
  };

  // Busca sugestões de endereço (Autocomplete)
  const searchAddressSuggestions = async (query: string) => {
    if (query.length < 5) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      // Prioriza busca no Paraná/Brasil
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Paraná, Brasil')}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setAddressSuggestions(data);
        setShowSuggestions(true);
      } else {
        // Tenta busca mais genérica
        const response2 = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const data2 = await response2.json();
        setAddressSuggestions(data2 || []);
        setShowSuggestions(data2 && data2.length > 0);
      }
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
      setAddressSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Seleciona uma sugestão de endereço
  const selectAddressSuggestion = async (suggestion: any) => {
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);

    // Formata o endereço
    const addr = suggestion.address || {};
    const road = addr.road || suggestion.display_name.split(',')[0];
    const suburb = addr.suburb || addr.neighbourhood || '';
    const city = addr.city || addr.town || addr.village || '';

    const formattedAddress = suburb
      ? `${road}, ${suburb} - ${city}`
      : `${road} - ${city}`;

    setStreetAddress(formattedAddress);
    setCustomerCoords({ lat: latitude, lng: longitude });
    setShowSuggestions(false);
    setAddressSuggestions([]);

    // Calcula a taxa de entrega
    await calculateDeliveryFee(latitude, longitude);
  };

  // Handler para input de endereço com debounce
  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStreetAddress(val);

    // Limpa coordenadas anteriores quando edita
    if (customerCoords) {
      setCustomerCoords(null);
      setDeliveryFee(0);
      setDistanceKm(0);
      setIsOutOfRange(false);
    }

    // Cancela busca anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Debounce - aguarda 500ms antes de buscar
    if (val.length >= 5) {
      const timeout = setTimeout(() => {
        searchAddressSuggestions(val);
      }, 500);
      setSearchTimeout(timeout);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Montar endereço completo para salvar
  const getFullAddress = (): string => {
    const parts = [streetAddress];
    if (houseNumber) parts.push(`Nº ${houseNumber}`);
    if (complement) parts.push(complement);
    return parts.join(' - ');
  };

  const toggleAdicional = (adicional: AdicionalItem) => {
    setSelectedAdicionais(prev => {
      const current = prev[adicional.id] || 0;
      if (current > 0) {
        const { [adicional.id]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [adicional.id]: 1 };
      }
    });
  };

  const getAdicionaisTotal = (): number => {
    return Object.entries(selectedAdicionais).reduce((sum, [id, qty]) => {
      const adicional = ADICIONAIS_CHECKOUT.find(a => a.id === Number(id));
      return sum + (adicional ? adicional.price * qty : 0);
    }, 0);
  };

  const getSelectedAdicionaisNames = (): string[] => {
    return Object.entries(selectedAdicionais)
      .filter(([_, qty]: [string, number]) => qty > 0)
      .map(([id]) => {
        const adicional = ADICIONAIS_CHECKOUT.find(a => a.id === Number(id));
        return adicional?.name || '';
      });
  };

  // Se retirar no local, não tem frete
  const actualDeliveryFee = deliveryMode === 'pickup' ? 0 : deliveryFee;
  const finalTotal = total + actualDeliveryFee + getAdicionaisTotal();

  // Navegação condicional
  const goToNextStep = () => {
    if (step === 1) {
      // Após escolher modo de entrega
      if (deliveryMode === 'pickup') {
        setStep(3); // Pula para adicionais
      } else {
        setStep(2); // Vai para endereço
      }
    } else if (step === 2) {
      setStep(3); // Vai para adicionais
    } else if (step === 3) {
      setStep(4); // Vai para pagamento
    }
  };

  const goToPrevStep = () => {
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      if (deliveryMode === 'pickup') {
        setStep(1); // Volta para escolha de modo
      } else {
        setStep(2); // Volta para endereço
      }
    } else if (step === 2) {
      setStep(1);
    }
  };

  // Validações
  const isStep1Valid = deliveryMode !== null;
  const isStep2Valid = streetAddress.trim().length >= 5 && houseNumber.trim().length >= 1 && !isOutOfRange;
  const isStep4Valid = paymentMethod !== '';

  // Calcular número do passo visual
  const getVisualSteps = () => {
    if (deliveryMode === 'pickup') {
      return [
        { num: 1, label: 'Receber', step: 1 },
        { num: 2, label: 'Adicionais', step: 3 },
        { num: 3, label: 'Pagamento', step: 4 }
      ];
    }
    return [
      { num: 1, label: 'Receber', step: 1 },
      { num: 2, label: 'Endereço', step: 2 },
      { num: 3, label: 'Adicionais', step: 3 },
      { num: 4, label: 'Pagamento', step: 4 }
    ];
  };

  const visualSteps = getVisualSteps();
  const currentVisualStep = visualSteps.find(s => s.step === step)?.num || 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-navy/95 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[95vh]">
        <div className="bg-navy px-6 py-4 flex justify-between items-center border-b-2 border-gold">
          <h2 className="text-white font-black uppercase italic tracking-wider text-lg">Checkout</h2>
          <button onClick={onClose} className="text-white/50 hover:text-gold transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {visualSteps.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center space-x-1 ${step === s.step ? 'text-navy' : step > s.step ? 'text-green-600' : 'text-gray-300'}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${step === s.step ? 'bg-gold' : step > s.step ? 'bg-green-500 text-white' : 'bg-gray-100'
                    }`}>
                    {step > s.step ? <i className="fas fa-check text-[10px]"></i> : s.num}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-tighter hidden sm:block">{s.label}</span>
                </div>
                {idx < visualSteps.length - 1 && <div className="w-6 h-0.5 bg-gray-100"></div>}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Modo de Entrega */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h3 className="text-navy font-black text-xl uppercase">Como quer receber?</h3>
                <p className="text-gray-400 text-sm mt-1">Escolha a melhor opção pra você</p>
              </div>

              <div className="space-y-3">
                {/* Retirar no Local */}
                <button
                  onClick={() => setDeliveryMode('pickup')}
                  className={`w-full p-5 rounded-2xl border-3 transition-all flex items-center space-x-4 ${deliveryMode === 'pickup'
                    ? 'border-green-500 bg-green-50 shadow-lg scale-[1.02]'
                    : 'border-gray-100 bg-gray-50 hover:border-gold/50'
                    }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${deliveryMode === 'pickup' ? 'bg-green-500 text-white' : 'bg-white text-navy'
                    }`}>
                    🏪
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-black uppercase text-sm ${deliveryMode === 'pickup' ? 'text-green-700' : 'text-navy'}`}>
                      Retirar no Local
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Retire diretamente no balcão</p>
                    <span className="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      Sem taxa de entrega!
                    </span>
                  </div>
                  {deliveryMode === 'pickup' && (
                    <i className="fas fa-check-circle text-green-500 text-2xl"></i>
                  )}
                </button>

                {/* Receber em Casa */}
                <button
                  onClick={() => setDeliveryMode('delivery')}
                  className={`w-full p-5 rounded-2xl border-3 transition-all flex items-center space-x-4 ${deliveryMode === 'delivery'
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                    : 'border-gray-100 bg-gray-50 hover:border-gold/50'
                    }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${deliveryMode === 'delivery' ? 'bg-blue-500 text-white' : 'bg-white text-navy'
                    }`}>
                    🏠
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-black uppercase text-sm ${deliveryMode === 'delivery' ? 'text-blue-700' : 'text-navy'}`}>
                      Receber em Casa
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Entregamos no seu endereço</p>
                    <span className="inline-block mt-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      Taxa de entrega aplicada
                    </span>
                  </div>
                  {deliveryMode === 'delivery' && (
                    <i className="fas fa-check-circle text-blue-500 text-2xl"></i>
                  )}
                </button>
              </div>

              <button
                disabled={!isStep1Valid}
                onClick={goToNextStep}
                className="w-full bg-navy text-gold py-5 rounded-2xl font-black text-lg uppercase shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed mt-4"
              >
                Continuar <i className="fas fa-chevron-right ml-2 text-xs"></i>
              </button>
            </div>
          )}

          {/* Step 2: Endereço (só para delivery) */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-map-marker-alt text-blue-600 text-xl"></i>
                </div>
                <h3 className="text-navy font-black text-lg uppercase">Endereço de Entrega</h3>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-95 border-2 ${locationLoading ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-navy text-white border-navy hover:bg-navy/90'}`}
              >
                {locationLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-location-arrow text-gold"></i>}
                <span className="font-black uppercase text-xs tracking-widest">
                  {locationLoading ? 'Buscando...' : 'Usar Minha Localização'}
                </span>
              </button>

              {/* Rua e Bairro - Autocomplete */}
              <div className="space-y-2 relative">
                <label className="text-[9px] font-black text-navy/50 uppercase ml-2 tracking-widest flex items-center">
                  <i className="fas fa-road mr-1"></i> Rua e Bairro
                  {searchingAddress && <i className="fas fa-spinner animate-spin ml-2 text-gold"></i>}
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={handleStreetChange}
                  onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Digite o nome da rua ou bairro..."
                  className={`w-full bg-gray-50 border-2 rounded-2xl p-4 text-navy font-bold text-sm focus:border-gold focus:ring-0 transition-all outline-none ${customerCoords ? 'border-green-400 bg-green-50' : 'border-gray-100'
                    }`}
                />

                {/* Indicador de endereço confirmado */}
                {customerCoords && (
                  <div className="absolute right-4 top-9 text-green-500">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}

                {/* Dropdown de sugestões */}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gold rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                    <div className="p-2 bg-gold/10 text-[9px] font-black text-navy/50 uppercase tracking-widest border-b">
                      <i className="fas fa-search mr-1"></i> Selecione seu endereço:
                    </div>
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectAddressSuggestion(suggestion)}
                        className="w-full p-3 text-left hover:bg-gold/10 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <p className="text-navy font-bold text-sm truncate">
                          <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                          {suggestion.display_name?.split(',').slice(0, 3).join(', ')}
                        </p>
                        <p className="text-gray-400 text-[10px] truncate mt-0.5">
                          {suggestion.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mensagem de ajuda */}
                {!customerCoords && streetAddress.length >= 5 && !searchingAddress && addressSuggestions.length === 0 && (
                  <p className="text-orange-500 text-[10px] font-bold ml-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    Continue digitando ou selecione uma sugestão acima
                  </p>
                )}
              </div>

              {/* Número da Residência */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-red-500 uppercase ml-2 tracking-widest flex items-center">
                  <i className="fas fa-home mr-1"></i> Número da Residência *
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="Ex: 123, 45A, S/N"
                  className={`w-full bg-white border-2 rounded-2xl p-4 text-navy font-black text-lg focus:ring-0 transition-all outline-none ${houseNumber ? 'border-green-400 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                />
                {!houseNumber && (
                  <p className="text-red-500 text-[10px] font-bold ml-2">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    Obrigatório para a entrega
                  </p>
                )}
              </div>

              {/* Complemento (opcional) */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-navy/50 uppercase ml-2 tracking-widest flex items-center">
                  <i className="fas fa-building mr-1"></i> Complemento (opcional)
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Ex: Apto 302, Bloco B, Fundos"
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-navy font-bold text-sm focus:border-gold focus:ring-0 transition-all outline-none"
                />
              </div>

              {/* Taxa de Entrega com Distância */}
              {isOutOfRange ? (
                // Fora da área de entrega
                <div className="p-4 rounded-2xl border-2 bg-red-50 border-red-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-exclamation-triangle text-white text-xl"></i>
                    </div>
                    <div>
                      <p className="text-red-700 font-black text-sm uppercase">Fora da Área de Entrega</p>
                      <p className="text-red-600 text-xs mt-1">
                        Distância: {distanceKm} km (máximo: {MAX_DELIVERY_DISTANCE} km)
                      </p>
                      <p className="text-red-500 text-[10px] mt-1">
                        Infelizmente não conseguimos entregar nesse endereço. Considere retirar no local!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Dentro da área
                <div className={`p-4 rounded-2xl border-2 ${deliveryFee > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className={`fas fa-motorcycle ${deliveryFee > 0 ? 'text-green-600' : 'text-gray-400'}`}></i>
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${deliveryFee > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                        Taxa de Entrega:
                      </span>
                    </div>
                    <span className={`font-black text-lg ${deliveryFee > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Use a localização'}
                    </span>
                  </div>
                  {distanceKm > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-green-600 flex items-center">
                          <i className="fas fa-route mr-1"></i>
                          Distância: <strong className="ml-1">{distanceKm} km</strong>
                        </span>
                        <span className="text-green-500 bg-green-100 px-2 py-0.5 rounded-full">
                          R$ {DELIVERY_RATE_PER_KM.toFixed(2)}/km
                        </span>
                      </div>
                      {estimatedMinutes > 0 && (
                        <div className="flex items-center text-[11px] text-green-600">
                          <i className="fas fa-clock mr-1"></i>
                          Tempo estimado: <strong className="ml-1">{estimatedMinutes} min</strong>
                        </div>
                      )}
                      <p className="text-[9px] text-green-400">
                        <i className="fas fa-store mr-1"></i>
                        Saindo de: Campo Largo da Roseira - SJP
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="bg-gray-100 text-navy px-5 py-4 rounded-2xl font-black transition-all hover:bg-gray-200 active:scale-95"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  disabled={!isStep2Valid}
                  onClick={goToNextStep}
                  className="flex-1 bg-navy text-gold py-4 rounded-2xl font-black text-sm uppercase shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                >
                  Continuar <i className="fas fa-chevron-right ml-2 text-xs"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Adicionais */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🔥</span>
                </div>
                <h3 className="text-navy font-black text-xl uppercase">Turbinar seu pedido?</h3>
                <p className="text-gray-400 text-sm mt-1">Adicione extras para deixar ainda mais gostoso!</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ADICIONAIS_CHECKOUT.map(adicional => {
                  const isSelected = (selectedAdicionais[adicional.id] || 0) > 0;
                  return (
                    <button
                      key={adicional.id}
                      onClick={() => toggleAdicional(adicional)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 ${isSelected
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-100 bg-gray-50 hover:border-gold/50'
                        }`}
                    >
                      <span className="text-2xl">{adicional.icon}</span>
                      <span className="font-black text-navy text-xs uppercase">{adicional.name}</span>
                      <span className={`font-black text-sm ${isSelected ? 'text-green-600' : 'text-gray-500'}`}>
                        +R$ {adicional.price.toFixed(2)}
                      </span>
                      {isSelected && (
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                          <i className="fas fa-check mr-1"></i>ADICIONADO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Resumo dos adicionais selecionados */}
              {getAdicionaisTotal() > 0 && (
                <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-green-700 uppercase">Adicionais Selecionados:</span>
                      <p className="text-green-600 text-xs font-bold mt-1">
                        {getSelectedAdicionaisNames().join(', ')}
                      </p>
                    </div>
                    <span className="font-black text-green-700 text-lg">
                      +R$ {getAdicionaisTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="bg-gray-100 text-navy px-5 py-4 rounded-2xl font-black transition-all hover:bg-gray-200 active:scale-95"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={goToNextStep}
                  className="flex-1 bg-navy text-gold py-4 rounded-2xl font-black text-sm uppercase shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {getAdicionaisTotal() > 0 ? 'Continuar com Adicionais' : 'Hoje não, obrigado'}
                  <i className="fas fa-chevron-right ml-2 text-xs"></i>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Pagamento */}
          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-wallet text-navy text-xl"></i>
                </div>
                <h3 className="text-navy font-black text-lg uppercase">
                  {deliveryMode === 'pickup' ? 'Pagamento na Retirada' : 'Forma de Pagamento'}
                </h3>
                <p className="text-gray-400 text-xs">
                  {deliveryMode === 'pickup'
                    ? 'Seu pagamento será processado diretamente no nosso balcão.'
                    : 'Como você deseja pagar o motoboy?'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {deliveryMode === 'pickup' ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('balcao')}
                    className="flex items-center p-5 rounded-2xl border-3 border-gold bg-navy text-white shadow-xl scale-[1.02] transition-all"
                  >
                    <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center text-navy mr-4">
                      <i className="fas fa-hand-holding-usd text-xl"></i>
                    </div>
                    <div className="text-left">
                      <span className="font-black uppercase text-xs tracking-widest block">Pagar no Balcão</span>
                      <span className="text-[10px] text-gold/80 font-bold">Débito, Crédito, PIX ou Dinheiro</span>
                    </div>
                    <i className="fas fa-check-circle ml-auto text-gold text-xl"></i>
                  </button>
                ) : (
                  [
                    { id: 'pix', label: 'PIX (Na Entrega)', icon: 'fa-pix', sub: 'O motoboy leva a maquininha' },
                    { id: 'credito', label: 'Cartão de Crédito', icon: 'fa-credit-card', sub: 'O motoboy leva a maquininha' },
                    { id: 'debito', label: 'Cartão de Débito', icon: 'fa-money-check', sub: 'O motoboy leva a maquininha' },
                    { id: 'dinheiro', label: 'Dinheiro', icon: 'fa-money-bill-wave', sub: 'Pagamento em espécie' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === method.id ? 'border-gold bg-navy text-white shadow-md scale-[1.01]' : 'border-gray-100 bg-gray-50 text-navy hover:border-gray-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${paymentMethod === method.id ? 'bg-gold text-navy' : 'bg-white text-navy/30'}`}>
                        <i className={`fas ${method.icon}`}></i>
                      </div>
                      <div className="text-left">
                        <span className="font-black uppercase text-[11px] tracking-tight block">{method.label}</span>
                        <span className={`text-[9px] font-bold ${paymentMethod === method.id ? 'text-gold/70' : 'text-gray-400'}`}>{method.sub}</span>
                      </div>
                      {paymentMethod === method.id && <i className="fas fa-check-circle ml-auto text-gold"></i>}
                    </button>
                  ))
                )}
              </div>

              {/* Aviso sobre Maquininha */}
              {deliveryMode === 'delivery' && paymentMethod && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 border-2 ${paymentMethod === 'dinheiro' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'dinheiro' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                    <i className={`fas ${paymentMethod === 'dinheiro' ? 'fa-wallet' : 'fa-mobile-alt'} text-white`}></i>
                  </div>
                  <p className="text-[10px] font-bold text-navy leading-tight">
                    {paymentMethod === 'dinheiro'
                      ? 'O motoboy levará apenas o seu pedido. Por favor, tenha o valor em mãos.'
                      : 'Avisaremos o motoboy para levar a maquininha de cartão/PIX até você.'}
                  </p>
                </div>
              )}

              {/* Resumo Final */}
              <div className="bg-navy p-5 rounded-3xl space-y-2 border-b-4 border-gold">
                {/* Modo de entrega */}
                <div className="flex justify-between text-white/60 font-bold text-[10px] uppercase tracking-widest">
                  <span className="flex items-center">
                    <i className={`fas ${deliveryMode === 'pickup' ? 'fa-store' : 'fa-motorcycle'} mr-2`}></i>
                    {deliveryMode === 'pickup' ? 'Retirada no Local' : 'Entrega em Casa'}
                  </span>
                  <span>{deliveryMode === 'pickup' ? 'Grátis' : `R$ ${actualDeliveryFee.toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between text-white/40 font-bold text-[10px] uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>

                {actualDeliveryFee > 0 && (
                  <div className="flex justify-between text-white/40 font-bold text-[10px] uppercase tracking-widest">
                    <span>Taxa de Entrega</span>
                    <span>R$ {actualDeliveryFee.toFixed(2)}</span>
                  </div>
                )}

                {getAdicionaisTotal() > 0 && (
                  <div className="flex justify-between text-green-400 font-bold text-[10px] uppercase tracking-widest">
                    <span>Adicionais</span>
                    <span>+R$ {getAdicionaisTotal().toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-black text-white uppercase italic text-sm">Total à Pagar</span>
                  <span className="text-2xl font-black text-gold">R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="bg-gray-100 text-navy px-5 rounded-2xl font-black transition-all hover:bg-gray-200 active:scale-95"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  disabled={!isStep4Valid}
                  onClick={() => onConfirm(
                    {
                      address: deliveryMode === 'pickup' ? 'Retirada no Local' : getFullAddress(),
                      deliveryFee: actualDeliveryFee,
                      deliveryMode
                    },
                    paymentMethod,
                    getAdicionaisTotal()
                  )}
                  className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-black text-lg uppercase shadow-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-20"
                >
                  Confirmar Pedido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
