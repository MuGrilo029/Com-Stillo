import React, { useState, useCallback } from 'react';
import { MobileTab, MobileCartItem } from './types';
import { MobileLayout } from './MobileLayout';
import { MobileDashboard } from './MobileDashboard';
import { MobileSalesPDV } from './MobileSalesPDV';
import { MobileSalesHistory } from './MobileSalesHistory';
import { MobileInventory } from './MobileInventory';
import { useAppStore } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSales } from '../../hooks/useRealtimeSales';
import { Product, Sale } from '../../types';
import { CheckCircle2, AlertCircle, Info, X, TrendingUp } from 'lucide-react';

interface MobileAppProps {
  initialTab?: MobileTab;
  onSwitchToDesktop?: () => void;
}

export const MobileApp: React.FC<MobileAppProps> = ({
  initialTab = 'DASHBOARD',
  onSwitchToDesktop
}) => {
  // Try connecting to global App Store
  const store = useAppStore();
  const auth = useAuth();

  const [activeTab, setActiveTab] = useState<MobileTab>(initialTab);
  const [filterCriticalInStock, setFilterCriticalInStock] = useState(false);

  // Cart State for PDV
  const [cart, setCart] = useState<MobileCartItem[]>([]);

  // Toast / Mobile Notification System
  const [mobileToasts, setMobileToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  
  // Real-time Sale Notification
  const [saleNotifications, setSaleNotifications] = useState<Array<{ id: string; sale: Sale; timestamp: Date }>>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setMobileToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setMobileToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleNewSale = useCallback((notification: { id: string; sale: Sale; timestamp: Date }) => {
    setSaleNotifications((prev) => [notification, ...prev]);
    addToast(`💰 Nova venda! ${notification.sale.customerName} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(notification.sale.total)}`, 'success');
  }, []);

  // Enable real-time sales monitoring
  useRealtimeSales(handleNewSale);
    }, 3000);
  };

  // Cart Actions
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          productId: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          unitPrice: Number(product.price) || 0,
          quantity: quantity,
          image: product.image
        }
      ];
    });
    addToast(`"${product.name}" adicionado à venda!`, 'success');
  };

  const handleUpdateCartItemQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(itemId);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
    addToast('Item removido da venda', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    addToast('Carrinho limpo', 'info');
  };

  // Complete Sale
  const handleCompleteSale = async (saleData: Omit<Sale, 'status'> & { items: MobileCartItem[] }): Promise<boolean> => {
    if (store && store.addSale) {
      const newSale: Sale = {
        id: saleData.id,
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone || '',
        customerAddress: saleData.customerAddress || '',
        deliveryType: saleData.deliveryType || 'PICKUP',
        date: saleData.date,
        total: saleData.total,
        discount: saleData.discount || 0,
        paymentMethod: saleData.paymentMethod,
        paymentType: saleData.paymentType || 'FULL',
        downPayment: saleData.downPayment,
        downPaymentMethod: saleData.downPaymentMethod,
        remainingAmount: saleData.remainingAmount,
        remainingPaymentMethod: saleData.remainingPaymentMethod,
        remainingStatus: saleData.remainingStatus || 'PAID',
        status: 'COMPLETED',
        observations: saleData.observations || '',
        deliveryDate: saleData.deliveryDate,
        items: saleData.items.map((it) => ({
          productId: it.productId,
          productName: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          category: it.category
        }))
      };
      const saved = await store.addSale(newSale);
      if (!saved) {
        addToast('Não foi possível salvar a venda.', 'error');
        return false;
      }
    }

    setCart([]);
    addToast('Venda finalizada com sucesso!', 'success');
    return true;
  };

  // Stock Adjustment
  const handleUpdateProductStock = (productId: string, newQuantity: number, reason = 'Ajuste Mobile') => {
    if (store && store.updateProduct) {
      const prod = (store.products || []).find((p) => p.id === productId);
      if (prod) {
        store.updateProduct({ ...prod, quantity: newQuantity });
      }
    }
    addToast(`Estoque atualizado para ${newQuantity} unidades`, 'success');
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const currentUserEmail = auth?.user?.email || 'gerencia@comstillo.com.br';
  const currentUserName = currentUserEmail.split('@')[0].toUpperCase();

  return (
    <MobileLayout
      currentTab={activeTab}
      onTabChange={(tab) => {
        if (tab !== 'INVENTORY') setFilterCriticalInStock(false);
        setActiveTab(tab);
      }}
      cartCount={cartItemsCount}
      userName={currentUserName}
      userRole={store?.companySettings?.name ? 'ADMIN' : 'GERÊNCIA'}
      onLogout={auth?.signOut}
      onRefresh={store?.refreshData}
      darkMode={store?.darkMode ?? true}
      onToggleDarkMode={store?.toggleDarkMode}
      onSwitchToDesktop={onSwitchToDesktop}
    >
      {/* Toast Notifications Stack */}
      <div className="fixed top-16 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-md mx-auto">
        {mobileToasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold text-white animate-slide-up backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-200'
                : 'bg-wine-950/90 border-rose-600/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle size={16} className="text-red-400" />}
              {toast.type === 'info' && <Info size={16} className="text-rose-400" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setMobileToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Real-time Sale Notification Banner */}
      {saleNotifications.length > 0 && (
        <div className="fixed top-2 left-2 right-2 z-40 pointer-events-auto">
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 border border-emerald-600/60 rounded-2xl p-3 shadow-2xl shadow-emerald-950/50 flex items-center justify-between gap-2 animate-slide-down">
            <div className="flex items-center gap-2 min-w-0">
              <div className="animate-pulse">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Nova Venda do Desktop!</p>
                <p className="text-xs font-bold text-white truncate">{saleNotifications[0].sale.customerName}</p>
              </div>
            </div>
            <button
              onClick={() => setSaleNotifications((prev) => prev.slice(1))}
              className="p-1.5 text-emerald-300 hover:text-white rounded-full hover:bg-emerald-800/50 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Screen Switcher */}
      {!store.isInitialized ? (
        <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-400">
          Carregando dados do banco...
        </div>
      ) : activeTab === 'DASHBOARD' ? (
        <MobileDashboard
          sales={store?.sales}
          products={store?.products}
          transactions={store?.transactions}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onFilterInventoryCritical={() => {
            setFilterCriticalInStock(true);
            setActiveTab('INVENTORY');
          }}
        />
      ) : activeTab === 'POS' ? (
        <MobileSalesPDV
          products={store?.products}
          customers={store?.customers}
          cart={cart}
          cardFees={store?.cardFees}
          onAddToCart={handleAddToCart}
          onUpdateCartItemQty={handleUpdateCartItemQty}
          onRemoveCartItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onCompleteSale={handleCompleteSale}
        />
      ) : activeTab === 'HISTORY' ? (
        <MobileSalesHistory
          sales={store?.sales}
          transactions={store?.transactions}
          companySettings={store?.companySettings}
        />
      ) : activeTab === 'INVENTORY' ? (
        <MobileInventory
          products={store?.products}
          onUpdateProductStock={handleUpdateProductStock}
          initialFilterCritical={filterCriticalInStock}
        />
      ) : null}
    </MobileLayout>
  );
};
