import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  ChevronRight,
  AlertTriangle,
  Boxes,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  ArrowUpDown,
  Tag,
  DollarSign,
  TrendingDown,
  Info,
  Edit3
} from 'lucide-react';
import { Product } from '../../types';

interface MobileInventoryProps {
  products?: Product[];
  onUpdateProductStock?: (productId: string, newQuantity: number, reason?: string) => void;
  onAddProductClick?: () => void;
  initialFilterCritical?: boolean;
}

export const MobileInventory: React.FC<MobileInventoryProps> = ({
  products = [],
  onUpdateProductStock,
  onAddProductClick,
  initialFilterCritical = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [onlyCriticalFilter, setOnlyCriticalFilter] = useState(initialFilterCritical);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stock Adjustment State
  const [stockAdjustmentQty, setStockAdjustmentQty] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Ajuste Manual');

  // Fallback demo inventory if empty
  const catalogProducts: Product[] = useMemo(() => {
    if (products && products.length > 0) return products;
    return [
      { id: 'p1', name: 'Sofá Retrátil Florença 2.30m', sku: 'EST-001', price: 2890.0, cost: 1600.0, quantity: 5, minStock: 2, category: 'Estofados' },
      { id: 'p2', name: 'Poltrona Giratória Velvet Terracota', sku: 'POL-012', price: 790.0, cost: 420.0, quantity: 2, minStock: 4, category: 'Poltronas' },
      { id: 'p3', name: 'Mesa de Centro Rústica Carvalho', sku: 'MES-004', price: 650.0, cost: 350.0, quantity: 1, minStock: 3, category: 'Móveis' },
      { id: 'p4', name: 'Almofada Linho Premium 45x45', sku: 'ALM-088', price: 89.9, cost: 35.0, quantity: 35, minStock: 10, category: 'Acessórios' },
      { id: 'p5', name: 'Puff Redondo Bouclé Off-White', sku: 'PUF-003', price: 340.0, cost: 170.0, quantity: 12, minStock: 4, category: 'Puffs' },
      { id: 'p6', name: 'Kit Impermeabilização Tecido', sku: 'SRV-001', price: 350.0, cost: 90.0, quantity: 0, minStock: 5, category: 'Serviços' },
      { id: 'p7', name: 'Sofá Modular Comfort 3.00m Bouclé', sku: 'EST-008', price: 4800.0, cost: 2700.0, quantity: 3, minStock: 2, category: 'Estofados' },
      { id: 'p8', name: 'Mesa de Jantar Madeira Maciça 6 Lugares', sku: 'MES-015', price: 2100.0, cost: 1200.0, quantity: 0, minStock: 2, category: 'Móveis' }
    ];
  }, [products]);

  // Metric Computations: "Total em Estoque" and "Itens Parados / Críticos"
  const totalStockUnits = useMemo(() => {
    return catalogProducts.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  }, [catalogProducts]);

  const totalStockValue = useMemo(() => {
    return catalogProducts.reduce((acc, p) => acc + ((Number(p.cost) || Number(p.price) * 0.6) * (Number(p.quantity) || 0)), 0);
  }, [catalogProducts]);

  const criticalProductsCount = useMemo(() => {
    return catalogProducts.filter(p => (Number(p.quantity) || 0) <= (Number(p.minStock) || 2)).length;
  }, [catalogProducts]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['TODOS', ...Array.from(set)];
  }, [catalogProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(p => {
      const matchSearch =
        searchTerm.trim() === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;

      const isCritical = (Number(p.quantity) || 0) <= (Number(p.minStock) || 2);
      const matchCritical = !onlyCriticalFilter || isCritical;

      return matchSearch && matchCategory && matchCritical;
    });
  }, [catalogProducts, searchTerm, selectedCategory, onlyCriticalFilter]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(val);
  };

  const handleOpenProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustmentQty(product.quantity || 0);
    setAdjustmentReason('Ajuste de Estoque');
  };

  const handleSaveStockAdjustment = () => {
    if (!selectedProduct) return;
    if (onUpdateProductStock) {
      onUpdateProductStock(selectedProduct.id, stockAdjustmentQty, adjustmentReason);
    }
    // Update local state for immediate visual feedback
    selectedProduct.quantity = stockAdjustmentQty;
    setSelectedProduct(null);
  };

  return (
    <div className="flex flex-col gap-3.5 pb-4 animate-fade-in-fast">
      {/* Title Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <Package size={12} /> Gestão de Produtos
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">Estoque</h2>
        </div>
      </div>

      {/* Dois Cards de Resumo no Topo */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Total em Estoque */}
        <div
          onClick={() => setOnlyCriticalFilter(false)}
          className={`bg-gradient-to-br from-[#182234] to-[#121a29] border rounded-2xl p-3.5 flex flex-col justify-between shadow-lg shadow-black/20 transition-all cursor-pointer ${
            !onlyCriticalFilter ? 'border-white/20 ring-1 ring-white/10' : 'border-white/10 opacity-90'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total em Estoque
            </span>
            <div className="w-7 h-7 rounded-xl bg-wine-900/40 border border-rose-600/30 flex items-center justify-center text-rose-300">
              <Boxes size={15} />
            </div>
          </div>

          <div className="my-1.5">
            <h3 className="text-xl font-black text-white tracking-tight leading-none">
              {totalStockUnits} <span className="text-xs font-semibold text-slate-400">unidades</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <span className="text-[10px] text-emerald-400 font-bold">
              {formatCurrency(totalStockValue)}
            </span>
            <span className="text-[10px] text-slate-400">em valor</span>
          </div>
        </div>

        {/* Card 2: Itens Parados / Críticos */}
        <div
          onClick={() => setOnlyCriticalFilter(!onlyCriticalFilter)}
          className={`border rounded-2xl p-3.5 flex flex-col justify-between shadow-lg shadow-black/20 transition-all cursor-pointer ${
            onlyCriticalFilter
              ? 'bg-gradient-to-br from-red-950/60 to-[#182234] border-rose-500 ring-1 ring-rose-500/50'
              : criticalProductsCount > 0
              ? 'bg-gradient-to-br from-red-950/30 via-[#182234] to-[#121a29] border-rose-800/40'
              : 'bg-gradient-to-br from-[#182234] to-[#121a29] border-white/10'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
              Itens Parados
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle size={15} />
            </div>
          </div>

          <div className="my-1.5">
            <h3 className="text-xl font-black text-rose-400 tracking-tight leading-none">
              {criticalProductsCount} <span className="text-xs font-semibold text-slate-400">críticos</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
            <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded-md border border-rose-800/40">
              {onlyCriticalFilter ? 'Filtro Ativo' : 'Toque p/ filtrar'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar produto, código ou SKU..."
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

      {/* Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-rose-900 text-white border border-rose-500/40 shadow-sm shadow-rose-950/50'
                : 'bg-[#182234] text-slate-300 border border-white/5 hover:text-white hover:bg-[#1e2c42]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="flex flex-col gap-2.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-[#182234]/60 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Package size={32} className="text-slate-500 mb-1" />
            <p className="text-sm font-bold text-slate-200">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-400">Tente buscar por outro termo ou categoria.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const qty = Number(product.quantity) || 0;
            const min = Number(product.minStock) || 2;
            const isZero = qty === 0;
            const isLow = qty > 0 && qty <= min;

            return (
              <div
                key={product.id}
                onClick={() => handleOpenProductDetail(product)}
                className="bg-[#182234] border border-white/10 hover:border-white/20 rounded-2xl p-3.5 shadow-md shadow-black/20 flex items-center justify-between gap-3 active:scale-98 transition-all cursor-pointer group"
              >
                {/* Photo / Styled Placeholder */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-950 via-[#182234] to-slate-900 border border-rose-900/30 flex items-center justify-center text-rose-300 font-bold text-base shrink-0 shadow-inner group-hover:border-rose-500/40 transition-colors">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Package size={20} />
                  )}
                </div>

                {/* Product Name & SKU */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-rose-200 transition-colors">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono">{product.sku ? `SKU: ${product.sku}` : 'Cód. Padrão'}</span>
                    <span>•</span>
                    <span className="text-slate-300">{product.category || 'Geral'}</span>
                  </div>
                  <p className="text-xs font-black text-emerald-400 mt-1">
                    {formatCurrency(Number(product.price) || 0)}
                  </p>
                </div>

                {/* Quantity on Hand Badge & Chevron Right Icon */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black border ${
                        isZero
                          ? 'bg-rose-950/80 text-rose-400 border-rose-700/50'
                          : isLow
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-200 border-white/10'
                      }`}
                    >
                      {qty} un
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">
                      {isZero ? 'Esgotado' : isLow ? 'Baixo' : 'Disponível'}
                    </span>
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Details & Quick Stock Adjustment Modal / Sheet */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-fast"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-md bg-[#182234] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-slide-up flex flex-col gap-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-wine-900/60 border border-rose-600/30 flex items-center justify-center text-rose-300">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white line-clamp-1">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    SKU: {selectedProduct.sku || 'N/A'} • {selectedProduct.category || 'Geral'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Financial Details Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#111827] p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Preço de Venda</span>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  {formatCurrency(Number(selectedProduct.price) || 0)}
                </p>
              </div>
              <div className="bg-[#111827] p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Custo Unitário</span>
                <p className="text-base font-black text-slate-300 mt-0.5">
                  {formatCurrency(Number(selectedProduct.cost) || 0)}
                </p>
              </div>
            </div>

            {/* Quick Stock Modifier Box */}
            <div className="bg-gradient-to-br from-red-950/30 to-[#111827] p-4 rounded-2xl border border-rose-900/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Edit3 size={13} className="text-rose-400" /> Ajuste Rápido de Quantidade
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Mínimo: {selectedProduct.minStock || 2} un
                </span>
              </div>

              {/* Increments / Decrements */}
              <div className="flex items-center justify-center gap-4 py-1">
                <button
                  onClick={() => setStockAdjustmentQty(Math.max(0, stockAdjustmentQty - 1))}
                  className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 text-white flex items-center justify-center text-lg font-bold hover:bg-slate-700 active:scale-90 transition-transform"
                >
                  <Minus size={18} />
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-white font-mono leading-none">
                    {stockAdjustmentQty}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">unidades</span>
                </div>

                <button
                  onClick={() => setStockAdjustmentQty(stockAdjustmentQty + 1)}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-r from-red-900 to-rose-900 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-red-950/60 hover:from-red-800 hover:to-rose-800 active:scale-90 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Quick Reason Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Motivo (ex: Contagem física, Devolução)"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveStockAdjustment}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-900 via-wine-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-white font-extrabold text-sm shadow-xl shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Salvar Alteração de Estoque
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
