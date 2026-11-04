// Rasteritza un PDF a PNG (una imatge per pàgina) usant pdfjs-dist + @napi-rs/canvas,
// sense dependre de poppler/ghostscript (no disponibles en aquest entorn Windows).
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const standardFontDataUrl = path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts').split(path.sep).join('/') + '/';

const [, , inPath, outPrefix] = process.argv;
const data = new Uint8Array(fs.readFileSync(inPath));
const doc = await pdfjsLib.getDocument({ data, disableFontFace: true, standardFontDataUrl }).promise;

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const scale = 1.6;
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  fs.writeFileSync(`${outPrefix}-${String(i).padStart(2, '0')}.png`, canvas.toBuffer('image/png'));
}
console.log(`${doc.numPages} pàgines renderitzades (${outPrefix}-NN.png)`);
