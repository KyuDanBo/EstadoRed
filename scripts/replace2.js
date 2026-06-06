import * as fs from 'fs';

const path = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Replace all navigateTo with switchTab
content = content.replace(/navigateTo\(/g, 'switchTab(');

// Fix the original navigateTo definition that I added
content = content.replace(
  "const switchTab = (tab: string) => {\n    navigate(`/dashboard/${tab}`);\n  };",
  "const navigateTo = (tab: string) => {\n    navigate(`/dashboard/${tab}`);\n  };"
);

// We need to fix the call inside switchTab
content = content.replace(
  "const switchTab = (tab: any, node: any = null) => {\n    switchTab(tab);\n    setActiveCollectiveNode(node);",
  "const switchTab = (tab: any, node: any = null) => {\n    navigateTo(tab);\n    setActiveCollectiveNode(node);"
);

fs.writeFileSync(path, content);
console.log('Replaced navigateTo with switchTab');
