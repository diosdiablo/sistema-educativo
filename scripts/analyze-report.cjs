const JSZip = require('jszip');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('Registro_Auxiliar_Ciencia y Tecnología_3°_GRADO_B_B2 (4).xlsx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Show rows 11-13, columns A through AM (student data area)
  for (const rowNum of [11, 12, 13]) {
    const re = new RegExp('<row r="' + rowNum + '"[^>]*>[\\s\\S]*?<\\/row>');
    const m = xml.match(re);
    if (!m) { console.log('Row ' + rowNum + ': NOT FOUND'); continue; }
    console.log('=== ROW ' + rowNum + ' (Student ' + (rowNum - 10) + ') ===');
    const cells = m[0].match(/<c r="[^"]+"[^>]*\/>|<c r="[^"]+"[^>]*>[\s\S]*?<\/c>/g);
    if (cells) {
      cells.forEach(c => console.log(c));
    }
    console.log('');
  }

  // Also check shared strings table
  const ssFile = zip.file('xl/sharedStrings.xml');
  if (ssFile) {
    const ss = await ssFile.async('string');
    const strings = ss.match(/<si><t[^>]*>[^<]*<\/t><\/si>/g);
    if (strings) {
      console.log('=== SHARED STRINGS (first 20) ===');
      strings.slice(0, 20).forEach((s, i) => console.log(i + ': ' + s));
      console.log('Total strings: ' + strings.length);
    }
  }
}

main().catch(console.error);
