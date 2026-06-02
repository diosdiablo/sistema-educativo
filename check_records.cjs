const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data } = await supabase.from('attendance').select('*');
  data.forEach(r => {
    console.log(`date: ${r.date}, id: ${r.id.substring(0, 30)}, records type: ${typeof r.records}`);
    if (typeof r.records === 'object' && r.records) {
      const keys = Object.keys(r.records);
      console.log(`  keys count: ${keys.length}, first key: ${keys[0]}, first value: ${r.records[keys[0]]}`);
    } else if (typeof r.records === 'string') {
      console.log(`  string length: ${r.records.length}, preview: ${r.records.substring(0, 200)}`);
    }
  });
})();
