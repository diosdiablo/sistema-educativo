const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

(async () => {
  // Get all records
  const { data, error } = await supabase.from('attendance').select('*');
  if (error) return console.log('Error:', error);

  console.log(`Total records: ${data.length}`);

  // Identify bad records: those that are objects with mostly numeric keys
  const badIds = [];
  for (const r of data) {
    if (r.records && typeof r.records === 'object' && !Array.isArray(r.records)) {
      const keys = Object.keys(r.records);
      const numericKeys = keys.filter(k => /^\d+$/.test(k));
      // If more than 50% of keys are numeric, it's the bad format
      if (numericKeys.length > keys.length * 0.5) {
        badIds.push(r.id);
      }
    }
  }

  console.log(`Bad object records: ${badIds.length}`);

  if (badIds.length > 0) {
    const { error: delErr } = await supabase.from('attendance').delete().in('id', badIds);
    if (delErr) console.log('Delete error:', delErr);
    else console.log('Deleted bad records ✓');
  }

  // Verify
  const { data: after } = await supabase.from('attendance').select('id, date, records');
  console.log(`\nRemaining: ${after?.length} records`);
  after?.forEach(r => {
    const recordsType = typeof r.records;
    let recordCount = 'n/a';
    if (typeof r.records === 'object' && r.records) {
      const keys = Object.keys(r.records);
      const numericKeys = keys.filter(k => /^\d+$/.test(k));
      recordCount = numericKeys.length > keys.length * 0.5
        ? `BAD (${keys.length} keys, ${numericKeys.length} numeric)`
        : `${keys.length} keys (good)`;
    }
    console.log(`  ${r.date}: id=${r.id.substring(0, 30)}, records type=${recordsType}, ${recordCount}`);
  });
})();
