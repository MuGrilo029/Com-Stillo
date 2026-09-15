import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import webpush from 'https://esm.sh/web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@comstillo.com.br';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();

    // Suporta tanto payload direto de Database Webhook (body.record) quanto chamada manual ({ saleData })
    const sale = body.record || body.saleData || body;

    if (!sale) {
      return new Response(JSON.stringify({ error: 'Nenhum dado de venda recebido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const valor = Number(sale.valor_total || sale.total || sale.valor || 0);
    const valorFormatado = valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const pushPayload = JSON.stringify({
      title: 'COM STILLO - Venda Finalizada!',
      body: `Nova venda registrada no valor de ${valorFormatado}`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      metadata: {
        saleId: sale.id,
        url: '/'
      }
    });

    // Buscar todas as inscrições ativas no banco de dados
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma inscrição push encontrada' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Disparar notificações concorrentemente
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, pushPayload);
        } catch (err: any) {
          // Status 410 (Gone) ou 404 significa que a inscrição foi revogada ou expirou
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Removendo inscrição expirada: ${sub.endpoint}`);
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ success: true, total: subscriptions.length, sent, failed }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Erro na Edge Function send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

