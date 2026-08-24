export type MobileTab = 'DASHBOARD' | 'POS' | 'HISTORY' | 'INVENTORY';

export type TimeFilterOption = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface MobileCartItem {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  color?: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  tabTarget: MobileTab;
  color: string;
}

export interface MetricCardData {
  title: string;
  value: string;
  subValue?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  iconName: string;
  colorScheme: 'wine' | 'emerald' | 'amber' | 'indigo' | 'blue' | 'rose';
  onClick?: () => void;
}
