
import React, { useState } from 'react';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
  required?: boolean; // Se true, o modal não pode ser fechado (modo Totem)
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, required = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || 'Cliente VIP',
      email: email,
      loyaltyPoints: 0
    };
    onLogin(mockUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/90 backdrop-blur-md" onClick={required ? undefined : onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-b-8 border-gold">
        <div className="bg-navy p-8 text-center">
          <h2 className="text-3xl font-black text-white uppercase italic italic">Clube <span className="text-gold">Imperial</span></h2>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-2">Acesse seus selos e benefícios</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[9px] font-black text-navy uppercase ml-2">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-navy font-bold focus:border-gold outline-none transition-all"
                placeholder="Como quer ser chamado?"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-navy uppercase ml-2">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-navy font-bold focus:border-gold outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-navy uppercase ml-2">Senha</label>
            <input
              type="password"
              required
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-navy font-bold focus:border-gold outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-navy text-gold py-5 rounded-2xl font-black uppercase text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
            {isLogin ? 'Entrar no Clube' : 'Criar minha Conta'}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-navy/40 font-black text-[10px] uppercase hover:text-navy transition-colors pt-2"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já é do clube? Faça login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
