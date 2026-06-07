const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(/allow write: if isSignedIn()/g, 'allow write: if canWrite()');
rules = rules.replace(/allow create: if isSignedIn()/g, 'allow create: if canWrite()');
rules = rules.replace(/allow update: if isSignedIn()/g, 'allow update: if canWrite()');
fs.writeFileSync('firestore.rules', rules);
console.log('Rules updated');
