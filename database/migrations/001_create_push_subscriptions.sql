-- Tabela para armazenar inscrições de Push Notifications
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

CREATE TABLE public.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT push_subscriptions_user_idx UNIQUE(user_id, endpoint)
);

-- Índices
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- RLS (Row Level Security)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage push subscriptions"
ON public.push_subscriptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at_trigger ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at_trigger
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_push_subscriptions_updated_at();

GRANT ALL ON public.push_subscriptions TO authenticated;

-- ==========================================================
-- GATILHO & WEBHOOK PARA DISPARO DE PUSH NA VENDA
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.tr_venda_finalizada_push()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
  func_url text := 'https://tavjnzpyjnjmhtzvlnfj.supabase.co/functions/v1/send-push-notification';
  anon_key text := 'sb_publishable_xW8p4uzHCHguncjBLvJqoQ_zQXfNnZU';
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := func_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Falha ao acionar push notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Gatilho associado à tabela sales
DROP TRIGGER IF EXISTS tg_push_venda_finalizada ON public.sales;
CREATE TRIGGER tg_push_venda_finalizada
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.tr_venda_finalizada_push();


