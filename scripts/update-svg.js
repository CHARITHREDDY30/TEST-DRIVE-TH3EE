import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const pngBase64 = fs.readFileSync(path.join(publicDir, 'logo-512.png')).toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FF3131" rx="64" />
  <image href="data:image/png;base64,${pngBase64}" width="512" height="512" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg, 'utf-8');
console.log('Successfully updated public/favicon.svg');
