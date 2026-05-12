import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { subscription, userId, userName } = req.body;
  if (!subscription || !userId) return res.status(400).json({ error: 'Faltan datos' });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, user_name: userName || '', subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
}
