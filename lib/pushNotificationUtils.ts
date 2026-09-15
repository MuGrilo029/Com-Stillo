import { supabase } from '../lib/supabase';

interface SaleNotificationData {
  saleId: string;
  userId: string;
  customerName: string;
  total: number;
}

/**
 * Dispara uma notificação push para os dispositivos do usuário
 * Chamada pela store quando uma nova venda é inserida
 */
export async function triggerPushNotificationForSale(saleData: SaleNotificationData) {
  try {
    // Chamar a Edge Function do Supabase
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        saleData
      }
    });

    if (error) {
      console.error('❌ Erro ao disparar notificação:', error);
      return false;
    }

    console.log('✅ Notificação disparada:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao chamar função de notificação:', error);
    return false;
  }
}

/**
 * Testador local de Web Push (para desenvolvimento)
 * Simula uma notificação push localmente
 */
export async function testLocalPushNotification() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;

    // Simular um evento push
    registration.showNotification('🧪 Teste de Notificação', {
      body: 'Esta é uma notificação de teste enviada localmente',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-notification',
      data: {
        url: '/',
        saleId: 'test-123'
      }
    });

    console.log('✅ Notificação de teste enviada localmente');
  }
}
