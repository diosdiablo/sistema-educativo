const JSZip = require('jszip');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('Registro_Auxiliar_Ciencia y Tecnología_3°_GRADO_B_B2 (4).xlsx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Check which cells exist in each row
  for (const rowNum of [11, 12, 13]) {
    const re = new RegExp('<row r="' + rowNum + '"[^>]*>[\\s\\S]*?<\\/row>');
    const m = xml.match(re);
    if (!m) { console.log('Row ' + rowNum + ': NOT FOUND'); continue; }
    const cellRefs = m[0].match(/<c r="([A-Z]+)\d+"/g);
    if (cellRefs) {
      console.log('Row ' + rowNum + ' cells: ' + cellRefs.map(c => c.match(/r="([A-Z]+)\d+"/)[1]).join(', '));
      console.log('Row ' + rowNum + ' cell count: ' + cellRefs.length);
    }
    console.log('');
  }

  // Specifically check if L12, M12, T12 exist
  console.log('=== Specific cell checks ===');
  for (const ref of ['L11', 'L12', 'L13', 'M11', 'M12', 'M13', 'T11', 'T12', 'T13', 'K11', 'K12', 'K13']) {
    const re = new RegExp('<c r="' + ref + '"[^>]*>[\\s\\S]*?<\\/c>');
    const m = xml.match(re);
    if (m) {
      console.log(ref + ': EXISTS -> ' + m[0].substring(0, 120));
    } else {
      console.log(ref + ': *** MISSING ***');
    }
  }
}

main().catch(console.error);
