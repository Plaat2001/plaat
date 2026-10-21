// Hook PostToolUse (Edit|Write): valida la sintaxi dels fitxers .jsx/.js/.mjs editats.
// Llegeix el JSON de l'esdeveniment per stdin. Si hi ha error de sintaxi -> exit 2 amb
// el missatge a stderr, perquè Claude el vegi i el corregeixi a l'instant.
import { readFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import { createRequire } from 'node:module';

let raw = '';
try { raw = readFileSync(0, 'utf8'); } catch { process.exit(0); }

let evt;
try { evt = JSON.parse(raw); } catch { process.exit(0); }

const file = evt?.tool_input?.file_path;
if (!file || !existsSync(file)) process.exit(0);

const ext = extname(file).toLowerCase();
if (!['.jsx', '.js', '.mjs'].includes(ext)) process.exit(0);
if (file.includes('node_modules')) process.exit(0);

let esbuild;
try {
  const require = createRequire(process.cwd() + '/');
  esbuild = require('esbuild'); // ve com a dependència de Vite
} catch {
  process.exit(0); // sense esbuild (encara no s'ha fet npm install): no bloquejar
}

try {
  esbuild.transformSync(readFileSync(file, 'utf8'), {
    loader: ext === '.jsx' ? 'jsx' : 'js',
    logLevel: 'silent',
  });
  process.exit(0);
} catch (e) {
  const errs = (e.errors || []).map(
    (x) => `  línia ${x.location?.line}:${x.location?.column} — ${x.text}`
  );
  console.error(`⚠ Error de sintaxi a ${file}:\n${errs.join('\n') || e.message}`);
  process.exit(2);
}
