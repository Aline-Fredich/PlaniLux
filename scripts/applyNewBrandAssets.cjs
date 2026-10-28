const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processBranding() {
  const src = 'C:/Users/Dell/.gemini/antigravity/brain/df933a23-242f-4fce-8db0-43ed2ed0f0de/.user_uploaded/media_1793213137389_0fd00590.jpg';
  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 1. Logo original maître 1024x1024
  await sharp(src)
    .resize(1024, 1024, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 8 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ public/logo.png (1024x1024)');

  // 2. Icônes PWA
  await sharp(src)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✓ public/icons/icon-512.png');

  await sharp(src)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✓ public/icons/icon-192.png');

  await sharp(src)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ public/icons/apple-touch-icon.png');

  await sharp(src)
    .resize(64, 64, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'favicon-32.png'));
  console.log('✓ public/icons/favicon-32.png');

  await sharp(src)
    .resize(64, 64, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ public/favicon.png');

  // Convertir le PNG 64 en base64 pour remplacer public/favicon.svg
  const png64Base64 = (await sharp(src).resize(64, 64).png().toBuffer()).toString('base64');
  const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" width="64" height="64"><image width="64" height="64" xlink:href="data:image/png;base64,${png64Base64}" /></svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgWrapper, 'utf8');
  console.log('✓ public/favicon.svg (mis à jour avec le nouveau logo)');

  console.log('🎉 Tous les logos et icônes applicatifs sont synchronisés avec succès !');
}

processBranding().catch(console.error);
