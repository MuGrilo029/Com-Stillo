import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Filter,
  X,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Calendar,
  Receipt,
  Share2,
  FileText,
  DollarSign
} from 'lucide-react';
import { Sale } from '../../types';

interface MobileSalesHistoryProps {
  sales?: Sale[];
  onSelectSale?: (sale: Sale) => void;
}

export const MobileSalesHistory: React.FC<MobileSalesHistoryProps> = ({
  sales = [],
  onSelectSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'TODAY' | 'WEEK'>('ALL');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Fallback demo sales if empty
  const allSales: Sale[] = useMemo(() => {
    if (sales && sales.length > 0) return sales;
    const now = new Date();
    return [
      {
        id: 'CS-8492',
        customerName: 'Mariana Duarte Souza',
        customerPhone: '(11) 98765-4321',
        total: 3890.0,
        discount: 0,
        paymentMethod: 'PIX',
        paymentType: 'FULL',
        status: 'COMPLETED',
        deliveryType: 'DELIVERY',
        date: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
        items: [
          { productName: 'Sofá Retrátil Florença 2.30m', quantity: 1, unitPrice: 2890.0, category: 'Estofados' },
          { productName: 'Poltrona Giratória Velvet', quantity: 1, unitPrice: 790.0, category: 'Poltronas' },
          { productName: 'Kit Impermeabilização Tecido', quantity: 1, unitPrice: 210.0, category: 'Serviços' }
        ]
      },
      {
        id: 'CS-8491',
        customerName: 'Rodrigo Alves de Lima',
        customerPhone: '(11) 97123-8899',
        total: 1450.0,
        discount: 50,
        paymentMethod: 'Cartão Crédito 3x',
        paymentType: 'PARTIAL',
        remainingAmount: 700.0,
        status: 'PENDING',
        deliveryType: 'PICKUP',
        date: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
        items: [
          { productName: 'Mesa de Centro Rústica Carvalho', quantity: 2, unitPrice: 650.0, category: 'Móveis' },
          { productName: 'Almofada Linho Premium 45x45', quantity: 2, unitPrice: 89.9, category: 'Acessórios' }
        ]
      },
      {
        id: 'CS-8489',
        customerName: 'Camila Fernandes Costa',
        customerPhone: '(11) 99887-1122',
        total: 890.0,
        discount: 0,
        paymentMethod: 'PIX',
        paymentType: 'FULL',
        status: 'COMPLETED',
        deliveryType: 'PICKUP',
        date: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
        items: [
          { productName: 'Poltrona Giratória Velvet', quantity: 1, unitPrice: 790.0, category: 'Poltronas' },
          { productName: 'Almofada Linho Premium 45x45', quantity: 1, unitPrice: 100.0, category: 'Acessórios' }
        ]
      },
      {
        id: 'CS-8485',
        customerName: 'Lucas Barreto Mendes',
        customerPhone: '(11) 98111-2233',
        total: 5200.0,
        discount: 200,
        paymentMethod: 'PIX',
        paymentType: 'FULL',
        status: 'COMPLETED',
        deliveryType: 'DELIVERY',
        date: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
        items: [
          { productName: 'Sofá Modular Comfort 3.00m', quantity: 1, unitPrice: 4800.0, category: 'Estofados' },
          { productName: 'Puff Redondo Bouclé', quantity: 2, unitPrice: 300.0, category: 'Puffs' }
        ]
      },
      {
        id: 'CS-8480',
        customerName: 'Juliana Paes Rocha',
        customerPhone: '(11) 97766-5544',
        total: 2100.0,
        discount: 0,
        paymentMethod: 'Boleto 30 Dias',
        paymentType: 'PARTIAL',
        remainingAmount: 2100.0,
        status: 'PENDING',
        deliveryType: 'DELIVERY',
        date: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
        items: [
          { productName: 'Mesa de Jantar Madeira Maciça', quantity: 1, unitPrice: 2100.0, category: 'Móveis' }
        ]
      }
    ];
  }, [sales]);

  // Filter Logic
  const filteredSales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    return allSales.filter((s) => {
      // Text Search
      const matchesSearch =
        searchTerm.trim() === '' ||
        (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status/Date Filter
      let matchesFilter = true;
      const saleDate = s.date ? new Date(s.date) : new Date();

      if (statusFilter === 'PAID') {
        matchesFilter = s.status === 'COMPLETED';
      } else if (statusFilter === 'PENDING') {
        matchesFilter = s.status === 'PENDING';
      } else if (statusFilter === 'TODAY') {
        matchesFilter = saleDate >= today;
      } else if (statusFilter === 'WEEK') {
        matchesFilter = saleDate >= weekAgo;
      }

      return matchesSearch && matchesFilter;
    });
  }, [allSales, searchTerm, statusFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Recente';
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Hoje, ${timeStr}`;
      }
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, ${timeStr}`;
    } catch {
      return dateStr;
    }
  };

  const totalFilteredAmount = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [filteredSales]);

  return (
    <div className="flex flex-col gap-3.5 pb-4 animate-fade-in-fast">
      {/* Title and Summary Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> Registro de Transações
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">Histórico de Vendas</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Filtrado</span>
          <span className="text-sm font-black text-emerald-400">{formatCurrency(totalFilteredAmount)}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por cliente ou nº do pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#182234] border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        {[
          { id: 'ALL', label: 'Todas' },
          { id: 'TODAY', label: 'Hoje' },
          { id: 'WEEK', label: 'Esta Semana' },
          { id: 'PAID', label: 'Pagas' },
          { id: 'PENDING', label: 'Pendentes' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === f.id
                ? 'bg-rose-900 text-white border border-rose-500/40 shadow-sm shadow-rose-950/50'
                : 'bg-[#182234] text-slate-300 border border-white/5 hover:text-white hover:bg-[#1e2c42]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Sales Transactions List */}
      {filteredSales.length === 0 ? (
        <div className="bg-[#182234]/60 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
          <History size={32} className="text-slate-500 mb-1" />
          <p className="text-sm font-bold text-slate-200">Nenhuma venda encontrada</p>
          <p className="text-xs text-slate-400 max-w-[200px]">Ajuste os filtros de busca ou período acima.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredSales.map((sale) => {
            const isPaid = sale.status === 'COMPLETED';
            return (
              <div
                key={sale.id}
                onClick={() => {
                  setSelectedSaleDetail(sale);
                  if (onSelectSale) onSelectSale(sale);
                }}
                className="bg-[#182234] border border-white/10 hover:border-white/20 rounded-2xl p-3.5 shadow-md shadow-black/20 flex items-center justify-between gap-3 active:scale-98 transition-all cursor-pointer group"
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold text-rose-300">
                      {sale.id.startsWith('#') ? sale.id : `#${sale.id}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(sale.date)}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-200 transition-colors">
                    {sale.customerName || 'Cliente Balcão'}
                  </h4>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-semibold text-slate-300 bg-[#111827] px-2 py-0.5 rounded-md border border-white/5 truncate max-w-[130px]">
                      {sale.paymentMethod || 'À Vista'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(sale.items || []).length} {(sale.items || []).length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>

                {/* Right: Value & Status Badge */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-sm sm:text-base font-black text-white tracking-tight">
                    {formatCurrency(Number(sale.total) || 0)}
                  </span>

                  {/* Status Badge: Pago in green / Pendente in yellow */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isPaid
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {isPaid ? <CheckCircle size={10} /> : <Clock size={10} />}
                    <span>{isPaid ? 'Pago' : 'Pendente'}</span>
                  </span>
                </div>

                <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Sale Detail Receipt Sheet / Modal */}
      {selectedSaleDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-fast"
          onClick={() => setSelectedSaleDetail(null)}
        >
          <div
            className="w-full max-w-md bg-[#182234] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up flex flex-col gap-4 text-slate-100 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-wine-900/60 border border-rose-600/30 flex items-center justify-center text-rose-300">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    Pedido {selectedSaleDetail.id}
                  </h3>
                  <p className="text-[10px] text-slate-400">{formatDateTime(selectedSaleDetail.date)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer & Status Header */}
            <div className="bg-[#111827] rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Cliente</p>
                <p className="text-xs font-bold text-white mt-0.5">{selectedSaleDetail.customerName}</p>
                {selectedSaleDetail.customerPhone && (
                  <p className="text-[10px] text-slate-400">{selectedSaleDetail.customerPhone}</p>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  selectedSaleDetail.status === 'COMPLETED'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {selectedSaleDetail.status === 'COMPLETED' ? 'Pago' : 'Pendente'}
              </span>
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Itens Comprados
              </span>
              <div className="bg-[#111827] rounded-2xl p-3 border border-white/5 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                {(selectedSaleDetail.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-none">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-semibold text-white truncate">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Financial Summary */}
            <div className="bg-gradient-to-r from-red-950/60 to-rose-950/60 border border-rose-800/40 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Forma de Pagamento</span>
                <p className="text-xs font-bold text-white mt-0.5">{selectedSaleDetail.paymentMethod || 'À Vista'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Valor Total</span>
                <p className="text-lg font-black text-white">{formatCurrency(selectedSaleDetail.total)}</p>
              </div>
            </div>

            {/* Close / Action Button */}
            <button
              onClick={() => setSelectedSaleDetail(null)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
