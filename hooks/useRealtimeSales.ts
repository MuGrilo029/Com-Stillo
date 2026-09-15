import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Sale } from '../types';

interface SaleNotification {
  id: string;
  sale: Sale;
  timestamp: Date;
}

export const useRealtimeSales = (onNewSale?: (notification: SaleNotification) => void) => {
  const [lastSaleTime, setLastSaleTime] = useState<number>(Date.now());
  const [realtimeActive, setRealtimeActive] = useState(false);

  useEffect(() => {
    // Subscribe to real-time changes on the sales table
    const channel = supabase
      .channel('public:sales')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          // Only notify for sales created after this component mounted
          const insertedAt = new Date(payload.created_at || Date.now()).getTime();
          if (insertedAt > lastSaleTime - 2000) {
            // 2 second buffer to account for clock skew
            const notification: SaleNotification = {
              id: payload.new.id,
              sale: {
                id: payload.new.id,
                customerName: payload.new.customer_name,
                customerPhone: payload.new.customer_phone,
                customerAddress: payload.new.customer_address,
                deliveryType: payload.new.delivery_type,
                date: payload.new.date,
                total: payload.new.total,
                discount: payload.new.discount,
                paymentMethod: payload.new.payment_method,
                downPaymentMethod: payload.new.down_payment_method,
                remainingPaymentMethod: payload.new.remaining_payment_method,
                paymentType: payload.new.payment_type,
                downPayment: payload.new.down_payment,
                remainingAmount: payload.new.remaining_amount,
                status: payload.new.status,
                observations: payload.new.observations,
                deliveryDate: payload.new.delivery_date,
                cardFeeAmount: payload.new.card_fee_amount,
                cardFeePercentage: payload.new.card_fee_percentage,
                cardInstallments: payload.new.card_installments,
                items: [] // Items will be loaded separately if needed
              } as Sale,
              timestamp: new Date()
            };

            onNewSale?.(notification);
          }
        }
      )
      .subscribe((status) => {
        setRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lastSaleTime, onNewSale]);

  return { realtimeActive };
};
