import { jsPDF } from 'jspdf';
import { resolveObjectURL } from 'buffer';
import fs from 'fs';

globalThis.window = { jspdf: { jsPDF } };
globalThis.document = { createElement: () => ({}), head: { appendChild: () => {} } };
let lastUrl = null;
globalThis.window.open = (url) => { lastUrl = url; };

const { generarOrdenDelDia } = await import('./_extracted-orden-dia.js');

const obra = { id: 'obra-test', nombre: 'Edifici Residencial Can Fàbregues' };
const vo = {};

const items = [
  { temaNum: '1.01', temaTitulo: 'Documentació tècnica climatització pendent', entradas: [
    { texto: 'Es reitera la petició, sense resposta de l\'instal·lador.' },
    { texto: 'Tercera reiteració. El contractista indica que ho tindrà la propera setmana.' },
  ] },
  { temaNum: '1.06', temaTitulo: 'Senyalització de seguretat', entradas: [
    { texto: 'Falta senyalització de risc de caiguda a l\'obertura de forjat de planta primera.' },
  ] },
  { temaNum: '2.03', temaTitulo: 'Instal·lació elèctrica planta primera', entradas: [
    { texto: 'Pendent de validar l\'esquema unifilar definitiu abans d\'iniciar el muntatge dels quadres secundaris de planta primera i segona.' },
  ] },
];

await generarOrdenDelDia(obra, vo, items);
const blob = resolveObjectURL(lastUrl);
const buf = Buffer.from(await blob.arrayBuffer());
fs.writeFileSync(new URL('../out/orden-dia.pdf', import.meta.url), buf);
console.log(`Escrit out/orden-dia.pdf (${buf.length} bytes)`);
