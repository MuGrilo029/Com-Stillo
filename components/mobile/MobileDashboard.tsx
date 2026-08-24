import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  PlusCircle,
  Clock,
  Sparkles,
  Layers,
  Percent,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { MobileTab, TimeFilterOption } from './types';
import { Sale, Product, Transaction } from '../../types';

interface MobileDashboardProps {
  sales?: Sale[];
  products?: Product[];
  transactions?: Transaction[];
  onNavigateTab: (tab: MobileTab) => void;
  onFilterInventoryCritical?: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  sales = [],
  products = [],
  transactions = [],
  onNavigateTab,
  onFilterInventoryCritical
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('MONTH');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const filterLabels: Record<TimeFilterOption, string> = {
    TODAY: 'Hoje',
    WEEK: 'Esta Semana',
    MONTH: 'Este Mês',
    YEAR: 'Este Ano'
  };

  const parseLocalDate = (value: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(value);
  };

  // Metric Computations based on real store data + fallbacks
  const metrics = useMemo(() => {
    const today = new Date();
    const periodStart = new Date(today);
    periodStart.setHours(0, 0, 0, 0);
    if (timeFilter === 'WEEK') periodStart.setDate(today.getDate() - 7);
    if (timeFilter === 'MONTH') periodStart.setDate(1);
    if (timeFilter === 'YEAR') periodStart.setMonth(0, 1);

    const periodTransactions = transactions.filter(transaction => {
      const transactionDate = parseLocalDate(transaction.dueDate || transaction.date);
      return !Number.isNaN(transactionDate.getTime()) && transactionDate >= periodStart;
    });

    const paidIncome = periodTransactions
      .filter(transaction => transaction.type === 'INCOME' && transaction.status === 'PAID')
      .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);
    const paidExpenses = periodTransactions
      .filter(transaction => transaction.type === 'EXPENSE' && transaction.status === 'PAID')
      .reduce((total, transaction) => total + (Number(transaction.amount) || 0), 0);

    // Keep the same financial definition used by the desktop dashboard.
    const revenue = paidIncome;
    const netProfit = paidIncome - paidExpenses;

    // 2. Lucro Líquido (Estimado com base em CMV e despesas ou margem)
    // 3. Valor do Estoque
    let totalStockValue = 0;
    let totalStockItems = 0;
    if (products && products.length > 0) {
      totalStockValue = products.reduce((acc, p) => acc + ((Number(p.cost) || Number(p.price) * 0.6) * (Number(p.quantity) || 0)), 0);
      totalStockItems = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    }

    // 4. Itens Críticos (Estoque <= minStock ou <= 3)
    let criticalItemsCount = 0;
    if (products && products.length > 0) {
      criticalItemsCount = products.filter(p => (Number(p.quantity) || 0) <= (Number(p.minStock) || 3)).length;
    }

    return {
      revenue,
      revenueGrowth: 8.5,
      netProfit,
      profitGrowth: 14.2,
      totalStockValue,
      totalStockItems,
      criticalItemsCount,
      goalProgress: Math.min(100, (revenue / 100000) * 100)
    };
  }, [sales, products, transactions, timeFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-4 pb-2 animate-fade-in-fast">
      {/* Top Welcome & Minimalist Dropdown Filter */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} /> Visão Geral
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">Dashboard</h2>
        </div>

        {/* Minimalist Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#182234] border border-white/10 text-xs font-bold text-slate-200 hover:text-white hover:bg-[#1e2c42] active:scale-95 transition-all shadow-sm"
          >
            <Calendar size={13} className="text-rose-400" />
            <span>{filterLabels[timeFilter]}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsFilterDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-36 bg-[#182234] border border-white/15 rounded-2xl shadow-2xl p-1 z-40 animate-scale-in text-xs">
                {(['TODAY', 'WEEK', 'MONTH', 'YEAR'] as TimeFilterOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setTimeFilter(option);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between ${
                      timeFilter === option
                        ? 'bg-wine-900 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                    }`}
                  >
                    <span>{filterLabels[option]}</span>
                    {timeFilter === option && <CheckCircle2 size={12} className="text-rose-300" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2x2 Grid of Key Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Lucro Líquido */}
        <div className="bg-gradient-to-br from-[#182234] to-[#121a29] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg shadow-black/20 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300">
              Lucro Líquido
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <TrendingUp size={15} />
            </div>
          </div>

          <div className="my-1.5">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
              {formatCurrency(metrics.netProfit)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/20">
              <ArrowUpRight size={10} /> +{metrics.profitGrowth}%
            </span>
            <span className="text-[10px] text-slate-400 truncate">vs anterior</span>
          </div>
        </div>

        {/* Card 2: Faturamento */}
        <div className="bg-gradient-to-br from-[#182234] to-[#121a29] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg shadow-black/20 hover:border-rose-500/30 transition-all group">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300">
              Faturamento
            </span>
            <div className="w-7 h-7 rounded-xl bg-wine-900/40 border border-rose-600/30 flex items-center justify-center text-rose-300">
              <DollarSign size={15} />
            </div>
          </div>

          <div className="my-1.5">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
              {formatCurrency(metrics.revenue)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/20">
              <ArrowUpRight size={10} /> +{metrics.revenueGrowth}%
            </span>
            <span className="text-[10px] text-slate-400 truncate">receita bruta</span>
          </div>
        </div>

        {/* Card 3: Valor do Estoque */}
        <div
          onClick={() => onNavigateTab('INVENTORY')}
          className="bg-gradient-to-br from-[#182234] to-[#121a29] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg shadow-black/20 hover:border-indigo-500/30 active:scale-98 cursor-pointer transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-300">
              Estoque Total
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Package size={15} />
            </div>
          </div>

          <div className="my-1.5">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
              {formatCurrency(metrics.totalStockValue)}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded-md border border-indigo-800/40">
              {metrics.totalStockItems} itens
            </span>
            <span className="text-[10px] text-slate-400 truncate">em depósito</span>
          </div>
        </div>

        {/* Card 4: Itens Críticos */}
        <div
          onClick={() => {
            if (onFilterInventoryCritical) onFilterInventoryCritical();
            onNavigateTab('INVENTORY');
          }}
          className={`border rounded-2xl p-3.5 flex flex-col justify-between shadow-lg shadow-black/20 active:scale-98 cursor-pointer transition-all group ${
            metrics.criticalItemsCount > 0
              ? 'bg-gradient-to-br from-red-950/40 via-[#182234] to-[#121a29] border-rose-800/40 hover:border-rose-500/60'
              : 'bg-gradient-to-br from-[#182234] to-[#121a29] border-white/10'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 group-hover:text-rose-200">
              Itens Críticos
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
              <AlertTriangle size={15} />
            </div>
          </div>

          <div className="my-1.5 flex items-baseline gap-1.5">
            <h3 className="text-base sm:text-lg font-black text-rose-400 tracking-tight leading-none">
              {metrics.criticalItemsCount}
            </h3>
            <span className="text-xs font-semibold text-slate-400">produtos</span>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-900/40 text-rose-300 text-[10px] font-extrabold border border-rose-700/40">
              Estoque Baixo
            </span>
            <span className="text-[10px] text-rose-400 underline">repor agora</span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex flex-col gap-2 pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Ações Rápidas
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onNavigateTab('POS')}
            className="p-3 rounded-2xl bg-gradient-to-br from-red-950 to-wine-900 border border-rose-800/40 hover:border-rose-500/50 flex flex-col items-center justify-center gap-1.5 shadow-md shadow-red-950/40 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <ShoppingCart size={16} />
            </div>
            <span className="text-[11px] font-bold text-white leading-tight">Nova Venda</span>
          </button>

          <button
            onClick={() => onNavigateTab('INVENTORY')}
            className="p-3 rounded-2xl bg-[#182234] border border-white/10 hover:border-white/20 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200">
              <Layers size={16} />
            </div>
            <span className="text-[11px] font-bold text-slate-200 leading-tight">Ver Estoque</span>
          </button>

          <button
            onClick={() => onNavigateTab('HISTORY')}
            className="p-3 rounded-2xl bg-[#182234] border border-white/10 hover:border-white/20 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200">
              <Clock size={16} />
            </div>
            <span className="text-[11px] font-bold text-slate-200 leading-tight">Histórico</span>
          </button>
        </div>
      </div>

      {/* Mini Performance Bar / Status Summary */}
      <div className="bg-[#182234] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Meta Mensal de Vendas
            </span>
          </div>
          <span className="text-xs font-black text-rose-400">{metrics.goalProgress.toFixed(1)}%</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-800 via-rose-600 to-emerald-400 transition-all duration-1000 shadow-sm"
            style={{ width: `${Math.min(100, (metrics.revenue / 100000) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Realizado: <strong className="text-white">{formatCurrency(metrics.revenue)}</strong></span>
          <span>Meta: <strong className="text-slate-300">R$ 100.000</strong></span>
        </div>
      </div>
    </div>
  );
};
