const JSZip = require('jszip');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('Registro_Auxiliar_Ciencia y Tecnología_3°_GRADO_B_B2 (5).xlsx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Show all rows summary
  for (const rowNum of [11, 12, 13]) {
    const re = new RegExp('<row r="' + rowNum + '"[^>]*>[\\s\\S]*?<\\/row>');
    const m = xml.match(re);
    if (!m) { console.log('Row ' + rowNum + ': NOT FOUND'); continue; }
    const cells = m[0].match(/<c r="[^"]+"[^>]*\/>|<c r="[^"]+"[^>]*>[\s\S]*?<\/c>/g);
    if (cells) {
      console.log('=== ROW ' + rowNum + ' ===');
      cells.forEach(c => console.log(c));
    }
    console.log('');
  }

  // Specifically check nivel de logro cells (K, T, AC, AL) and summary cells (AO, AP, AQ, AR, AS)
  console.log('=== NIVEL DE LOGRO + SUMMARY ===');
  for (const ref of ['K11','K12','K13','T11','T12','T13','AC11','AC12','AC13','AL11','AL12','AL13',
                     'AO11','AO12','AO13','AP11','AP12','AP13','AQ11','AQ12','AQ13','AR11','AR12','AR13',
                     'AS11','AS12','AS13']) {
    const re = new RegExp('<c r="' + ref + '"[^>]*>[\\s\\S]*?<\\/c>');
    const m = xml.match(re);
    if (m) {
      console.log(ref + ': ' + m[0]);
    } else {
      console.log(ref + ': MISSING');
    }
  }
}

main().catch(console.error);
