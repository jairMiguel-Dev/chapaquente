
import React, { useState, useEffect } from 'react';
import { OFFICIAL_LOGO_URL } from '../constants';
import { User } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onOrdersClick: () => void;
  onAdminClick?: () => void; // Opcional - só aparece para admins
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, user, onLoginClick, onLogout, onOrdersClick, onAdminClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else if (targetId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled
        ? 'py-2 bg-navy shadow-2xl border-b-4 border-gold'
        : 'py-4 bg-transparent'
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">

        <nav className="hidden lg:flex items-center space-x-8">
          <a
            href="#menu"
            onClick={(e) => handleScrollTo(e, 'menu')}
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isScrolled ? 'text-white hover:text-gold' : 'text-navy hover:text-white'}`}
          >
            CARDÁPIO
          </a>
          <a
            href="#fidelidade"
            onClick={(e) => handleScrollTo(e, 'fidelidade')}
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isScrolled ? 'text-white hover:text-gold' : 'text-navy hover:text-white'}`}
          >
            FIDELIDADE
          </a>
        </nav>

        <div className="flex-1 flex justify-center lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <a
            href="#top"
            onClick={(e) => handleScrollTo(e, 'top')}
            className="flex items-center group"
          >
            <div className={`transition-all duration-500 overflow-hidden rounded-full border-2 border-gold bg-white shadow-xl ${isScrolled ? 'w-12 h-12' : 'w-20 h-20 sm:w-24 sm:h-24'}`}>
              <img src={OFFICIAL_LOGO_URL} alt="Chapa Quente Logo" className="w-full h-full object-cover" />
            </div>
          </a>
        </div>

        <div className="flex items-center space-x-3">
          {/* User Profile / Login */}
          <div className="hidden sm:block relative user-menu-container">
            {user ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-full border-2 transition-all ${isScrolled ? 'border-white/10 text-white hover:bg-white/10' : 'border-navy/10 text-navy hover:bg-navy/10'}`}
                >
                  <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center text-navy text-[10px] font-black">
                    {user.name[0]}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{user.name.split(' ')[0]}</span>
                  <i className={`fas fa-chevron-down text-[8px] transition-transform ${showUserMenu ? 'rotate-180' : ''}`}></i>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <p className="text-navy font-black text-sm">{user.name}</p>
                      <p className="text-gray-400 text-[10px]">{user.email}</p>
                    </div>
                    <div className="py-2">
                      {/* Botão Admin - Só aparece para admins */}
                      {user.isAdmin && onAdminClick && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onAdminClick();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 group border-b border-gray-100"
                        >
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i className="fas fa-user-shield text-white text-sm"></i>
                          </div>
                          <div>
                            <p className="text-blue-600 font-black text-xs uppercase">Painel Admin</p>
                            <p className="text-gray-400 text-[9px]">Gerenciar pedidos e estoque</p>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOrdersClick();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 group"
                      >
                        <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                          <i className="fas fa-receipt text-gold text-sm"></i>
                        </div>
                        <div>
                          <p className="text-navy font-black text-xs uppercase">Meus Pedidos</p>
                          <p className="text-gray-400 text-[9px]">Ver histórico de compras</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 group"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <i className="fas fa-sign-out-alt text-red-500 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-red-600 font-black text-xs uppercase">Sair</p>
                          <p className="text-gray-400 text-[9px]">Encerrar sessão</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className={`px-6 py-2 rounded-full font-black text-[10px] uppercase border-2 transition-all ${isScrolled ? 'bg-gold border-gold text-navy shadow-lg' : 'bg-navy border-navy text-gold shadow-md'}`}
              >
                Login
              </button>
            )}
          </div>

          <button
            onClick={onCartClick}
            className={`relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-colors rounded-xl ${isScrolled ? 'bg-white/10 text-gold' : 'bg-navy text-gold shadow-lg'}`}
          >
            <i className="fas fa-shopping-basket text-xl"></i>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
