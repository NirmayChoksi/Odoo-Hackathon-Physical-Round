const fs = require('fs');
const path = require('path');

function sanitizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Remove BOM
  if (content.startsWith('\uFEFF')) {
    content = content.slice(1);
  }
  // Remove any non-ASCII characters that might be breaking the compiler (optional but safe for this project)
  // content = content.replace(/[^\x00-\x7F]/g, ""); 
  
  // Specifically look for hidden characters often found in copy-pasted code
  content = content.replace(/\u200B/g, ''); // Zero width space
  content = content.replace(/\u200C/g, ''); // Zero width non-joiner
  content = content.replace(/\u200D/g, ''); // Zero width joiner
  content = content.replace(/\uFEFF/g, ''); // Byte Order Mark
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      if (file !== 'node_modules' && file !== '.angular') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.html') || file.endsWith('.css')) {
      sanitizeFile(filePath);
    }
  });
}

const targetDir = path.join(__dirname, 'src');
console.log('Sanitizing files in:', targetDir);
walkDir(targetDir);
console.log('Sanitization complete.');
