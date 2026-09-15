import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export const usePushNotifications = () => {
  const auth = useAuth();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar suporte a Push Notifications
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setPushSupported(isSupported);
      setPermission(Notification.permission);

      if (isSupported && auth?.user?.id) {
        // Verificar se já está inscrito
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushSubscribed(!!subscription);
      }
    };

    checkSupport();
  }, [auth?.user?.id]);

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setError('Service Worker não é suportado neste navegador');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('✅ Service Worker registrado:', registration);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar SW';
      setError(message);
      console.error('❌ Erro ao registrar Service Worker:', err);
      return false;
    }
  }, []);

  // Solicitar permissão e inscrever em notificações
  const subscribeToPushNotifications = useCallback(async () => {
    if (!auth?.user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    if (!pushSupported) {
      setError('Push Notifications não são suportadas neste dispositivo');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Registrar SW se ainda não estiver
      const swRegistered = await registerServiceWorker();
      if (!swRegistered) return false;

      // 2. Solicitar permissão
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          setError('Permissão de notificação negada pelo usuário');
          setIsLoading(false);
          return false;
        }
      } else if (Notification.permission === 'denied') {
        setError('Notificações estão bloqueadas. Ative nas configurações do navegador.');
        setIsLoading(false);
        return false;
      }

      // 3. Obter chave VAPID pública do frontend
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BDaCcFQo07MriDvAVeOKC1Wznfk70Se-IWamziucYk0hoW5086EiVQLOMDE-O0gLd3DuMxrd1peE-VFYhoHaaEc';
      if (!vapidPublicKey) {
        setError('Chave VAPID não configurada no servidor');
        return false;
      }


      // 4. Converter chave VAPID para base64
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // 5. Inscrever em notificações push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('✅ Inscrito em push notifications:', subscription);

      // 6. Salvar inscrição no Supabase
      const subscriptionJson: PushSubscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;

      const { error: dbError } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: auth.user.id,
          endpoint: subscriptionJson.endpoint,
          auth: subscriptionJson.keys.auth,
          p256dh: subscriptionJson.keys.p256dh,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'endpoint'
        }
      );

      if (dbError) {
        console.error('❌ Erro ao salvar inscrição:', dbError);
        setError(`Erro ao salvar inscrição: ${dbError.message}`);
        return false;
      }

      console.log('✅ Inscrição salva no banco de dados');
      setPushSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('❌ Erro ao inscrever em notificações:', err);
      setIsLoading(false);
      return false;
    }
  }, [auth?.user?.id, pushSupported, registerServiceWorker]);

  // Desinscrever de notificações
  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!auth?.user?.id) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remover do banco de dados
        const subscriptionJson: PushSubscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscriptionJson.endpoint);

        console.log('✅ Desinscrição de notificações concluída');
      }

      setPushSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('❌ Erro ao desinscrever:', err);
      setIsLoading(false);
      return false;
    }
  }, [auth?.user?.id]);

  return {
    pushSupported,
    pushSubscribed,
    permission,
    isLoading,
    error,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    registerServiceWorker
  };
};
