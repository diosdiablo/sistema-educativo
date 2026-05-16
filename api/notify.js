import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@portalagro110.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, message, url, userId } = req.body;
  if (!title) return res.status(400).json({ error: 'Falta título' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  let query = supabase.from('push_subscriptions').select('subscription, user_id');
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { data: subscriptions, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  if (!subscriptions?.length) return res.json({ sent: 0 });

  const payload = JSON.stringify({ title, message, url: url || '/' });
  let sent = 0;

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      try {
        const sub = JSON.parse(row.subscription);
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('subscription', row.subscription);
        }
      }
    })
  );

  res.json({ sent });
}
