const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogo() {
  const src = 'C:/Users/Dell/.gemini/antigravity/brain/df933a23-242f-4fce-8db0-43ed2ed0f0de/.user_uploaded/media_1793211829655_54258c9b.jpg';
  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 1. Sauvegarder logo principal 1024x1024 et 512x512
  await sharp(src)
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ logo.png (1024x1024)');

  await sharp(src)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✓ icon-512.png');

  await sharp(src)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✓ icon-192.png');

  await sharp(src)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  await sharp(src)
    .resize(64, 64, { fit: 'cover' })
    .png()
    .toFile(path.join(iconsDir, 'favicon-32.png'));
  console.log('✓ favicon-32.png');

  await sharp(src)
    .resize(48, 48, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('Tous les assets et logos ont été générés avec succès !');
}

processLogo().catch(console.error);

