const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(/canWrite\(\)\(\)/g, 'canWrite()');
fs.writeFileSync('firestore.rules', rules);
console.log('Fixed syntax error');
