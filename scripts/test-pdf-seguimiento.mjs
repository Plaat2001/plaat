// Arnès de test Node.js per renderitzar generarActaSeguimiento() de veritat i comprovar
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

const { generarActaSeguimiento } = await import('./_extracted-acta-seguimiento.js');

// JPEG 1x1 real (vàlid) per comprovar de veritat l'embed de fotos al PDF, no un placeholder trencat.
const FOTO_B64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
const foto = () => ({ id: Math.random().toString(36).slice(2), data: FOTO_B64 });

const obra = {
  nombre: 'Edificio Residencial CT10: 94 Viviendas',
  emplazamiento: 'Av. Diagonal 284, Barcelona',
  propiedad: 'Ferrovial Promociones',
  logoClienteB64: '',
};

const reunion = {
  id: 'R1',
  fecha: '2026-11-18',
  titulo: 'Seguimiento de instalaciones y estructura',
  tematica: 'Instalaciones',
  fase: 'obra',
  modalidad: 'presencial',
  lugar: 'Oficina Plaat',
  estado: 'finalizada',
  asistentes: [
    { empresa: 'Ferrovial', persona: 'Francesc Camps', rol: 'Jefe de obra' },
    { empresa: 'PGI Engineering', persona: 'Jordi Sala', rol: 'Ingeniería instalaciones' },
    { empresa: 'PLAAT', persona: 'Jan Moreno', rol: 'DEO', email: 'jan.moreno@plaat.es' },
    { empresa: 'GCT Arquitectes', persona: '', rol: 'Dirección de obra' },
  ],
};

const textoLargo = 'Durante la visita se ha detectado que la empresa instaladora todavía no ha presentado la documentación técnica de los equipos de climatización previstos en planta baja y primera planta, incluyendo fichas técnicas, certificados CE y planos de montaje definitivos, por lo que se reitera la petición formulada en actas anteriores y se solicita respuesta antes de la próxima visita para no comprometer el planning general de la obra y la coordinación con el resto de instalaciones del edificio.';

// `id` es ahora un identificador opaco (uid), separado de `num` (el "P-xxx" visible) —
// ver el fix de colisión de PK en migrarSeguimientoGlobalAntiguo/guardarNota.
// `titulo` (opcional) y `comentarios` (seguimiento libre tipo "Observaciones" del Excel)
// son los campos nuevos que añadió el gap-analysis del módulo de Seguimiento.
// a1-a5: puntos propios de esta reunión (reunionOrigen=R1, numActa = orden dentro del acta).
// a6-a14: puntos de reuniones anteriores que se han tratado hoy (reunionOrigen distinto) —
// salen en la segunda tabla "SEGUIMIENTO DE PUNTOS ANTERIORES ACTUALIZADOS EN ESTA REUNIÓN".
const puntos = [
  { id: 'a1', num: 1, numActa: 1, reunionOrigen: 'R1', titulo: 'Documentación técnica climatización', texto: textoLargo, responsable: 'PGI Engineering', fechaAlta: '2026-11-18', fechaLimite: '2026-11-25', fechaResolucion: '', estado: 'curso',
    comentarios: [{ id: 'c1', texto: 'Se reitera por correo la petición a la instaladora.', creadaEn: '2026-11-20T10:00:00' }], fotos: [foto(), foto()] },
  { id: 'a2', num: 2, numActa: 2, reunionOrigen: 'R1', titulo: '', texto: 'Se decide mantener el conector 1Ø16 c/40cm en los anclajes de forjado a pantalla, con una ligera inclinación según detalle revisado en obra.', responsable: 'Estructura', fechaAlta: '2026-11-18', fechaLimite: 'ASAP', fechaResolucion: '', estado: 'decidido', comentarios: [], fotos: [] },
  { id: 'a3', num: 3, numActa: 3, reunionOrigen: 'R1', titulo: 'Postesado vigas perimetrales', texto: 'Se ha enviado la documentación de postesado de vigas perimetrales con los ajustes solicitados en la reunión anterior.', responsable: 'VSL', fechaAlta: '2026-11-18', fechaLimite: '2026-11-10', fechaResolucion: '2026-11-18', estado: 'cerrado', comentarios: [], fotos: [] },
  { id: 'a4', num: 4, numActa: 4, reunionOrigen: 'R1', titulo: 'Color celosía cerámica fachada', texto: 'Falta definir el color de la celosía cerámica de fachada — pendiente de recibir muestras físicas del fabricante para validación conjunta con arquitectura y promotor.', responsable: 'GCT Arquitectes', fechaAlta: '2026-11-18', fechaLimite: 'n/p', fechaResolucion: '', estado: 'curso', comentarios: [], fotos: [foto()] },
  { id: 'a5', num: 5, numActa: 5, reunionOrigen: 'R1', titulo: '', texto: 'Revisar el detalle de giro de pilares en planta sótano, dado que el plano actual no coincide con la ejecución real observada durante la visita de obra de esta semana.', responsable: 'Others', fechaAlta: '2026-11-18', fechaLimite: '2026-12-01', fechaResolucion: '', estado: 'curso', comentarios: [], fotos: [] },
];

// Duplicar puntos con textos largos para forzar salto de página real (puntos "tratados",
// de una reunión anterior R0, actualizados hoy)
for (let i = 6; i <= 14; i++) {
  puntos.push({ id: `a${i}`, num: i, reunionOrigen: 'R0', titulo: '', texto: textoLargo + ` (duplicado de prueba nº ${i} para forzar salto de página)`, responsable: 'PLAAT', fechaAlta: '2026-11-10', fechaLimite: '2026-11-30', fechaResolucion: '', estado: i % 3 === 0 ? 'cerrado' : i % 2 === 0 ? 'decidido' : 'curso', comentarios: [], fotos: [] });
}

// Anexo: pendientes de la misma temática no tratados en esta reunión (checkbox opcional en la UI)
const anexo = [
  { id: 'b1', num: 20, titulo: 'Pendiente de reunión anterior', texto: 'Queda pendiente la revisión del detalle de impermeabilización en cubierta plana de la zona de instalaciones, arrastrado de la reunión de octubre.', responsable: 'PGI Engineering', fechaAlta: '2026-10-15', fechaLimite: '2026-11-05', fechaResolucion: '', estado: 'curso', comentarios: [], fotos: [] },
];

await generarActaSeguimiento(obra, reunion, puntos, anexo);

const blob = globalThis.__lastBlob;
const buf = Buffer.from(await blob.arrayBuffer());
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/acta-seguimiento-test.pdf', buf);
console.log('PDF generado:', 'out/acta-seguimiento-test.pdf', buf.length, 'bytes. window.open url capturada:', !!lastUrl);
