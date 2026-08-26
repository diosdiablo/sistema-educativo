const JSZip = require('jszip');
const fs = require('fs');
(async () => {
  const buf = fs.readFileSync('public/templates/plantilla-registro-auxiliar.xlsx');
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  
  // Check helper columns (BD, BM, BV, CE) in row 11
  const row11Match = xml.match(/<row r="11"[^>]*>[\s\S]*?<\/row>/);
  if (row11Match) {
    const row11 = row11Match[0];
    // Find BD11, BM11, BV11, CE11
    ['BD11', 'BM11', 'BV11', 'CE11', 'BD12', 'BM12', 'BV12', 'CE12'].forEach(ref => {
      const cellMatch = row11.match(new RegExp('<c r="' + ref + '"[^>]*>[^<]*(?:<[^>]*>[^<]*)*</c>'));
      if (cellMatch) {
        console.log(ref + ':', cellMatch[0]);
      } else {
        console.log(ref + ': NOT FOUND in row');
      }
    });
  }
  
  // Check the row count / data area
  const rowMatches = xml.match(/<row r="(\d+)"/g);
  if (rowMatches) {
    const rows = rowMatches.map(m => parseInt(m.match(/r="(\d+)"/)[1]));
    console.log('Total rows:', rows.length, 'Min:', Math.min(...rows), 'Max:', Math.max(...rows));
  }
})();
