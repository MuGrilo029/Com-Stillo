import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  User as UserIcon,
  Moon,
  Sun,
  RefreshCcw,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import { MobileTab } from './types';

interface MobileLayoutProps {
  currentTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  cartCount?: number;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  onRefresh?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSwitchToDesktop?: () => void;
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  currentTab,
  onTabChange,
  cartCount = 0,
  userName = 'Administrador',
  userRole = 'ADMIN',
  onLogout,
  onRefresh,
  darkMode = true,
  onToggleDarkMode,
  onSwitchToDesktop,
  children
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const navItems = [
    {
      id: 'DASHBOARD' as MobileTab,
      label: 'Início',
      icon: LayoutDashboard
    },
    {
      id: 'POS' as MobileTab,
      label: 'PDV',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined
    },
    {
      id: 'HISTORY' as MobileTab,
      label: 'Histórico',
      icon: History
    },
    {
      id: 'INVENTORY' as MobileTab,
      label: 'Estoque',
      icon: Package
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] min-h-screen w-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-wine-700 selection:text-white relative overflow-x-hidden">
      {/* Glow decorative orbs in background for depth */}
      <div className="fixed top-[-10%] left-[-10%] w-[250px] h-[250px] bg-wine-900/20 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed top-[40%] right-[-10%] w-[300px] h-[300px] bg-rose-950/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[5%] left-[20%] w-[250px] h-[250px] bg-red-950/25 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/[0.07] px-4 py-3.5 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-800 to-rose-950 flex items-center justify-center shadow-md shadow-red-950/60 border border-rose-500/30">
              <span className="text-white font-extrabold text-sm tracking-tighter">CS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base sm:text-lg tracking-wider text-white uppercase flex items-center gap-1">
                COM STILLO
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-wine-900/60 text-wine-200 border border-wine-700/40">
                ERP
              </span>
            </div>
          </div>

          {/* User Profile Button & Actions */}
          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <button
                onClick={handleRefreshClick}
                className="w-9 h-9 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/80 active:scale-95 transition-all"
                title="Sincronizar"
                aria-label="Sincronizar dados"
              >
                <RefreshCcw size={16} className={`${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
              </button>
            )}

            <button
              onClick={() => setIsProfileOpen(true)}
              className="relative p-0.5 rounded-full bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-700 hover:to-rose-600 active:scale-95 transition-transform shadow-sm focus:outline-none"
              aria-label="Menu de perfil do usuário"
            >
              <div className="w-8 h-8 rounded-full bg-[#182234] border border-white/20 flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                {userName.charAt(0) || <UserIcon size={14} />}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0B0F19]" />
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Main Viewport */}
      <main className="flex-1 w-full max-w-none px-4 pt-4 pb-28 sm:pb-32 overflow-y-auto">
        {children}
      </main>

      {/* Floating Bottom Navigation Bar (Barra de Navegação Inferior Flutuante) */}
      <div className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none">
        <nav
          className="max-w-md mx-auto pointer-events-auto bg-[#111827]/92 backdrop-blur-2xl border border-white/[0.12] rounded-full p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex items-center justify-between ring-1 ring-white/5"
          role="navigation"
          aria-label="Navegação Principal"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-red-950 via-wine-900 to-rose-900 text-white shadow-md shadow-red-950/80'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`}
                aria-label={item.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 ${
                      isActive ? 'scale-110 text-white' : 'group-hover:scale-105'
                    }`}
                  />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-[#111827] shadow-sm animate-scale-in">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium tracking-tight mt-0.5 transition-all ${
                    isActive ? 'font-bold text-white' : 'opacity-80'
                  }`}
                >
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Modal / Drawer */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-fast"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#182234] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up flex flex-col gap-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-800 to-rose-950 border border-white/20 flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {userName.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{userName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-wine-900/60 text-rose-300 font-semibold border border-rose-800/40">
                      <ShieldCheck size={12} /> {userRole}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> Online
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Settings */}
            <div className="flex flex-col gap-2">
              <div className="p-3.5 rounded-2xl bg-[#111827]/80 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    {darkMode ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Tema Visual</p>
                    <p className="text-xs text-slate-400">Dark Mode Premium ativo</p>
                  </div>
                </div>
                {onToggleDarkMode && (
                  <button
                    onClick={onToggleDarkMode}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10"
                  >
                    Alternar
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#111827]/80 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-wine-950/80 border border-rose-900/30 flex items-center justify-center text-rose-400">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Versão do ERP</p>
                    <p className="text-xs text-slate-400">COM STILLO Pro 2.0 (Mobile-First)</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-400 bg-wine-950 px-2.5 py-1 rounded-lg border border-rose-900/40">
                  v2.5
                </span>
              </div>

              {onSwitchToDesktop && (
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onSwitchToDesktop();
                  }}
                  className="p-3 rounded-2xl bg-[#111827]/80 hover:bg-[#1e2c42] border border-white/10 flex items-center justify-between text-xs font-bold text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-rose-400" />
                    Alternar para Versão Desktop Completa
                  </span>
                  <span className="text-[10px] text-slate-400">Desktop</span>
                </button>
              )}
            </div>

            {/* Logout Action */}
            {onLogout && (
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-red-950/40 hover:bg-red-900/60 text-red-300 font-semibold border border-red-800/40 flex items-center justify-center gap-2 active:scale-95 transition-all mt-1"
              >
                <LogOut size={16} />
                Sair da Conta
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
