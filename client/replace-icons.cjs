const fs = require('fs');
const path = require('path');

const iconMapping = {
  Plus: 'Add',
  CheckCircle2: 'CheckCircle',
  CheckCircle: 'CheckCircle',
  Circle: 'RadioButtonUnchecked',
  Clock: 'AccessTime',
  AlertCircle: 'ErrorOutline',
  Search: 'Search',
  FolderKanban: 'ViewKanban',
  ArrowLeft: 'ArrowBack',
  GitBranch: 'DeviceHub',
  ExternalLink: 'OpenInNew',
  Users: 'Group',
  Code2: 'Code',
  Globe: 'Public',
  RefreshCw: 'Refresh',
  RefreshCcw: 'Refresh',
  Target: 'TrackChanges',
  FileText: 'InsertDriveFile',
  Building2: 'Business',
  Mail: 'Email',
  Phone: 'Phone',
  Eye: 'Visibility',
  EyeOff: 'VisibilityOff',
  Trash2: 'DeleteOutline',
  Send: 'Send',
  Check: 'Check',
  ChevronDown: 'ExpandMore',
  X: 'Close',
  Bell: 'Notifications',
  Menu: 'Menu',
  Moon: 'DarkMode',
  Sun: 'LightMode',
  LogOut: 'Logout',
  User: 'Person',
  UserX: 'PersonRemove',
  TrendingUp: 'TrendingUp',
  TrendingDown: 'TrendingDown',
  Monitor: 'DesktopMac',
  ArrowRight: 'ArrowForward',
  Filter: 'FilterList',
  DollarSign: 'AttachMoney',
  CheckSquare: 'CheckBox'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes('lucide-react')) return;

  // Find the import statement
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  let match;
  let hasChanges = false;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importedIcons = match[1].split(',').map(s => s.trim());
    let newImports = [];
    
    for (let icon of importedIcons) {
      if (iconMapping[icon]) {
        newImports.push(iconMapping[icon]);
        
        // Replace in JSX: <Icon ... /> to <NewIcon ... />
        const tagRegex = new RegExp(`<${icon}(\\s|>)`, 'g');
        content = content.replace(tagRegex, `<${iconMapping[icon]}$1`);
        
        // Replace closing tag if any: </Icon>
        const closeTagRegex = new RegExp(`</${icon}>`, 'g');
        content = content.replace(closeTagRegex, `</${iconMapping[icon]}>`);
        
        // Replace as object properties like icon: Icon
        const propRegex = new RegExp(`icon:\\s*${icon}(\\s|,)`, 'g');
        content = content.replace(propRegex, `icon: ${iconMapping[icon]}$1`);

        // Replace direct references
        const directRegex = new RegExp(`(?<!<|/|import\\s*\\{.*|\\w)${icon}(?!\\w)`, 'g');
        content = content.replace(directRegex, iconMapping[icon]);
      } else {
        console.warn(`No mapping for ${icon} in ${filePath}`);
        newImports.push(icon); // Keep the unmapped one
      }
    }
    
    // Replace the import statement with @mui/icons-material
    const newImportStr = `import { ${newImports.join(', ')} } from '@mui/icons-material';`;
    content = content.replace(match[0], newImportStr);
    hasChanges = true;
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
