const JSZip = require('jszip');
const fs = require('fs');
async function main() {
  const buf = fs.readFileSync('public/templates/plantilla-registro-auxiliar.xlsx');
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  for (const rowNum of [11, 12, 13]) {
    const re = new RegExp('<row r="' + rowNum + '"[^>]*>[\\s\\S]*?<\\/row>');
    const m = xml.match(re);
    if (!m) { console.log('Row ' + rowNum + ': NOT FOUND'); continue; }
    console.log('=== ROW ' + rowNum + ' ===');
    const cells = m[0].match(/<c r="[^"]+"[^>]*\/>|<c r="[^"]+"[^>]*>[\s\S]*?<\/c>/g);
    if (cells) {
      cells.forEach(c => console.log(c));
    }
  }
}
main().catch(console.error);
