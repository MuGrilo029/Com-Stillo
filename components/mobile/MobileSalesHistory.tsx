import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  CheckCircle,
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
  DollarSign,
  Clock
} from 'lucide-react';
import { CompanySettings, Sale, Transaction } from '../../types';
import { SalePrintTemplate } from '../SalePrintTemplate';
import { jsPDF } from 'jspdf';

interface MobileSalesHistoryProps {
  sales?: Sale[];
  transactions?: Transaction[];
  companySettings: CompanySettings;
  onSelectSale?: (sale: Sale) => void;
}

export const MobileSalesHistory: React.FC<MobileSalesHistoryProps> = ({
  sales = [],
  transactions = [],
  companySettings,
  onSelectSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'TODAY' | 'WEEK'>('ALL');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  const allSales: Sale[] = useMemo(() => sales, [sales]);

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

  const printSale = async () => {
    if (!selectedSaleDetail) return;

    const sale = selectedSaleDetail;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const right = pageWidth - margin;
    let y = 18;
    const money = (value: number) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const line = (position: number) => pdf.line(margin, position, right, position);
    const addText = (text: string, x: number, position: number, size = 9, bold = false) => {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      pdf.text(text, x, position);
    };

    addText(companySettings.name || 'COM STILLO', margin, y, 16, true);
    addText('PEDIDO DE VENDA', right, y, 14, true);
    pdf.text(`Av. ${companySettings.address || ''} | ${companySettings.phone || ''}`, margin, y + 7);
    pdf.text(`CNPJ: ${companySettings.cnpj || ''}`, margin, y + 13);
    pdf.text(`#${sale.id.slice(0, 8)}`, right, y + 7, { align: 'right' });
    pdf.text(`${new Date(sale.date).toLocaleDateString('pt-BR')} ${new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, right, y + 13, { align: 'right' });
    line(y + 17);
    y += 24;

    pdf.rect(margin, y - 5, pageWidth - margin * 2, 17);
    addText(`Cliente: ${sale.customerName || 'Cliente Balcão'}`, margin + 3, y + 1, 10, true);
    addText(`Telefone: ${sale.customerPhone || 'N/A'}`, margin + 3, y + 7, 10, true);
    addText(`Status: ${sale.status === 'COMPLETED' ? 'CONCLUÍDO' : 'CANCELADO'}`, right - 3, y + 1, 10, true);
    addText(`Entrega: ${sale.deliveryType === 'DELIVERY' ? 'Domicílio' : 'Retirada'}`, right - 3, y + 7, 10, true);
    y += 20;

    addText('QTD', margin, y, 8, true);
    addText('ITEM / DESCRIÇÃO', margin + 15, y, 8, true);
    addText('UNIT.', right - 42, y, 8, true);
    addText('TOTAL', right, y, 8, true);
    line(y + 2);
    y += 8;
    sale.items.forEach(item => {
      const description = item.description ? `${item.productName} - ${item.description}` : item.productName;
      const wrapped = pdf.splitTextToSize(description, 90);
      addText(`${item.quantity}x`, margin, y, 8, true);
      pdf.text(wrapped, margin + 15, y);
      addText(money(item.unitPrice), right - 42, y, 8);
      addText(money(item.quantity * item.unitPrice), right, y, 8, true);
      y += Math.max(6, wrapped.length * 4 + 2);
      line(y - 2);
    });

    const subtotal = sale.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
    y += 5;
    addText(`Subtotal: ${money(subtotal)}`, right - 55, y, 9);
    addText(`Desconto: - ${money(sale.discount || 0)}`, right - 55, y + 6, 9);
    line(y + 9);
    addText(`TOTAL: ${money(sale.total)}`, right - 55, y + 17, 13, true);
    y += 28;
    addText(`Forma de Pagamento: ${sale.paymentType === 'PARTIAL' ? 'Parcial / Entrada + Resto' : 'Integral / À Vista'}`, margin, y, 8, true);
    addText(`Meio: ${sale.paymentMethod || 'N/A'}`, margin + 92, y, 8);
    if (sale.paymentType === 'PARTIAL') {
      addText(`Entrada: ${money(sale.downPayment)} (${sale.downPaymentMethod || 'N/A'})`, margin, y + 6, 8);
      addText(`Restante: ${money(sale.remainingAmount)} (${sale.remainingPaymentMethod || 'N/A'})`, margin + 92, y + 6, 8);
      y += 6;
    }

    y += 12;
    line(y - 4);
    addText('HISTÓRICO DE PAGAMENTOS', margin, y + 2, 8, true);
    const paidTransactions = transactions.filter(transaction => transaction.status === 'PAID' && transaction.type === 'INCOME' && (transaction.saleId === sale.id || (transaction.description && transaction.description.includes(`Venda #${sale.id.slice(0, 4)}`))));
    y += 9;
    paidTransactions.forEach(transaction => {
      addText(`${new Date(transaction.date).toLocaleDateString('pt-BR')} - ${transaction.category || 'Pagamento'}`, margin, y, 8);
      addText(money(transaction.amount), right, y, 8, true);
      y += 5;
    });
    if (paidTransactions.length === 0) addText('Nenhum pagamento registrado.', margin, y, 8);
    addText(`SALDO DEVEDOR: ${money(sale.total - paidTransactions.reduce((total, transaction) => total + transaction.amount, 0))}`, right, y + 7, 9, true);
    y += 29;
    line(y);
    addText(companySettings.name || 'COM STILLO', margin + 25, y + 5, 8, true);
    addText('Assinatura do Responsável', margin + 21, y + 10, 7);
    addText(sale.customerName || 'Cliente', right - 55, y + 5, 8, true);
    addText('Assinatura do Cliente', right - 52, y + 10, 7);

    const pdfBlob = pdf.output('blob');
    const fileName = `comprovante-${sale.id}.pdf`;
    try {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'Comprovante de venda', files: [file] });
        return;
      }
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return;
    }
    const downloadUrl = URL.createObjectURL(pdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = fileName;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="flex flex-col gap-3.5 pb-4">
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
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-fast"
          onClick={() => setSelectedSaleDetail(null)}
        >
          <div
            className="w-full max-w-md bg-[#182234] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
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
                {selectedSaleDetail.customerAddress && (
                  <p className="text-[10px] text-slate-400">{selectedSaleDetail.customerAddress}</p>
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

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#111827] rounded-xl p-3 border border-white/5">
                <span className="text-slate-400 block">Entrega</span>
                <strong className="text-white">{selectedSaleDetail.deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada'}</strong>
              </div>
              <div className="bg-[#111827] rounded-xl p-3 border border-white/5">
                <span className="text-slate-400 block">Tipo de pagamento</span>
                <strong className="text-white">{selectedSaleDetail.paymentType === 'PARTIAL' ? 'Parcial' : 'Integral'}</strong>
              </div>
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
                      <p className="text-[10px] text-slate-400">{item.quantity}x {formatCurrency(item.unitPrice)}{item.variantName ? ` | ${item.variantName}` : ''}</p>
                      {item.description && <p className="text-[10px] text-slate-500">{item.description}</p>}
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

            <div className="bg-[#111827] rounded-2xl p-3 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400"><span>Desconto</span><strong className="text-white">{formatCurrency(selectedSaleDetail.discount || 0)}</strong></div>
              {selectedSaleDetail.paymentType === 'PARTIAL' && (
                <>
                  <div className="flex justify-between text-slate-400"><span>Entrada ({selectedSaleDetail.downPaymentMethod || selectedSaleDetail.paymentMethod})</span><strong className="text-emerald-400">{formatCurrency(selectedSaleDetail.downPayment || 0)}</strong></div>
                  <div className="flex justify-between text-slate-400"><span>Restante ({selectedSaleDetail.remainingPaymentMethod || 'Não informado'})</span><strong className="text-amber-400">{formatCurrency(selectedSaleDetail.remainingAmount || 0)}</strong></div>
                  <div className="flex justify-between text-slate-400"><span>Status do restante</span><strong className="text-white">{selectedSaleDetail.remainingStatus === 'PAID' ? 'Pago' : 'Pendente'}</strong></div>
                </>
              )}
              {selectedSaleDetail.deliveryDate && <div className="flex justify-between text-slate-400"><span>Data de entrega</span><strong className="text-white">{formatDateTime(selectedSaleDetail.deliveryDate)}</strong></div>}
            </div>

            {selectedSaleDetail.observations && (
              <div className="bg-[#111827] rounded-2xl p-3 border border-white/5 text-xs text-slate-300">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Observações</span>
                {selectedSaleDetail.observations}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={printSale} className="py-3 rounded-2xl bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2">
                <Receipt size={15} /> Salvar / Compartilhar PDF
              </button>
              <button onClick={() => setSelectedSaleDetail(null)} className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors">
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      <SalePrintTemplate
        sale={selectedSaleDetail}
        companySettings={companySettings}
        transactions={transactions}
        id="mobile-sale-print"
      />
    </div>
  );
};
