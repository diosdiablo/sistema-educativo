const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

function env() {
  const r = {};
  const t = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
  for (const l of t.split(/\r?\n/)) {
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 0) continue;
    r[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
  return r;
}

const c = env();
if (!c.VITE_SUPABASE_URL || !c.VITE_SUPABASE_ANON_KEY) {
  console.error('Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env');
  process.exit(1);
}

const supabase = createClient(c.VITE_SUPABASE_URL, c.VITE_SUPABASE_ANON_KEY);
const BUCKET = 'documentos';
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-n');

const getMimeFromDataUrl = (dataUrl) => {
  const match = String(dataUrl || '').match(/^data:([^;,]+)/);
  return match ? match[1] : 'application/octet-stream';
};

const mimeToExt = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

const dataUrlToBlob = async (dataUrl) => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function migrateTable(table) {
  const PAGE = 200;
  let from = 0;
  let migrated = 0;
  let errors = 0;

  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select('id,file_data,file_name')
      .not('file_data', 'is', null)
      .is('storage_path', null)
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`[${table}] error leyendo filas:`, error.message);
      return { migrated, errors };
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const id = row.id;
      const fd = row.file_data;
      const fileName = row.file_name || '';
      const mime = getMimeFromDataUrl(fd);
      const ext = mimeToExt[mime] || fileName.split('.').pop() || 'bin';
      const path = `${table}/${id}.${ext}`;

      if (DRY_RUN) {
        console.log(`[${table}] pendiente: ${id} (${fileName || mime})`);
        migrated++;
        continue;
      }

      try {
        const blob = await dataUrlToBlob(fd);
        const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: mime, upsert: true });
        if (up.error) {
          console.error(`[${table}] upload falló ${id}:`, up.error.message);
          errors++;
          continue;
        }
        const up2 = await supabase.from(table).update({ storage_path: path, file_data: null }).eq('id', id);
        if (up2.error) {
          console.error(`[${table}] update falló ${id}:`, up2.error.message);
          errors++;
          continue;
        }
        console.log(`[${table}] migrado: ${id} → ${path}`);
      } catch (e) {
        console.error(`[${table}] excepción ${id}:`, e.message);
        errors++;
      }
      migrated++;
      await sleep(150);
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  return { migrated, errors };
}

(async () => {
  console.log(DRY_RUN ? 'MODO PRUEBA (dry-run): no se sube ni modifica nada.' : 'MIGRANDO archivos a Storage...');
  for (const table of ['planning_documents', 'learning_sessions']) {
    const r = await migrateTable(table);
    console.log(`\n${table}: ${r.migrated} migrado(s), ${r.errors} error(es)`);
  }
  if (DRY_RUN) {
    console.log('\nCorre sin --dry-run para ejecutar la migración real.');
  }
})();