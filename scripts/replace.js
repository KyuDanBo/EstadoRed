import * as fs from 'fs';

const path = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(/setCurrentTab/g, 'navigateTo');

fs.writeFileSync(path, content);
console.log('Replaced setCurrentTab with navigateTo');
