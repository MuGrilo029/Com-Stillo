import React, { useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../contexts/AuthContext';
import { Bell, AlertCircle, X } from 'lucide-react';

interface PushNotificationProviderProps {
  children: React.ReactNode;
  autoEnable?: boolean;
}

/**
 * Provider para gerenciar Push Notifications
 * Deve envolver o aplicativo principal
 */
export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({
  children,
  autoEnable = false
}) => {
  const auth = useAuth();
  const {
    pushSupported,
    pushSubscribed,
    permission,
    isLoading,
    error,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
  } = usePushNotifications();

  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  // Auto-registrar se habilitado
  useEffect(() => {
    if (autoEnable && auth?.user?.id && pushSupported && permission === 'default' && !pushSubscribed) {
      setShowPrompt(true);
    }
  }, [autoEnable, auth?.user?.id, pushSupported, permission, pushSubscribed]);

  const handleSubscribe = async () => {
    const success = await subscribeToPushNotifications();
    if (success) {
      setShowPrompt(false);
    } else {
      setShowError(true);
    }
  };

  return (
    <>
      {children}

      {/* Prompt para Habilitar Notificações */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-wine-950/95 border border-rose-600/60 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <Bell size={20} className="text-rose-400 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-sm mb-1">Receber Notificações de Vendas?</h4>
              <p className="text-xs text-slate-300 mb-3">
                Quando uma venda for lançada, você receberá uma notificação instantânea no seu dispositivo.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Habilitando...' : 'Sim, Quero'}
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
                >
                  Depois
                </button>
              </div>
            </div>
            {error && (
              <button
                onClick={() => setShowError(false)}
                className="text-slate-400 hover:text-white flex-shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mostrar Erro */}
      {showError && error && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-red-950/95 border border-red-600/60 rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm mb-1">Erro ao Habilitar Notificações</h4>
              <p className="text-xs text-slate-300">{error}</p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="text-slate-400 hover:text-white flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Componente para exibir status de push notifications
 * Pode ser usado em Settings ou Dashboard
 */
export const PushNotificationStatus: React.FC = () => {
  const auth = useAuth();
  const {
    pushSupported,
    pushSubscribed,
    permission,
    isLoading,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
  } = usePushNotifications();

  if (!auth?.user?.id) {
    return null;
  }

  if (!pushSupported) {
    return (
      <div className="bg-yellow-950/50 border border-yellow-600/40 rounded-2xl p-4">
        <p className="text-sm text-yellow-300 font-bold">
          ⚠️ Push Notifications não são suportadas neste navegador/dispositivo
        </p>
      </div>
    );
  }

  return (
    <div className="bg-wine-950/50 border border-rose-600/40 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-white mb-1">Notificações Push</p>
        <p className="text-xs text-slate-400">
          Status: {pushSubscribed ? '✅ Habilitadas' : '❌ Desabilitadas'} | Permissão: {permission}
        </p>
      </div>
      <button
        onClick={pushSubscribed ? unsubscribeFromPushNotifications : subscribeToPushNotifications}
        disabled={isLoading}
        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 ${
          pushSubscribed
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {isLoading ? 'Processando...' : pushSubscribed ? 'Desabilitar' : 'Habilitar'}
      </button>
    </div>
  );
};
