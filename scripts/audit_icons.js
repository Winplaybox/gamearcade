const fs = require('fs');

// Try to find the Ionicons glyph map
let glyphMap = null;
const candidates = [
  './node_modules/@react-native-vector-icons/ionicons/glyphmaps/Ionicons.json',
  './node_modules/react-native-vector-icons/glyphmaps/Ionicons.json',
];
for (const p of candidates) {
  try { glyphMap = require(p); break; } catch(e) {}
}

// Also try reading the JS file that exports glyphMap
if (!glyphMap) {
  try {
    const code = fs.readFileSync('./node_modules/@react-native-vector-icons/ionicons/src/index.js', 'utf8');
    console.log('Found ionicons src, but cannot parse JS in Node easily');
  } catch(e) {}
}

// Known icons used in the project (from audit)
const usedIcons = [
  'add-circle', 'add-circle-outline', 'alert-circle-outline', 'arrow-back',
  'checkmark', 'checkmark-circle', 'chevron-down', 'chevron-forward',
  'close', 'close-circle', 'dice', 'game-controller', 'game-controller-outline',
  'globe-outline', 'heart-outline', 'information-circle-outline', 'link-outline',
  'open-outline', 'options-outline', 'person-circle-outline', 'play',
  'rocket', 'rocket-outline', 'search-outline', 'share-social-outline',
  'star', 'star-outline', 'time', 'time-outline', 'trash-outline', 'warning-outline'
];

if (glyphMap) {
  console.log('\n=== ICON VALIDATION ===');
  usedIcons.forEach(icon => {
    const valid = glyphMap[icon] !== undefined;
    console.log((valid ? '✅' : '❌ INVALID') + '  ' + icon);
  });
} else {
  console.log('Could not load glyph map. Trying alternative approach...');
  // Try reading from the font directory listing
  try {
    const dir = fs.readdirSync('./node_modules');
    const vIcons = dir.filter(d => d.includes('vector-icons') || d.includes('ionicons'));
    console.log('Vector icon packages:', vIcons);
  } catch(e) {}
  
  try {
    const dirs = fs.readdirSync('./node_modules/@react-native-vector-icons');
    console.log('@react-native-vector-icons packages:', dirs);
  } catch(e) { console.log('No @react-native-vector-icons found'); }
}
