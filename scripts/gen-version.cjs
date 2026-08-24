const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'version.json');
const content = JSON.stringify({ v: Date.now() });
fs.writeFileSync(file, content);
console.log('version.json =>', content);
