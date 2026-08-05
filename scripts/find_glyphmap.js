const fs = require('fs');
const path = require('path');

function findFile(startDir, filename) {
  const results = [];
  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir);
      for (const e of entries) {
        if (e === 'node_modules' && dir !== startDir) continue;
        const full = path.join(dir, e);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) walk(full);
          else if (e === filename) results.push(full);
        } catch(e) {}
      }
    } catch(e) {}
  }
  walk(startDir);
  return results;
}

console.log('Searching for Ionicons.json...');
const found = findFile('./node_modules', 'Ionicons.json');
console.log('Found:', found);
