const JSZip = require('jszip');
const fs = require('fs');

function escapeXml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function xmlSetCellText(xml, ref, text) {
  const escaped = escapeXml(text);
  const cellRe = new RegExp('(<c r="' + ref + '"[^>]*?>)([\\s\\S]*?)(</c>)');
  if (cellRe.test(xml)) {
    return xml.replace(cellRe, (_, open, _inner, close) => {
      let tag = open
        .replace(/\st="(?:s|str|inlineStr|e)"/g, '')
        .replace(/\s*\/\s*$/, '>');
      return tag + '<is><t>' + escaped + '</t></is>' + close;
    });
  }
  const emptyRe = new RegExp('(<c r="' + ref + '"[^>]*?)/>');
  if (emptyRe.test(xml)) {
    return xml.replace(emptyRe, '$1><is><t>' + escaped + '</t></is></c>');
  }
  return xml;
}

function xmlSetValueNoFormula(xml, ref, text) {
  const escaped = escapeXml(text);
  const cellRe = new RegExp('(<c r="' + ref + '"[^>]*?>)([\\s\\S]*?)(</c>)');
  if (!cellRe.test(xml)) {
    const emptyRe = new RegExp('(<c r="' + ref + '"[^>]*?)/>');
    if (emptyRe.test(xml)) {
      return xml.replace(emptyRe, '$1><v>' + escaped + '</v></c>');
    }
    return xml;
  }
  return xml.replace(cellRe, (_, open, _inner, close) => {
    let tag = open
      .replace(/\st="(?:s|str|inlineStr|e)"/g, '')
      .replace(/\s*\/\s*$/, '>');
    return tag + '<v>' + escaped + '</v>' + close;
  });
}

async function main() {
  const buf = fs.readFileSync('public/templates/plantilla-registro-auxiliar.xlsx');
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Clear rows 11-40
  xml = xml.replace(/(<row r="(?:1[1-9]|2\d|3\d|40)"[^>]*>)([\s\S]*?)(<\/row>)/g, (match, open, content, close) => {
    return open + content.replace(/<v>[^<]*<\/v>/g, '<v></v>').replace(/<is><t>[^<]*<\/t><\/is>/g, '<is><t></t></is>') + close;
  });

  // Test: write to K11 (has formula with <f>...</f>), K12 (has self-closing <f/>), K13 (same)
  console.log('=== Before ===');
  for (const ref of ['K11','K12','K13','L11','L12','L13','M11','M12','M13']) {
    const re = new RegExp('<c r="' + ref + '"[^>]*>[\\s\\S]*?</c>');
    const m = xml.match(re);
    console.log(ref + ':', m ? m[0] : 'MISSING');
  }

  // Write nivel de logro (xmlSetValueNoFormula)
  xml = xmlSetValueNoFormula(xml, 'K11', 'C');
  xml = xmlSetValueNoFormula(xml, 'K12', 'B');
  xml = xmlSetValueNoFormula(xml, 'K13', 'B');

  // Write conclusions (xmlSetCellText)
  xml = xmlSetCellText(xml, 'L11', 'No logra');
  xml = xmlSetCellText(xml, 'L12', '');
  xml = xmlSetCellText(xml, 'L13', '');

  // Write grades (xmlSetCellText)
  xml = xmlSetCellText(xml, 'M11', 'A');
  xml = xmlSetCellText(xml, 'M12', 'B');
  xml = xmlSetCellText(xml, 'M13', 'C');

  console.log('\n=== After ===');
  for (const ref of ['K11','K12','K13','L11','L12','L13','M11','M12','M13']) {
    const re = new RegExp('<c r="' + ref + '"[^>]*>[\\s\\S]*?</c>');
    const m = xml.match(re);
    console.log(ref + ':', m ? m[0] : 'MISSING');
  }

  // Verify row 12 cell count
  const m12 = xml.match(/<row r="12"[\s\S]*?<\/row>/);
  if (m12) {
    const cells = m12[0].match(/<c r="[A-Z]+\d+"/g);
    console.log('\nRow 12 cell count:', cells ? cells.length : 0);
  }
  const m11 = xml.match(/<row r="11"[\s\S]*?<\/row>/);
  if (m11) {
    const cells = m11[0].match(/<c r="[A-Z]+\d+"/g);
    console.log('Row 11 cell count:', cells ? cells.length : 0);
  }
}

main().catch(console.error);
