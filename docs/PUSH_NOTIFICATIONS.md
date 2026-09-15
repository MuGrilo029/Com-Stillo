# 🔔 Sistema de Web Push Notifications - Guia Completo

## 📋 Visão Geral

Este guia implementa um sistema completo de **Web Push Notifications** para iOS/PWA no seu ERP utilizando:
- **Supabase Real-time** (já implementado)
- **Web Push API** (W3C Standard)
- **Service Workers**
- **Edge Functions do Supabase**

---

## 🚀 Configuração Inicial

### **1. Gerar Chaves VAPID**

VAPID (Voluntary Application Server Identification) é obrigatório para Web Push.

```bash
npm install -g web-push
web-push generate-vapid-keys
```

**Saída esperada:**
```
Public Key: BCxxxxxxxxxxxxx...
Private Key: xxxxxxxxxxxxx...
```

### **2. Configurar Variáveis de Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Chave Pública (SEGURO - pode ficar no frontend)
VITE_VAPID_PUBLIC_KEY=sua_chave_publica_aqui

# Email para certificado (obrigatório)
VITE_VAPID_EMAIL=mailto:seu-email@example.com
```

**⚠️ NUNCA commitar a chave privada!** Use apenas em variáveis de servidor/Edge Functions.

### **3. Criar Tabela no Supabase**

Copie e execute o SQL em `database/migrations/001_create_push_subscriptions.sql` no Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT push_subscriptions_user_idx UNIQUE(user_id, endpoint)
);
```

---

## 📱 Integração no Frontend

### **1. Registrar Service Worker**

O Service Worker (`public/sw.js`) é automaticamente registrado quando o usuário habilita notificações. Ele:
- Escuta eventos `push`
- Exibe notificações nativas
- Gerencia cliques nas notificações

### **2. Usar o Hook `usePushNotifications`**

```typescript
import { usePushNotifications } from './hooks/usePushNotifications';

function MyComponent() {
  const {
    pushSupported,
    pushSubscribed,
    permission,
    isLoading,
    error,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
  } = usePushNotifications();

  return (
    <button
      onClick={subscribeToPushNotifications}
      disabled={isLoading || pushSubscribed}
    >
      {pushSubscribed ? 'Notificações Ativadas' : 'Ativar Notificações'}
    </button>
  );
}
```

### **3. Usar o Provider**

No seu `App.tsx` ou `index.tsx`:

```typescript
import { PushNotificationProvider } from './components/PushNotificationProvider';

export function App() {
  return (
    <PushNotificationProvider autoEnable={false}>
      {/* Seu app aqui */}
    </PushNotificationProvider>
  );
}
```

---

## ⚙️ Backend - Edge Function do Supabase

### **1. Deploy da Edge Function**

```bash
# Instalar Supabase CLI se ainda não tiver
npm install -g supabase

# Login
supabase login

# Deploy
supabase functions deploy send-push-notification
```

### **2. Configurar Variáveis de Ambiente no Supabase**

1. Vá para **Project Settings** > **Edge Functions** > **Environment Variables**
2. Adicione:
   - `VAPID_PRIVATE_KEY`: sua chave privada VAPID
   - `VAPID_PUBLIC_KEY`: sua chave pública VAPID

### **3. Gatilho Automático no Banco de Dados**

Quando uma nova venda é inserida, chame a Edge Function:

```sql
-- Criar função que dispara a notificação
CREATE OR REPLACE FUNCTION trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  response RECORD;
BEGIN
  -- Chamar a Edge Function
  SELECT http_post(
    'https://seu-projeto.supabase.co/functions/v1/send-push-notification',
    json_build_object(
      'saleData', json_build_object(
        'saleId', NEW.id,
        'userId', NEW.user_id,
        'customerName', NEW.customer_name,
        'total', NEW.total
      )
    ),
    'application/json'
  ) INTO response;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER on_sales_insert
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION trigger_push_notification();
```

---

## 🧪 Testando

### **Teste Local**

```typescript
import { testLocalPushNotification } from './lib/pushNotificationUtils';

// Chama uma notificação localmente (sem precisar de Edge Function)
testLocalPushNotification();
```

### **Teste com Servidor Real**

```typescript
import { triggerPushNotificationForSale } from './lib/pushNotificationUtils';

await triggerPushNotificationForSale({
  saleId: 'test-123',
  userId: 'seu-user-id',
  customerName: 'João Silva',
  total: 1250.00
});
```

---

## 🔐 Segurança

### **✅ Implementado**
- ✅ RLS (Row Level Security) na tabela `push_subscriptions`
- ✅ Usuários só podem acessar suas próprias inscrições
- ✅ Chaves privadas VAPID nunca são expostas
- ✅ Validação de `user_id` em cada operação

### **⚠️ Recomendações Adicionais**
1. Usar HTTPS obrigatoriamente (PWAs precisam)
2. Implementar rate limiting na Edge Function
3. Limpar endpoints inválidos periodicamente
4. Criptografar chaves VAPID em variáveis secretas do Supabase

---

## 📊 Fluxo de Dados

```
Desktop (Sales.tsx)
    ↓
Nova venda inserida no Supabase
    ↓
Trigger SQL ativa Edge Function
    ↓
Edge Function busca subscriptions do usuário
    ↓
Envia Web Push para cada dispositivo
    ↓
Service Worker recebe push event
    ↓
Notificação exibida no iOS/Android
    ↓
Usuário clica → abre app
```

---

## 🎯 Fluxo de Inscrição

```
1. Usuário clica "Ativar Notificações"
   ↓
2. Hook pede permissão ao navegador
   ↓
3. Service Worker é registrado
   ↓
4. Push Manager gera PushSubscription
   ↓
5. Dados salvos em push_subscriptions (Supabase)
   ↓
6. Pronto! Receberá notificações
```

---

## 📝 Exemplos Completos

### **Exemplo 1: Settings Page com Toggle**

```typescript
import { PushNotificationStatus } from './components/PushNotificationProvider';

export function Settings() {
  return (
    <div>
      <h2>Notificações</h2>
      <PushNotificationStatus />
    </div>
  );
}
```

### **Exemplo 2: Mobile App Automático**

```typescript
// Em MobileApp.tsx
export const MobileApp: React.FC = () => {
  const { subscribeToPushNotifications } = usePushNotifications();

  useEffect(() => {
    // Auto-inscrever quando app abre
    subscribeToPushNotifications();
  }, []);

  return (/* ... */);
};
```

---

## 🐛 Troubleshooting

### **"Push Notifications não são suportadas"**
- Verificar suporte do navegador
- iOS 16.4+ requerido para PWA
- Testar em HTTPS (desenvolvimento com localhost é OK)

### **"Erro ao salvar inscrição"**
- Verificar se tabela foi criada
- Verificar RLS policies
- Confirmar autenticação do usuário

### **"Notificação não chega"**
- Verificar se Service Worker está ativo
- Verificar Edge Function logs no Supabase
- Testar com `testLocalPushNotification()` primeiro

### **"Permissão de notificação negada"**
- Usuário pode ativar em Configurações > Notificações
- iPhone: Settings > App > Notifications
- Android: Long press app > Notificações

---

## 📚 Referências

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol - RFC 8030](https://tools.ietf.org/html/rfc8030)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [PWA no iOS - Apple](https://developer.apple.com/documentation/nearby_interaction/web_push)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consultar console do navegador (F12)
2. Verificar Supabase logs
3. Testar Service Worker no DevTools (Application > Service Workers)
