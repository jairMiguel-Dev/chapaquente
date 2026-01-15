
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
  required?: boolean; // Se true, o modal não pode ser fechado (modo Totem)
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin, required = false }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const response = await api.auth.login(email, password);
        onLogin(response.user as User);
      } else if (mode === 'register') {
        if (!name) {
          setError('Nome é obrigatório');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Senha deve ter pelo menos 6 caracteres');
          setLoading(false);
          return;
        }
        const response = await api.auth.register(name, email, password);
        onLogin(response.user as User);
      } else {
        // Guest mode
        const response = await api.auth.guest(name || 'Visitante');
        onLogin(response.user as User);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.auth.guest(name || 'Visitante');
      onLogin(response.user as User);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar como visitante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/90 backdrop-blur-md" onClick={required ? undefined : onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border-b-8 border-gold">
        <div className="bg-navy p-8 text-center">
          <h2 className="text-3xl font-black text-white uppercase italic">Clube <span className="text-gold">Imperial</span></h2>
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-2">Acesse seus selos e benefícios</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-600 text-sm font-bold flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}

          {mode === 'register' && (
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

          {mode !== 'guest' && (
            <>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-navy font-bold focus:border-gold outline-none transition-all"
                  placeholder="••••••••"
                />
                {mode === 'register' && (
                  <p className="text-[9px] text-gray-400 ml-2">Mínimo 6 caracteres</p>
                )}
              </div>
            </>
          )}

          {mode === 'guest' && (
            <div className="space-y-1">
              <label className="text-[9px] font-black text-navy uppercase ml-2">Seu Nome (opcional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-navy font-bold focus:border-gold outline-none transition-all"
                placeholder="Como quer ser chamado?"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-gold py-5 rounded-2xl font-black uppercase text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Aguarde...
              </>
            ) : mode === 'login' ? (
              'Entrar no Clube'
            ) : mode === 'register' ? (
              'Criar minha Conta'
            ) : (
              'Entrar como Visitante'
            )}
          </button>

          {/* Mode switcher */}
          <div className="space-y-2 pt-2">
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-navy/40 font-black text-[10px] uppercase hover:text-navy transition-colors"
              >
                Já tem conta? Faça login
              </button>
            )}
            {mode !== 'register' && (
              <button
                type="button"
                onClick={() => setMode('register')}
                className="w-full text-center text-navy/40 font-black text-[10px] uppercase hover:text-navy transition-colors"
              >
                Não tem conta? Cadastre-se
              </button>
            )}
            {mode !== 'guest' && (
              <button
                type="button"
                onClick={() => setMode('guest')}
                className="w-full text-center text-gold/70 font-black text-[10px] uppercase hover:text-gold transition-colors"
              >
                <i className="fas fa-user-secret mr-1"></i>
                Continuar como Visitante
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
