const fs = require('fs');
const file = './src/components/BibliotecaDigital.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-\[11px\]/g, "text-sm");
content = content.replace(/text-\[10px\]/g, "text-xs");
content = content.replace(/text-\[9px\]/g, "text-xs");
content = content.replace(/text-\[8px\]/g, "text-[10px]");

fs.writeFileSync(file, content);
console.log("Replaced text sizes");
