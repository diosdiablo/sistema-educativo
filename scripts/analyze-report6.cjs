const JSZip = require('jszip');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('Registro_Auxiliar_Matemática_1°_GRADO_A_B3 (1).xlsx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Check header cells
  console.log('=== HEADER ===');
  for (const ref of ['M3', 'M4', 'M5', 'AH3', 'AH4', 'AH5', 'Y3']) {
    const re = new RegExp('<c r="' + ref + '"[^>]*>[\\s\\S]*?</c>');
    const m = xml.match(re);
    console.log(ref + ':', m ? m[0] : 'MISSING');
  }

  // Check rows 11-15
  console.log('\n=== ROWS 11-15 ===');
  for (const rowNum of [11, 12, 13, 14, 15]) {
    const re = new RegExp('<row r="' + rowNum + '"[^>]*>[\\s\\S]*?<\\/row>');
    const m = xml.match(re);
    if (!m) { console.log('Row ' + rowNum + ': NOT FOUND'); continue; }
    // Just show key cells
    for (const ref of ['A' + rowNum, 'B' + rowNum, 'D' + rowNum, 'K' + rowNum, 'L' + rowNum, 'M' + rowNum, 'T' + rowNum]) {
      const cellRe = new RegExp('<c r="' + ref + '"[^>]*>[\\s\\S]*?</c>');
      const cm = m[0].match(cellRe);
      if (cm) console.log(ref + ': ' + cm[0]);
    }
    console.log('');
  }

  // How many rows total?
  const rows = xml.match(/<row r="\d+"/g);
  console.log('Total rows in sheet:', rows ? rows.length : 0);

  // Check last few data rows
  console.log('\n=== LAST DATA ROW CHECK ===');
  for (const rowNum of [50, 51, 55, 56]) {
    const re = new RegExp('<row r="' + rowNum + '"[^>]*>[\\s\\S]*?<\\/row>');
    const m = xml.match(re);
    if (m) {
      const bRe = new RegExp('<c r="B' + rowNum + '"[^>]*>[\\s\\S]*?</c>');
      const bm = m[0].match(bRe);
      console.log('Row ' + rowNum + ' B:', bm ? bm[0] : 'EMPTY');
    } else {
      console.log('Row ' + rowNum + ': NOT FOUND');
    }
  }
}

main().catch(console.error);
