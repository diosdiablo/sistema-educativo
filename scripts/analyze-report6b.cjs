const JSZip = require('jszip');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('Registro_Auxiliar_Matemática_1°_GRADO_A_B3 (1).xlsx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Show raw XML for rows 11 and 50 to compare
  console.log('=== ROW 11 RAW (first 800 chars) ===');
  const r11 = xml.match(/<row r="11"[\s\S]*?<\/row>/);
  if (r11) console.log(r11[0].substring(0, 800));

  console.log('\n=== ROW 50 RAW (first 800 chars) ===');
  const r50 = xml.match(/<row r="50"[\s\S]*?<\/row>/);
  if (r50) console.log(r50[0].substring(0, 800));

  // Check if rows 41+ have proper XML structure
  console.log('\n=== ROW 41 CHECK ===');
  const r41 = xml.match(/<row r="41"[\s\S]*?<\/row>/);
  if (r41) console.log(r41[0].substring(0, 500));
  else console.log('Row 41: NOT FOUND');

  // Count how many students have data in competency 1 (D column)
  let withGrade = 0;
  let empty = 0;
  for (let rowNum = 11; rowNum <= 56; rowNum++) {
    const re = new RegExp('<c r="D' + rowNum + '"[^>]*>.*?</c>');
    const m = xml.match(re);
    if (m && m[0].match(/<t>[^<]+<\/t>/)) withGrade++;
    else empty++;
  }
  console.log('\nCompetencia 1 (D):', withGrade, 'con nota,', empty, 'vacías');
}

main().catch(console.error);
