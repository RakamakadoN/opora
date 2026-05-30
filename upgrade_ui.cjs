const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We must replace in carefully chosen order to avoid chained replacements
  // First, map exactly strings
  // To avoid overlapping, let's use a temporary token map

  content = content.replace(/text-sm\b/g, 'text-base');
  content = content.replace(/text-xs\b/g, 'text-sm');
  content = content.replace(/text-\[10px\]/g, 'text-xs');
  content = content.replace(/text-\[9px\]/g, 'text-[11px]');
  
  // Make borders warmer and softer radii
  content = content.replace(/rounded-xl\b/g, 'rounded-2xl');
  content = content.replace(/rounded-lg\b/g, 'rounded-xl');
  
  // Make backgrounds friendlier, add more white or sand space
  // Decrease density
  
  fs.writeFileSync(filePath, content);
}
console.log('UI upgraded');
