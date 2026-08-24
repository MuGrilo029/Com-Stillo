import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  QrCode,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  QrCode as PixIcon,
  Sparkles,
  User,
  ShoppingBag,
  ArrowRight,
  Receipt,
  Package,
  Layers,
  AlertCircle
} from 'lucide-react';
import { MobileCartItem } from './types';
import { Product, Customer } from '../../types';
import { getUUID } from '../../lib/utils';

interface MobileSalesPDVProps {
  products?: Product[];
  customers?: Customer[];
  cart: MobileCartItem[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateCartItemQty: (itemId: string, newQty: number) => void;
  onRemoveCartItem: (itemId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (saleData: {
    id: string;
    date: string;
    customerName: string;
    paymentMethod: string;
    total: number;
    items: MobileCartItem[];
  }) => Promise<boolean>;
}

export const MobileSalesPDV: React.FC<MobileSalesPDVProps> = ({
  products = [],
  customers = [],
  cart,
  onAddToCart,
  onUpdateCartItemQty,
  onRemoveCartItem,
  onClearCart,
  onCompleteSale
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('Cliente Balcão');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH'>('PIX');
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);
  const [isSavingSale, setIsSavingSale] = useState(false);

  const catalogProducts = useMemo(() => {
    return products;
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['TODOS', ...Array.from(set)];
  }, [catalogProducts]);

  // Filtered Products for search & quick add
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(p => {
      const matchQuery = searchTerm.trim() === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [catalogProducts, searchTerm, selectedCategory]);

  // Subtotal and Total calculations
  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  const handleFinishSale = async () => {
    if (cart.length === 0 || isSavingSale) return;
    setIsSavingSale(true);
    const saleRecord = {
      id: getUUID(),
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Cliente Balcão',
      paymentMethod,
      total: totalAmount,
      items: [...cart]
    };
    try {
      const saved = await onCompleteSale(saleRecord);
      if (!saved) return;
      setLastCompletedSale(saleRecord);
      setIsCheckoutOpen(false);
      setIsSuccessModalOpen(true);
    } finally {
      setIsSavingSale(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 pb-36 animate-fade-in-fast relative">
      {/* Search Bar & Quick Scanner */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar produto ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#182234] border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsCatalogOpen(true)}
          className="p-2.5 rounded-2xl bg-gradient-to-br from-red-900 to-rose-900 border border-rose-600/40 text-white hover:from-red-800 hover:to-rose-800 active:scale-95 shadow-md shadow-red-950/50 flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
          title="Ver Catálogo"
        >
          <Layers size={17} />
          <span className="hidden sm:inline">Catálogo</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-rose-900 text-white border border-rose-500/40 shadow-sm shadow-rose-950/50'
                : 'bg-[#182234] text-slate-300 border border-white/5 hover:text-white hover:bg-[#1e2c42]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Quick Search Dropdown Results if searching */}
      {searchTerm.trim() !== '' && (
        <div className="bg-[#182234] border border-white/15 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar animate-scale-in">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center justify-between border-b border-white/5">
            <span>Resultados da Busca ({filteredProducts.length})</span>
            <span className="text-[10px] text-slate-400">Toque para adicionar</span>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-center py-4 text-xs text-slate-400">Nenhum produto encontrado.</p>
          ) : (
            filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => {
                  onAddToCart(prod, 1);
                  setSearchTerm('');
                }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-700/60 active:bg-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-wine-950/60 border border-rose-900/30 flex items-center justify-center text-rose-300 font-bold text-xs">
                    {prod.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{prod.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400">{formatCurrency(prod.price)}</span>
                  <div className="w-6 h-6 rounded-full bg-rose-900/60 text-white flex items-center justify-center">
                    <Plus size={13} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cart Items List Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShoppingCart size={15} />
          </div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Itens na Venda ({totalItemsCount})
          </h3>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
          >
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {cart.length === 0 ? (
        <div className="bg-[#182234]/60 border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 my-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
            <ShoppingBag size={26} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Nenhum produto adicionado</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Use a busca acima ou abra o catálogo para adicionar itens à venda.
            </p>
          </div>
          <button
            onClick={() => setIsCatalogOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-900 to-rose-900 text-white text-xs font-bold shadow-md shadow-red-950/50 hover:from-red-800 hover:to-rose-800 active:scale-95 transition-all mt-1 flex items-center gap-1.5"
          >
            <Plus size={14} /> Adicionar Produtos
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-[#182234] border border-white/10 rounded-2xl p-3 flex items-center justify-between shadow-md shadow-black/20 gap-3 hover:border-white/20 transition-all"
            >
              {/* Product Thumbnail & Details */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-950 to-slate-900 border border-rose-900/30 flex items-center justify-center text-rose-300 font-bold text-sm shrink-0 shadow-inner">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Package size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {item.sku ? `SKU: ${item.sku}` : 'Cód. Padrão'}
                  </p>
                  <p className="text-xs font-black text-emerald-400 mt-0.5">
                    {formatCurrency(item.unitPrice)}
                  </p>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center bg-[#0B0F19] rounded-xl p-0.5 border border-white/10">
                  <button
                    onClick={() => onUpdateCartItemQty(item.id, item.quantity - 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-90"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center text-xs font-black text-white font-mono">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateCartItemQty(item.id, item.quantity + 1)}
                    className="w-6 h-6 rounded-lg bg-wine-900 text-white flex items-center justify-center active:scale-90"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <span className="text-[11px] font-extrabold text-slate-300 font-mono">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fixed Bottom Summary Bar (acima da barra flutuante de navegação) */}
      <div className="fixed bottom-[82px] sm:bottom-[88px] left-0 right-0 z-30 px-3 sm:px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto bg-[#111827]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 ring-1 ring-white/10">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})
            </span>
            <span className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <button
            onClick={() => {
              if (cart.length > 0) setIsCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all ${
              cart.length > 0
                ? 'bg-gradient-to-r from-red-900 via-wine-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white shadow-red-950/60 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <CheckCircle2 size={18} />
            <span>Finalizar Venda</span>
          </button>
        </div>
      </div>

      {/* Catalog Quick Add Drawer / Modal */}
      {isCatalogOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-fast"
          onClick={() => setIsCatalogOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#182234] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up flex flex-col gap-3 text-slate-100 max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-wine-900/60 border border-rose-600/30 flex items-center justify-center text-rose-300">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Catálogo de Produtos</h3>
                  <p className="text-[10px] text-slate-400">Toque no item para incluir na venda</p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Catalog Items Scroll List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 py-1 pr-1">
              {catalogProducts.map((prod) => {
                const inCart = cart.find(c => c.productId === prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => onAddToCart(prod, 1)}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-[#111827]/80 border border-white/5 hover:border-rose-500/30 hover:bg-[#1e2c42] cursor-pointer active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-wine-950/80 border border-rose-900/30 flex items-center justify-center text-rose-300 font-bold text-sm">
                        {prod.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{prod.category || 'Geral'}</span>
                          <span>•</span>
                          <span className="text-slate-300">Estoque: {prod.quantity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-400">
                        {formatCurrency(prod.price)}
                      </span>
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                          inCart
                            ? 'bg-rose-900 text-white'
                            : 'bg-slate-800 text-slate-200 hover:bg-wine-900 hover:text-white'
                        }`}
                      >
                        {inCart ? inCart.quantity : <Plus size={14} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsCatalogOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors mt-1"
            >
              Concluir Seleção ({totalItemsCount} no carrinho)
            </button>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-fast"
          onClick={() => setIsCheckoutOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#182234] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up flex flex-col gap-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-900 to-rose-900 flex items-center justify-center text-white">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Finalizar Venda</h3>
                  <p className="text-[10px] text-slate-400">Selecione o pagamento e confirme</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Total Highlight */}
            <div className="bg-gradient-to-r from-red-950/60 to-rose-950/60 border border-rose-800/40 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                Valor Total da Venda
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {formatCurrency(totalAmount)}
              </h2>
            </div>

            {/* Customer Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <User size={12} className="text-rose-400" /> Cliente / Identificação
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente (ex: João Silva)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'PIX', label: 'PIX (Instantâneo)', icon: PixIcon },
                  { id: 'CREDIT_CARD', label: 'Cartão Crédito', icon: CreditCard },
                  { id: 'DEBIT_CARD', label: 'Cartão Débito', icon: CreditCard },
                  { id: 'CASH', label: 'Dinheiro', icon: Banknote }
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-rose-900/80 border-rose-500 text-white shadow-sm'
                          : 'bg-[#111827] border-white/5 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={15} className={isSelected ? 'text-rose-300' : 'text-slate-400'} />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleFinishSale}
              disabled={isSavingSale}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-900 via-wine-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white font-extrabold text-sm shadow-xl shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
            >
              <CheckCircle2 size={18} />
              {isSavingSale ? 'Salvando venda...' : 'Confirmar e Emitir Comprovante'}
            </button>
          </div>
        </div>
      )}

      {/* Sale Success Receipt Modal */}
      {isSuccessModalOpen && lastCompletedSale && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-fast"
          onClick={() => setIsSuccessModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#182234] border border-emerald-500/30 rounded-3xl p-5 shadow-2xl animate-scale-in flex flex-col gap-4 text-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Venda Concluída!</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pedido registrado com sucesso no sistema</p>
            </div>

            <div className="bg-[#111827] border border-white/10 rounded-2xl p-3.5 text-left flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Pedido:</span>
                <strong className="text-white font-mono">{lastCompletedSale.id}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cliente:</span>
                <strong className="text-white">{lastCompletedSale.customerName}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pagamento:</span>
                <span className="text-rose-300 font-bold">{lastCompletedSale.paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <span className="font-bold text-slate-300">Total Pago:</span>
                <strong className="text-base font-black text-emerald-400">
                  {formatCurrency(lastCompletedSale.total)}
                </strong>
              </div>
            </div>

            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-wine-900 hover:bg-wine-800 text-white font-bold text-xs shadow-md shadow-wine-950 transition-all active:scale-95"
            >
              Iniciar Nova Venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
