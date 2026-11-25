// Arnès de test Node.js per renderitzar generarPdfRegistroSeg() de veritat i comprovar
// visualment el resultat (sense tocar src/App.jsx — treballa sobre la còpia extreta a
// scripts/_extracted-acta-seguimiento.js).
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // parcheja jsPDF.API.autoTable (mismo efecto que el <script> CDN en producción)
import fs from 'fs';

globalThis.window = { jspdf: { jsPDF } };
globalThis.document = { createElement: () => ({}), head: { appendChild: () => {} } };
let lastUrl = null;
globalThis.URL.createObjectURL = (blob) => { globalThis.__lastBlob = blob; return 'blob:fake'; };
globalThis.URL.revokeObjectURL = () => {};
globalThis.window.open = (url) => { lastUrl = url; };

const { generarPdfRegistroSeg } = await import('./_extracted-acta-seguimiento.js');

const obra = {
  nombre: 'Edificio Residencial CT10: 94 Viviendas',
  emplazamiento: 'Av. Diagonal 284, Barcelona',
  propiedad: 'Ferrovial Promociones',
  logoClienteB64: '',
};

const textoLargo = 'Durante la visita se ha detectado que la empresa instaladora todavía no ha presentado la documentación técnica de los equipos de climatización previstos en planta baja y primera planta, incluyendo fichas técnicas, certificados CE y planos de montaje definitivos, por lo que se reitera la petición formulada en actas anteriores.';

// Puntos variados: estados distintos, uno vencido (fechaLimite pasada y no cerrado),
// textos largos y cortos, con y sin título, para forzar saltos de página reales.
const puntos = [];
for (let i = 1; i <= 25; i++) {
  const estado = i % 4 === 0 ? 'cerrado' : i % 3 === 0 ? 'decidido' : 'curso';
  puntos.push({
    id: `p${i}`, num: i,
    titulo: i % 2 === 0 ? `Punto de seguimiento número ${i}` : '',
    texto: i % 5 === 0 ? textoLargo : `Observación breve del punto ${i} sobre coordinación de instalaciones.`,
    responsable: ['Ferrovial', 'PGI Engineering', 'GCT Arquitectes', 'Estructura'][i % 4],
    tematica: ['Instalaciones', 'Estructura', 'Calidad'][i % 3],
    fechaAlta: '2026-10-01',
    fechaLimite: i === 3 ? '2026-10-15' : '2026-12-01', // p3: vencido (pasado y no cerrado)
    fechaResolucion: estado === 'cerrado' ? '2026-11-10' : '',
    estado,
    comentarios: [],
    fotos: [],
  });
}

await generarPdfRegistroSeg(obra, puntos);

const blob = globalThis.__lastBlob;
const buf = Buffer.from(await blob.arrayBuffer());
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/pdf-registro-seguimiento-test.pdf', buf);
console.log('PDF generado:', 'out/pdf-registro-seguimiento-test.pdf', buf.length, 'bytes. window.open url capturada:', !!lastUrl);

// También con lista vacía, para comprobar que no rompe
await generarPdfRegistroSeg(obra, []);
const buf2 = Buffer.from(await globalThis.__lastBlob.arrayBuffer());
fs.writeFileSync('out/pdf-registro-seguimiento-vacio-test.pdf', buf2);
console.log('PDF (vacío) generado:', 'out/pdf-registro-seguimiento-vacio-test.pdf', buf2.length, 'bytes');
