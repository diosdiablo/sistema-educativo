const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data, error } = await supabase.from('attendance').select('*');
  console.log('All attendance records:');
  data.forEach(d => {
    console.log('  date:', d.date, '| id:', d.id.substring(0, 30));
  });
})();
