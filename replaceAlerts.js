const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'SettingsScreen.js',
  'SubmitGameScreen.js',
  'ReportIssueScreen.js',
  'FavoritesScreen.js',
  'GameScreen.js',
  'ContinuePlayingScreen.js'
];

const srcDir = path.join(__dirname, 'src', 'screens');

for (const file of filesToUpdate) {
  const filePath = path.join(srcDir, file);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', filePath);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has useCustomAlert
  if (content.includes('useCustomAlert')) {
    continue;
  }

  // 1. Remove Alert from react-native import
  content = content.replace(/,\s*Alert\s*,/g, ',');
  content = content.replace(/{\s*Alert\s*,/g, '{');
  content = content.replace(/,\s*Alert\s*}/g, '}');
  content = content.replace(/{\s*Alert\s*}/g, '{}');

  // 2. Import useCustomAlert
  // Find last import
  const lastImportIndex = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf('\n', lastImportIndex);
  content = content.slice(0, endOfLastImport + 1) + 
    "import { useCustomAlert } from '../context/AlertContext';\n" + 
    content.slice(endOfLastImport + 1);

  // 3. Inject const { showAlert } = useCustomAlert(); inside component
  // We look for: export default function FileName({ navigation, ... }) {
  const componentMatch = content.match(/export default function \w+\(.*?\)\s*{/);
  if (componentMatch) {
    const insertPos = componentMatch.index + componentMatch[0].length;
    content = content.slice(0, insertPos) +
      "\n  const { showAlert } = useCustomAlert();" +
      content.slice(insertPos);
  }

  // 4. Replace Alert.alert with showAlert
  content = content.replace(/Alert\.alert\(/g, 'showAlert(');

  fs.writeFileSync(filePath, content);
  console.log('Updated', file);
}
