const fs = require('fs');
const path = require('path');

const srcLogo = path.join(__dirname, '..', 'public', 'logo.png');
const destAssetsDir = path.join(__dirname, '..', 'src', 'assets');
if (!fs.existsSync(destAssetsDir)) {
  fs.mkdirSync(destAssetsDir, { recursive: true });
}

fs.copyFileSync(srcLogo, path.join(destAssetsDir, 'logo.png'));
console.log('✓ Copié dans src/assets/logo.png');

const fav32 = fs.readFileSync(path.join(__dirname, '..', 'public', 'icons', 'favicon-32.png'));
const favB64 = fav32.toString('base64');
const dataUri = `data:image/png;base64,${favB64}`;

let html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
html = html.replace(/<link rel="icon"[^>]+>/, `<link rel="icon" type="image/png" href="${dataUri}" />`);
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), html, 'utf8');
console.log('✓ index.html mis à jour avec favicon Data URI direct');

