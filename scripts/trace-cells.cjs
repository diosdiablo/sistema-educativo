const JSZip = require('jszip');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('public/templates/plantilla-registro-auxiliar.xlsx');
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');

  // Check row 12 BEFORE clearing - count cells
  const re12 = /<row r="12"[\s\S]*?<\/row>/;
  const m12 = xml.match(re12);
  if (m12) {
    const cells = m12[0].match(/<c r="[A-Z]+\d+"/g);
    console.log('TEMPLATE row 12 cells:', cells.length);
  }

  // Apply clearing regex
  xml = xml.replace(/(<row r="(?:1[1-9]|2\d|3\d|40)"[^>]*>)([\s\S]*?)(<\/row>)/g, (match, open, content, close) => {
    return open + content.replace(/<v>[^<]*<\/v>/g, '<v></v>').replace(/<is><t>[^<]*<\/t><\/is>/g, '<is><t></t></is>') + close;
  });

  // Check row 12 AFTER clearing
  const m12b = xml.match(re12);
  if (m12b) {
    const cells = m12b[0].match(/<c r="[A-Z]+\d+"/g);
    console.log('AFTER CLEAR row 12 cells:', cells.length);
    // Show K12-L12 area
    const k12 = m12b[0].match(/<c r="K12"[^>]*>[\s\S]*?<\/c>/);
    const l12 = m12b[0].match(/<c r="L12"[^>]*>[\s\S]*?<\/c>/);
    const m12cell = m12b[0].match(/<c r="M12"[^>]*>[\s\S]*?<\/c>/);
    console.log('K12:', k12 ? k12[0] : 'MISSING');
    console.log('L12:', l12 ? l12[0] : 'MISSING');
    console.log('M12:', m12cell ? m12cell[0] : 'MISSING');
  }

  // Now simulate xmlSetCellText for B12 (name)
  const cellTag12 = '<c r="B12"';
  const reInline12 = new RegExp('(<c r="B12"[^>]*>)<is><t>[^<]*</t></is></c>');
  if (reInline12.test(xml)) {
    xml = xml.replace(reInline12, '$1<is><t>BARDALES</t></is></c>');
  }
  
  // Now try xmlSetCellText for L12 (empty string)
  const reInlineL12 = new RegExp('(<c r="L12"[^>]*>)<is><t>[^<]*</t></is></c>');
  const reSharedL12 = new RegExp('(<c r="L12"[^>]*?)t="s"([^>]*>)<v>\\d+</v></c>');
  const reValueL12 = new RegExp('(<c r="L12"[^>]*?>)(<v>[^<]*</v></c>|<v/>)');
  const reValueTypeL12 = new RegExp('(<c r="L12"[^>]*?)t="(?:s|str)"([^>]*>)(<v>[^<]*</v></c>|<v/>)');

  console.log('\n=== L12 regex tests ===');
  console.log('reInline:', reInlineL12.test(xml));
  console.log('reShared:', reSharedL12.test(xml));
  console.log('reValueType:', reValueTypeL12.test(xml));
  console.log('reValue:', reValueL12.test(xml));

  // Show L12 before any xmlSetCellText
  const l12before = xml.match(/<c r="L12"[^>]*>[\s\S]*?<\/c>/);
  console.log('L12 before write:', l12before ? l12before[0] : 'MISSING');

  // Apply reValueType for L12 (which should strip t="s")
  if (reValueTypeL12.test(xml)) {
    xml = xml.replace(reValueTypeL12, '$1$2<is><t></t></is></c>');
    console.log('Applied reValueType for L12');
  } else if (reValueL12.test(xml)) {
    xml = xml.replace(reValueL12, '$1<is><t></t></is></c>');
    console.log('Applied reValue for L12');
  }

  const l12after = xml.match(/<c r="L12"[^>]*>[\s\S]*?<\/c>/);
  console.log('L12 after write:', l12after ? l12after[0] : 'MISSING');

  // Now try M12 with t="s" -> reValueType
  const reValueTypeM12 = new RegExp('(<c r="M12"[^>]*?)t="(?:s|str)"([^>]*>)(<v>[^<]*</v></c>|<v/>)');
  const reValueM12 = new RegExp('(<c r="M12"[^>]*?>)(<v>[^<]*</v></c>|<v/>)');

  console.log('\n=== M12 regex tests ===');
  console.log('reValueType:', reValueTypeM12.test(xml));
  console.log('reValue:', reValueM12.test(xml));

  if (reValueTypeM12.test(xml)) {
    xml = xml.replace(reValueTypeM12, '$1$2<is><t>A</t></is></c>');
    console.log('Applied reValueType for M12');
  }

  const m12after = xml.match(/<c r="M12"[^>]*>[\s\S]*?<\/c>/);
  console.log('M12 after write:', m12after ? m12after[0] : 'MISSING');

  // Final count
  const m12final = xml.match(/<row r="12"[\s\S]*?<\/row>/);
  if (m12final) {
    const cells = m12final[0].match(/<c r="[A-Z]+\d+"/g);
    console.log('\nFINAL row 12 cells:', cells ? cells.length : 0);
  }
}

main().catch(console.error);
