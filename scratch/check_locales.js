const fs = require('fs');
const path = require('path');

const enJson = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf-8'));
const validKeys = new Set(Object.keys(enJson));
const usedKeys = new Set();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.matchAll(/t\(['"]([a-zA-Z0-9_]+)['"]\)/g);
      for (const match of matches) {
        usedKeys.add(match[1]);
      }
    }
  }
}

scanDir('src');
const missingKeys = [];
for (const key of usedKeys) {
  if (!validKeys.has(key)) {
    missingKeys.push(key);
  }
}
console.log('Missing Keys:', missingKeys);
