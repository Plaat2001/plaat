// Arnès de test Node.js per renderitzar generarActaSeguimiento() de veritat i comprovar
// visualment el resultat (sense tocar src/App.jsx — treballa sobre la còpia extreta a
// scripts/_extracted-acta-seguimiento.js).
import { jsPDF } from 'jspdf';
import fs from 'fs';

globalThis.window = { jspdf: { jsPDF } };
globalThis.document = { createElement: () => ({}), head: { appendChild: () => {} } };
let lastUrl = null;
globalThis.URL.createObjectURL = (blob) => { globalThis.__lastBlob = blob; return 'blob:fake'; };
globalThis.URL.revokeObjectURL = () => {};
globalThis.window.open = (url) => { lastUrl = url; };

const { generarActaSeguimiento } = await import('./_extracted-acta-seguimiento.js');

const obra = {
  nombre: 'Edificio Residencial CT10: 94 Viviendas',
  emplazamiento: 'Av. Diagonal 284, Barcelona',
};

const reunion = {
  fecha: '2026-11-18',
  titulo: 'Seguimiento de instalaciones y estructura',
  tematica: 'Instalaciones',
  modalidad: 'presencial',
  lugar: 'Oficina Plaat',
  asistentes: [
    { empresa: 'Ferrovial', persona: 'Francesc Camps', rol: 'Jefe de obra' },
    { empresa: 'PGI Engineering', persona: 'Jordi Sala', rol: 'Ingeniería instalaciones' },
    { empresa: 'PLAAT', persona: 'Jan Moreno', rol: 'DEO' },
    { empresa: 'GCT Arquitectes', persona: '', rol: 'Dirección de obra' },
  ],
};

const textoLargo = 'Durante la visita se ha detectado que la empresa instaladora todavía no ha presentado la documentación técnica de los equipos de climatización previstos en planta baja y primera planta, incluyendo fichas técnicas, certificados CE y planos de montaje definitivos, por lo que se reitera la petición formulada en actas anteriores y se solicita respuesta antes de la próxima visita para no comprometer el planning general de la obra y la coordinación con el resto de instalaciones del edificio.';

// `id` es ahora un identificador opaco (uid), separado de `num` (el "P-xxx" visible) —
// ver el fix de colisión de PK en migrarSeguimientoGlobalAntiguo/guardarNota.
const puntos = [
  { id: 'a1', num: 1, texto: textoLargo, responsable: 'PGI Engineering', fechaAlta: '2026-11-18', fechaLimite: '2026-11-25', fechaResolucion: '', estado: 'curso' },
  { id: 'a2', num: 2, texto: 'Se decide mantener el conector 1Ø16 c/40cm en los anclajes de forjado a pantalla, con una ligera inclinación según detalle revisado en obra.', responsable: 'Estructura', fechaAlta: '2026-11-18', fechaLimite: 'ASAP', fechaResolucion: '', estado: 'decidido' },
  { id: 'a3', num: 3, texto: 'Se ha enviado la documentación de postesado de vigas perimetrales con los ajustes solicitados en la reunión anterior.', responsable: 'VSL', fechaAlta: '2026-11-18', fechaLimite: '2026-11-10', fechaResolucion: '2026-11-18', estado: 'cerrado' },
  { id: 'a4', num: 4, texto: 'Falta definir el color de la celosía cerámica de fachada — pendiente de recibir muestras físicas del fabricante para validación conjunta con arquitectura y promotor.', responsable: 'GCT Arquitectes', fechaAlta: '2026-11-18', fechaLimite: 'n/p', fechaResolucion: '', estado: 'curso' },
  { id: 'a5', num: 5, texto: 'Revisar el detalle de giro de pilares en planta sótano, dado que el plano actual no coincide con la ejecución real observada durante la visita de obra de esta semana.', responsable: 'Others', fechaAlta: '2026-11-18', fechaLimite: '2026-12-01', fechaResolucion: '', estado: 'curso' },
];

// Duplicar puntos con textos largos para forzar salto de página real
for (let i = 6; i <= 14; i++) {
  puntos.push({ id: `a${i}`, num: i, texto: textoLargo + ` (duplicado de prueba nº ${i} para forzar salto de página)`, responsable: 'PLAAT', fechaAlta: '2026-11-18', fechaLimite: '2026-11-30', fechaResolucion: '', estado: i % 3 === 0 ? 'cerrado' : i % 2 === 0 ? 'decidido' : 'curso' });
}

await generarActaSeguimiento(obra, reunion, puntos);

const blob = globalThis.__lastBlob;
const buf = Buffer.from(await blob.arrayBuffer());
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/acta-seguimiento-test.pdf', buf);
console.log('PDF generado:', 'out/acta-seguimiento-test.pdf', buf.length, 'bytes. window.open url capturada:', !!lastUrl);
