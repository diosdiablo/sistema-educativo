const JSZip = require('jszip');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('Registro_Auxiliar_Ciencia y Tecnología_3°_GRADO_B_B2 (4).xlsx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Dump raw row 12 XML
  const re = /<row r="12"[\s\S]*?<\/row>/;
  const m = xml.match(re);
  if (m) {
    console.log('=== RAW ROW 12 (first 3000 chars) ===');
    console.log(m[0].substring(0, 3000));
  }
}

main().catch(console.error);
