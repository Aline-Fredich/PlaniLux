const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
  const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32.png', size: 32 }
  ];

  for (const t of targets) {
    const outPath = path.join(iconsDir, t.name);
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(outPath);
    console.log(`Généré : ${t.name} (${t.size}x${t.size})`);
  }

  console.log('Toutes les icônes PWA ont été générées avec succès !');
}

generate().catch(console.error);
