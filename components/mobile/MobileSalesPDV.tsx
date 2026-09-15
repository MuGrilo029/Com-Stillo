import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  QrCode as PixIcon,
  Sparkles,
  User,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Receipt,
  Package,
  Layers,
  AlertCircle,
  MapPin,
  Truck,
  Store,
  Calendar,
  Tag,
  FileText,
  Phone,
  Split,
  ChevronRight,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { MobileCartItem } from './types';
import { Product, Customer, Sale } from '../../types';
import { getUUID } from '../../lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type CheckoutStep = 'CART' | 'CUSTOMER' | 'PAYMENT' | 'REVIEW';

type PaymentMethodId = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO';

interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MobileSalesPDVProps {
  products?: Product[];
  customers?: Customer[];
  cart: MobileCartItem[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateCartItemQty: (itemId: string, newQty: number) => void;
  onRemoveCartItem: (itemId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (saleData: Omit<Sale, 'status'> & { items: MobileCartItem[] }) => Promise<boolean>;
}

// ─── Payment Method Definitions ───────────────────────────────────────────────

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'PIX', label: 'PIX', icon: PixIcon },
  { id: 'CREDIT_CARD', label: 'Crédito', icon: CreditCard },
  { id: 'DEBIT_CARD', label: 'Débito', icon: CreditCard },
  { id: 'CASH', label: 'Dinheiro', icon: Banknote },
  { id: 'BOLETO', label: 'Boleto', icon: FileText },
];

const PM_LABEL: Record<PaymentMethodId, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD: 'Cartão Débito',
  CASH: 'Dinheiro',
  BOLETO: 'Boleto',
};

// ─── Main Component ───────────────────────────────────────────────────────────

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
  // Navigation State
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('CART');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);
  const [isSavingSale, setIsSavingSale] = useState(false);

  // ── Customer Form State ──────────────────────────────────────────────────────
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('Cliente Balcão');
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerComplement, setCustomerComplement] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [observations, setObservations] = useState('');
  const [deliveryObservations, setDeliveryObservations] = useState('');

  // ── Payment State ────────────────────────────────────────────────────────────
  const [discount, setDiscount] = useState(0);
  const [discountInput, setDiscountInput] = useState('0');
  const [isPartial, setIsPartial] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('PIX');
  const [downPaymentMethod, setDownPaymentMethod] = useState<PaymentMethodId>('PIX');
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState<PaymentMethodId>('CREDIT_CARD');
  const [downPaymentInput, setDownPaymentInput] = useState('0');
  const [isRemainingPaidNow, setIsRemainingPaidNow] = useState(false);

  // ── Derived Values ────────────────────────────────────────────────────────────
  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cart]
  );
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
  const downPayment = useMemo(() => Math.min(total, parseFloat(downPaymentInput) || 0), [total, downPaymentInput]);
  const remainingAmount = useMemo(() => Math.max(0, total - downPayment), [total, downPayment]);
  const totalItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  // ── Filtered data ──────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return ['TODOS', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchQuery = searchTerm.trim() === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === 'TODOS' || p.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    return customers
      .filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch) ||
        c.cpfCnpj?.includes(customerSearch)
      )
      .slice(0, 6);
  }, [customers, customerSearch]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerName(c.name);
    setCustomerCpfCnpj(c.cpfCnpj || '');
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    if (c.address) {
      setCustomerAddress(c.address);
      setDeliveryType('DELIVERY');
    }
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    setShowNewCustomerForm(false);
  };

  const handleDiscountChange = (raw: string) => {
    setDiscountInput(raw);
    const parsed = parseFloat(raw.replace(',', '.')) || 0;
    setDiscount(Math.min(subtotal, Math.max(0, parsed)));
  };

  const handleDownPaymentChange = (raw: string) => {
    setDownPaymentInput(raw);
  };

  const resetAll = () => {
    setCheckoutStep('CART');
    setCustomerSearch('');
    setSelectedCustomer(null);
    setCustomerName('Cliente Balcão');
    setCustomerCpfCnpj('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerNumber('');
    setCustomerComplement('');
    setCustomerCity('');
    setDeliveryType('PICKUP');
    setDeliveryDate('');
    setDeliveryTime('');
    setObservations('');
    setDeliveryObservations('');
    setDiscount(0);
    setDiscountInput('0');
    setIsPartial(false);
    setPaymentMethod('PIX');
    setDownPaymentMethod('PIX');
    setRemainingPaymentMethod('CREDIT_CARD');
    setDownPaymentInput('0');
    setIsRemainingPaidNow(false);
  };

  // ── Finish Sale ───────────────────────────────────────────────────────────
  const handleFinishSale = async () => {
    if (cart.length === 0 || isSavingSale) return;
    setIsSavingSale(true);

    const saleData: any = {
      id: getUUID(),
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Cliente Balcão',
      customerCpfCnpj: customerCpfCnpj.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerAddress: deliveryType === 'DELIVERY' ? customerAddress.trim() || undefined : undefined,
      customerNumber: deliveryType === 'DELIVERY' ? customerNumber.trim() || undefined : undefined,
      customerComplement: deliveryType === 'DELIVERY' ? customerComplement.trim() || undefined : undefined,
      customerCity: deliveryType === 'DELIVERY' ? customerCity.trim() || undefined : undefined,
      deliveryType,
      deliveryDate: deliveryDate || undefined,
      deliveryTime: deliveryTime || undefined,
      observations: observations.trim() || undefined,
      deliveryObservations: deliveryObservations.trim() || undefined,
      total,
      discount,
      paymentMethod: isPartial ? downPaymentMethod : paymentMethod,
      paymentType: isPartial ? 'PARTIAL' : 'FULL',
      downPaymentMethod: isPartial ? downPaymentMethod : undefined,
      downPayment: isPartial ? downPayment : total,
      remainingPaymentMethod: isPartial ? remainingPaymentMethod : undefined,
      remainingAmount: isPartial ? remainingAmount : 0,
      remainingStatus: isPartial ? (isRemainingPaidNow ? 'PAID' : 'PENDING') : 'PAID',
      items: [...cart],
    };

    try {
      const saved = await onCompleteSale(saleData);
      if (!saved) return;
      setLastCompletedSale(saleData);
      setIsSuccessModalOpen(true);
      resetAll();
    } finally {
      setIsSavingSale(false);
    }
  };

  // ── Step Validation ────────────────────────────────────────────────────────
  const canGoToPayment = customerName.trim().length > 0 &&
    (deliveryType === 'PICKUP' || customerAddress.trim().length > 0);

  // ── Payment Method Selector ────────────────────────────────────────────────
  const PaymentSelector = ({
    value,
    onChange
  }: {
    value: PaymentMethodId;
    onChange: (v: PaymentMethodId) => void;
  }) => (
    <div className="grid grid-cols-5 gap-1.5">
      {PAYMENT_METHODS.map((pm) => {
        const Icon = pm.icon;
        const isSelected = value === pm.id;
        return (
          <button
            key={pm.id}
            onClick={() => onChange(pm.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold transition-all gap-1 ${
              isSelected
                ? 'bg-rose-900/80 border-rose-500 text-white shadow-sm shadow-rose-950'
                : 'bg-[#111827] border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
            }`}
          >
            <Icon size={16} className={isSelected ? 'text-rose-300' : ''} />
            <span>{pm.label}</span>
          </button>
        );
      })}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3.5 pb-36 relative">

      {/* ── CART VIEW ───────────────────────────────────────────────────────── */}
      {checkoutStep === 'CART' && (
        <>
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produto ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#182234] border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all shadow-inner"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5">
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="p-2.5 rounded-2xl bg-gradient-to-br from-red-900 to-rose-900 border border-rose-600/40 text-white hover:from-red-800 hover:to-rose-800 active:scale-95 shadow-md shadow-red-950/50 flex items-center justify-center gap-1.5 text-xs font-bold shrink-0"
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

          {/* Quick Search Results */}
          {searchTerm.trim() !== '' && (
            <div className="bg-[#182234] border border-white/15 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar animate-scale-in">
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center justify-between border-b border-white/5">
                <span>Resultados ({filteredProducts.length})</span>
                <span className="text-[10px] text-slate-400">Toque para adicionar</span>
              </div>
              {filteredProducts.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">Nenhum produto encontrado.</p>
              ) : (
                filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => { onAddToCart(prod, 1); setSearchTerm(''); }}
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
                      <span className="text-xs font-black text-emerald-400">{fmt(prod.price)}</span>
                      <div className="w-6 h-6 rounded-full bg-rose-900/60 text-white flex items-center justify-center">
                        <Plus size={13} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Cart Items Header */}
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
              <button onClick={onClearCart} className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline">
                <Trash2 size={12} /> Limpar
              </button>
            )}
          </div>

          {/* Cart Items */}
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
                      <p className="text-xs font-black text-emerald-400 mt-0.5">{fmt(item.unitPrice)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center bg-[#0B0F19] rounded-xl p-0.5 border border-white/10">
                      <button
                        onClick={() => onUpdateCartItemQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-90"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-xs font-black text-white font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateCartItemQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-wine-900 text-white flex items-center justify-center active:scale-90"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-slate-300 font-mono">
                        {fmt(item.unitPrice * item.quantity)}
                      </span>
                      <button
                        onClick={() => onRemoveCartItem(item.id)}
                        className="w-5 h-5 rounded-lg text-slate-500 hover:text-rose-400 flex items-center justify-center transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CUSTOMER STEP ───────────────────────────────────────────────────── */}
      {checkoutStep === 'CUSTOMER' && (
        <div className="flex flex-col gap-4 animate-fade-in-fast">
          {/* Back Button */}
          <button
            onClick={() => setCheckoutStep('CART')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} /> Voltar ao Carrinho
          </button>

          <div className="flex items-center gap-2 pb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-900 to-rose-900 flex items-center justify-center text-white">
              <User size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Dados do Cliente</h3>
              <p className="text-[10px] text-slate-400">Passo 1 de 3</p>
            </div>
          </div>

          {/* Customer Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <UserCheck size={12} className="text-rose-400" /> Buscar Cliente Cadastrado
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Pesquisar por nome, CPF ou telefone..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              {customerSearch && (
                <button onClick={() => { setCustomerSearch(''); setShowCustomerDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={14} />
                </button>
              )}
            </div>
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="bg-[#0B0F19] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 text-left border-b border-white/5 last:border-0 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-900/40 border border-rose-800/40 flex items-center justify-center text-rose-300 font-bold text-xs shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.phone || c.cpfCnpj || 'Sem contato'}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 shrink-0 ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
            <div className="flex-1 h-px bg-white/5" />
            ou preencha manualmente
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Customer Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <User size={12} className="text-rose-400" /> Nome do Cliente *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Customer Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Phone size={12} className="text-rose-400" /> Telefone
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Customer CPF/CNPJ */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <FileText size={12} className="text-rose-400" /> CPF / CNPJ
            </label>
            <input
              type="text"
              value={customerCpfCnpj}
              onChange={(e) => setCustomerCpfCnpj(e.target.value)}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Customer Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <FileText size={12} className="text-rose-400" /> Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Delivery Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <MapPin size={12} className="text-rose-400" /> Tipo de Entrega
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'PICKUP', label: 'Retirada na Loja', icon: Store },
                { id: 'DELIVERY', label: 'Entrega no Endereço', icon: Truck }
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setDeliveryType(id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                    deliveryType === id
                      ? 'bg-rose-900/80 border-rose-500 text-white'
                      : 'bg-[#111827] border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Address (when DELIVERY) */}
          {deliveryType === 'DELIVERY' && (
            <div className="flex flex-col gap-1.5 animate-fade-in-fast">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={12} className="text-rose-400" /> Endereço de Entrega *
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Rua e Bairro..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="Número"
                  className="px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <input
                  type="text"
                  value={customerComplement}
                  onChange={(e) => setCustomerComplement(e.target.value)}
                  placeholder="Complemento"
                  className="col-span-2 px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="Cidade"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Delivery Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} className="text-rose-400" /> Data de Entrega / Prazo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="Horário"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Delivery Observations */}
          {deliveryType === 'DELIVERY' && (
            <div className="flex flex-col gap-1.5 animate-fade-in-fast">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Truck size={12} className="text-rose-400" /> Observações de Entrega
              </label>
              <textarea
                value={deliveryObservations}
                onChange={(e) => setDeliveryObservations(e.target.value)}
                placeholder="Ex: Portão destravado, entregar entre 8h-17h, deixar com porteiro..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>
          )}

          {/* Observations */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <FileText size={12} className="text-rose-400" /> Observações do Pedido
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Informações adicionais sobre o pedido..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />
          </div>

          {/* Next Button */}
          <button
            onClick={() => { if (canGoToPayment) setCheckoutStep('PAYMENT'); }}
            disabled={!canGoToPayment}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-900 via-wine-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white font-extrabold text-sm shadow-xl shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight size={18} />
            Ir para Pagamento
          </button>
        </div>
      )}

      {/* ── PAYMENT STEP ────────────────────────────────────────────────────── */}
      {checkoutStep === 'PAYMENT' && (
        <div className="flex flex-col gap-4 animate-fade-in-fast">
          {/* Back */}
          <button onClick={() => setCheckoutStep('CUSTOMER')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={15} /> Voltar para Cliente
          </button>

          <div className="flex items-center gap-2 pb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-900 to-rose-900 flex items-center justify-center text-white">
              <CreditCard size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Condições de Pagamento</h3>
              <p className="text-[10px] text-slate-400">Passo 2 de 3</p>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-gradient-to-r from-red-950/60 to-rose-950/60 border border-rose-800/40 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Subtotal da Venda</p>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">{fmt(subtotal)}</h2>
          </div>

          {/* Discount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Tag size={12} className="text-rose-400" /> Desconto (R$)
            </label>
            <input
              type="number"
              value={discountInput}
              onChange={(e) => handleDiscountChange(e.target.value)}
              placeholder="0,00"
              min="0"
              max={subtotal}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            {discount > 0 && (
              <div className="flex justify-between text-[11px] px-1">
                <span className="text-slate-400">Total com desconto:</span>
                <span className="font-black text-emerald-400">{fmt(total)}</span>
              </div>
            )}
          </div>

          {/* Payment Type Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Tipo de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPartial(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  !isPartial
                    ? 'bg-rose-900/80 border-rose-500 text-white'
                    : 'bg-[#111827] border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <CheckCircle2 size={15} />
                Pagamento Integral
              </button>
              <button
                onClick={() => setIsPartial(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  isPartial
                    ? 'bg-rose-900/80 border-rose-500 text-white'
                    : 'bg-[#111827] border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                <Split size={15} />
                Entrada + Restante
              </button>
            </div>
          </div>

          {/* FULL PAYMENT */}
          {!isPartial && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Forma de Pagamento
              </label>
              <PaymentSelector value={paymentMethod} onChange={setPaymentMethod} />
            </div>
          )}

          {/* PARTIAL PAYMENT */}
          {isPartial && (
            <div className="flex flex-col gap-3 animate-fade-in-fast">
              {/* Down Payment */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={12} /> Entrada (Agora)
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Valor da Entrada (R$)</label>
                  <input
                    type="number"
                    value={downPaymentInput}
                    onChange={(e) => handleDownPaymentChange(e.target.value)}
                    placeholder="0,00"
                    min="0"
                    max={total}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Método da Entrada</label>
                  <PaymentSelector value={downPaymentMethod} onChange={setDownPaymentMethod} />
                </div>
              </div>

              {/* Remaining */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Receipt size={12} /> Restante
                  </p>
                  <span className="text-sm font-black text-white">{fmt(remainingAmount)}</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Método do Restante</label>
                  <PaymentSelector value={remainingPaymentMethod} onChange={setRemainingPaymentMethod} />
                </div>

                {/* Status do Restante */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Quando o Restante é Pago?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsRemainingPaidNow(true)}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        isRemainingPaidNow
                          ? 'bg-emerald-900/60 border-emerald-500/60 text-emerald-300'
                          : 'bg-[#0B0F19] border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <CheckCircle2 size={13} /> Pago Agora
                    </button>
                    <button
                      onClick={() => setIsRemainingPaidNow(false)}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        !isRemainingPaidNow
                          ? 'bg-amber-900/60 border-amber-500/60 text-amber-300'
                          : 'bg-[#0B0F19] border-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Calendar size={13} /> A Receber
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#0B0F19] border border-white/5 rounded-xl px-3.5 py-2.5 flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total</span><span className="font-bold text-white">{fmt(total)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Entrada</span><span className="font-bold">{fmt(downPayment)}</span>
                </div>
                <div className={`flex justify-between ${isRemainingPaidNow ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <span>Restante ({isRemainingPaidNow ? 'Pago Agora' : 'A Receber'})</span>
                  <span className="font-bold">{fmt(remainingAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={() => setCheckoutStep('REVIEW')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-900 via-wine-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white font-extrabold text-sm shadow-xl shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
          >
            <ArrowRight size={18} />
            Revisar Pedido
          </button>
        </div>
      )}

      {/* ── REVIEW STEP ─────────────────────────────────────────────────────── */}
      {checkoutStep === 'REVIEW' && (
        <div className="flex flex-col gap-4 animate-fade-in-fast">
          {/* Back */}
          <button onClick={() => setCheckoutStep('PAYMENT')} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={15} /> Voltar para Pagamento
          </button>

          <div className="flex items-center gap-2 pb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-900 to-rose-900 flex items-center justify-center text-white">
              <Receipt size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Revisão do Pedido</h3>
              <p className="text-[10px] text-slate-400">Passo 3 de 3 — Confirme antes de finalizar</p>
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-[#182234] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <User size={11} /> Cliente
            </p>
            <p className="font-bold text-white text-sm">{customerName}</p>
            {customerCpfCnpj && <p className="text-xs text-slate-400 flex items-center gap-1.5"><FileText size={11} /> {customerCpfCnpj}</p>}
            {customerPhone && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Phone size={11} /> {customerPhone}</p>}
            {customerEmail && <p className="text-xs text-slate-400 truncate">{customerEmail}</p>}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {deliveryType === 'DELIVERY' ? <Truck size={11} className="text-emerald-400" /> : <Store size={11} className="text-blue-400" />}
              <span>{deliveryType === 'DELIVERY' ? 'Entrega' : 'Retirada na loja'}</span>
            </div>
            {deliveryType === 'DELIVERY' && customerAddress && (
              <p className="text-xs text-slate-400 flex items-start gap-1.5">
                <MapPin size={11} className="shrink-0 mt-0.5" />
                <span>
                  {customerAddress}
                  {customerNumber && `, ${customerNumber}`}
                  {customerComplement && ` - ${customerComplement}`}
                  {customerCity && `, ${customerCity}`}
                </span>
              </p>
            )}
            {deliveryDate && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar size={11} /> 
                Entrega: {new Date(deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                {deliveryTime && ` às ${deliveryTime}`}
              </p>
            )}
            {deliveryObservations && (
              <p className="text-xs text-slate-400 flex items-start gap-1.5 italic">
                <Truck size={11} className="shrink-0 mt-0.5" /> {deliveryObservations}
              </p>
            )}
            {observations && (
              <p className="text-xs text-slate-400 flex items-start gap-1.5"><FileText size={11} className="shrink-0 mt-0.5" /> {observations}</p>
            )}
          </div>

          {/* Itens Card */}
          <div className="bg-[#182234] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <ShoppingCart size={11} /> Itens ({totalItemsCount})
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3.5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.quantity}x {fmt(item.unitPrice)}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-400 shrink-0 ml-3">{fmt(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financials Card */}
          <div className="bg-[#182234] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <CreditCard size={11} /> Financeiro
            </p>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold text-white">{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Desconto</span>
                  <span className="font-bold">– {fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-black border-t border-white/10 pt-1.5">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {!isPartial ? (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Pagamento:</span>
                <span className="font-bold text-white">{PM_LABEL[paymentMethod]}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-emerald-400 font-bold">Entrada ({PM_LABEL[downPaymentMethod]})</span>
                  <span className="font-black text-emerald-400">{fmt(downPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`font-bold ${isRemainingPaidNow ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Restante ({PM_LABEL[remainingPaymentMethod]}) — {isRemainingPaidNow ? 'Pago Agora' : 'A Receber'}
                  </span>
                  <span className={`font-black ${isRemainingPaidNow ? 'text-emerald-400' : 'text-amber-400'}`}>{fmt(remainingAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleFinishSale}
            disabled={isSavingSale || cart.length === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-900 via-wine-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white font-extrabold text-sm shadow-xl shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingSale ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Salvando venda...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Confirmar e Finalizar Venda
              </>
            )}
          </button>
        </div>
      )}

      {/* ── BOTTOM SUMMARY BAR (only on CART step) ──────────────────────────── */}
      {checkoutStep === 'CART' && (
        <div className="fixed bottom-[82px] sm:bottom-[88px] left-0 right-0 z-30 px-3 sm:px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto bg-[#111827]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 ring-1 ring-white/10">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})
              </span>
              <span className="text-lg sm:text-xl font-black text-white tracking-tight leading-none">
                {fmt(subtotal)}
              </span>
            </div>

            <button
              onClick={() => { if (cart.length > 0) setCheckoutStep('CUSTOMER'); }}
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
      )}

      {/* ── CATALOG DRAWER ──────────────────────────────────────────────────── */}
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
              <button onClick={() => setIsCatalogOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 py-1 pr-1">
              {products.map((prod) => {
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
                      <span className="text-xs font-black text-emerald-400">{fmt(prod.price)}</span>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                        inCart ? 'bg-rose-900 text-white' : 'bg-slate-800 text-slate-200 hover:bg-wine-900 hover:text-white'
                      }`}>
                        {inCart ? inCart.quantity : <Plus size={14} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setIsCatalogOpen(false)} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors mt-1">
              Concluir Seleção ({totalItemsCount} no carrinho)
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL ────────────────────────────────────────────────────── */}
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
                <span>Cliente:</span>
                <strong className="text-white">{lastCompletedSale.customerName}</strong>
              </div>
              {lastCompletedSale.deliveryType === 'DELIVERY' && (
                <div className="flex justify-between text-slate-400">
                  <span>Entrega:</span>
                  <span className="text-emerald-300 font-bold">Sim</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Desconto:</span>
                <span className="text-rose-300 font-bold">{fmt(lastCompletedSale.discount || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pagamento:</span>
                <span className="text-rose-300 font-bold">
                  {lastCompletedSale.paymentType === 'PARTIAL'
                    ? `Entrada ${fmt(lastCompletedSale.downPayment)} + Restante ${fmt(lastCompletedSale.remainingAmount)}`
                    : PM_LABEL[lastCompletedSale.paymentMethod as PaymentMethodId] || lastCompletedSale.paymentMethod}
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <span className="font-bold text-slate-300">Total:</span>
                <strong className="text-base font-black text-emerald-400">{fmt(lastCompletedSale.total)}</strong>
              </div>
            </div>

            <button
              onClick={() => { setIsSuccessModalOpen(false); }}
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
