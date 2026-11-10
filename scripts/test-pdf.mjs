// Arnès de test Node.js per renderitzar generarActaVO_v2() de veritat i comprovar
// visualment la marca d'aigua de "Vista prèvia" (opcions.preview = true).
// No toca src/App.jsx — treballa sobre una còpia extreta a scripts/_extracted-acta.js.
import { jsPDF } from 'jspdf';
import { resolveObjectURL } from 'buffer';
import fs from 'fs';

globalThis.window = { jspdf: { jsPDF } };
globalThis.document = { createElement: () => ({}), head: { appendChild: () => {} } };

let lastUrl = null;
globalThis.window.open = (url) => { lastUrl = url; };

const { generarActaVO_v2 } = await import('./_extracted-acta.js');

const obra = {
  id: 'obra-test',
  nombre: 'Edifici Residencial Can Fàbregues',
  propiedad: 'Promocions Immobiliàries del Vallès Oriental, S.L.',
  cliente: 'Promocions Immobiliàries del Vallès Oriental, S.L.',
};

const uid = () => Math.random().toString(36).slice(2);

const textoLargo = 'Durant la visita s\'ha detectat que l\'empresa instal·ladora encara no ha presentat la documentació tècnica dels equips de climatització previstos a planta baixa i primera planta, incloent fitxes tècniques, certificats CE i plànols de muntatge definitius, pel que es reitera la petició formulada en actes anteriors i es demana resposta abans de la propera visita per no comprometre el planning general de l\'obra.';

function entrada({ estado, fecha, resp, texto, nueva = false, fin = '', fotos = [] }) {
  return { id: uid(), estado, fecha, fin, resp, texto, fotos, nueva };
}

// Placeholder de foto — bytes invàlids a propòsit: addImage/getImageProperties fallen i cauen
// al fallback {w:fW3,h:28} (try/catch ja existent al generador), cosa que dona una alçada
// determinista per comprovar la geometria del salt de pàgina sense dependre de imatges reals.
const fotoFake = () => ({ id: uid(), data: 'data:image/jpeg;base64,PLACEHOLDER' });

// Text molt llarg (unes 18-20 línies un cop embolicat a l'ample de la columna) — per forçar que
// un sol punt de seguiment s'hagi de partir entre línies de text.
const textoMuyLargo = Array.from({ length: 9 }, (_, i) =>
  `Paràgraf de prova número ${i + 1}: durant la visita s'han revisat els acabats interiors de totes les plantes, detectant petites esquerdes superficials als envans de pladur de les zones humides, pendents de repàs per part del contractista abans de l'inici dels treballs de pintura.`
).join(' ');

const vo = {
  num: 42,
  fechaActa: '2026-11-03',
  fase: 'Estructura i tancaments',
  lloc: 'Obra — Can Fàbregues, Granollers',
  equipo: [
    { id: uid(), nombre: 'PROJECT MANAGER', grupo: 'PROJECT MANAGER', personas: [
      { id: uid(), empresa: 'Gestió i Direcció Integral de Projectes Catalunya, S.L.P.', nombre: 'Marta Soler Puig', email: 'msoler@gdipc.cat', tel: '93 200 11 22', asistio: true },
    ] },
    { id: uid(), nombre: 'DIRECCIÓN DE OBRA (DO)', grupo: 'DIRECCIÓN FACULTATIVA', personas: [
      { id: uid(), empresa: 'Estudi d\'Arquitectura Bosch & Associats', nombre: 'Jordi Bosch Ferrer', email: 'jbosch@boscharquitectura.es', tel: '93 310 44 55', asistio: true },
    ] },
    { id: uid(), nombre: 'DIRECCIÓN DE EJECUCIÓN (DEO)', grupo: 'DIRECCIÓN DE EJECUCIÓN', personas: [
      { id: uid(), empresa: 'PLAAT', nombre: 'Xavier Pla', email: 'xpla@plaat.es', tel: '629 72 72 62', asistio: true },
    ] },
    { id: uid(), nombre: 'COORDINADOR DE SEGURIDAD (CSS)', grupo: 'DIRECCIÓN DE EJECUCIÓN', personas: [
      { id: uid(), empresa: 'Seguretat i Coordinació d\'Obres del Mediterrani, S.L.', nombre: 'Anna Puig Coma', email: 'apuig@segurcoord.cat', tel: '93 450 66 77', asistio: false },
    ] },
    { id: uid(), nombre: 'CONTRATISTA (EC)', grupo: 'CONTRATISTA', personas: [
      { id: uid(), empresa: 'Construccions i Obra Civil Nord-Est, S.A.', nombre: 'Ramon Vila Soler', email: 'rvila@construccionsnordest.com', tel: '93 500 88 99', asistio: true },
    ] },
    // Rol opcional de prova — comprova que getEmpresa() el troba via el clau 'AMBIENT'
    { id: uid(), nombre: 'DIRECCIÓN AMBIENTAL DE OBRA (DAO)', grupo: 'DIRECCIÓN DE EJECUCIÓN', personas: [
      { id: uid(), empresa: 'Consultoria Ambiental i Sostenibilitat del Vallès, S.L.', nombre: 'Laia Font Roca', email: 'lfont@consultoriambiental.cat', tel: '93 600 77 88', asistio: true },
    ] },
  ],
  estadoObra: { descripcion: '', ubicacions: [] },
  trabajosEnCurso: [
    // codigo editable a mà — comprova que el PDF respecta un número no seqüencial (p.ex.
    // "3" tot i ser el primer de la llista) en lloc de calcular-lo per posició.
    // codigo = etiqueta COMPLETA i lliure (ja no només el sufix darrere d'un "B." fix) —
    // comprova que es pot escriure qualsevol cosa, fins i tot sense el prefix "B.".
    { id: uid(), codigo: 'B.3', descripcion: 'Execució de forjat de planta primera i inici de tancaments de façana nord', porcentaje: '65', fotos: [] },
    { id: uid(), codigo: 'B.1 bis', descripcion: 'Petita reiteració sobre el mateix punt.', porcentaje: '30', fotos: [] },
    // Etiqueta llarga (dins del límit de 10 caràcters de la UI) — comprova que el desplaçament
    // de la descripció creix amb l'ample real i no es solapa.
    { id: uid(), codigo: 'FASE2.B.07', descripcion: 'Comprovació de que el desplaçament de la descripció no es solapa amb una etiqueta llarga.', porcentaje: '10', fotos: [] },
  ],
  secciones: [
    { id: uid(), codigo: '1', titulo: 'TEMAS GENERALES, ARQUITECTURA Y ESTRUCTURA', temas: [
      { id: uid(), num: '1.01', titulo: 'Documentació tècnica climatització pendent', entradas: [
        entrada({ estado: 'P', fecha: '2026-09-15', resp: ['EC'], texto: textoLargo, nueva: false }),
        entrada({ estado: 'P', fecha: '2026-10-06', resp: ['EC','DEO'], texto: 'Es reitera la petició, sense resposta de l\'instal·lador.', nueva: true }),
        // Responsable personalitzat (fora de RESP_VO) — comprova que s'imprimeix igual que els predeterminats
        entrada({ estado: 'P', fecha: '2026-10-20', resp: ['EC','GEST'], texto: 'Tercera reiteració. El contractista indica que ho tindrà la propera setmana.', nueva: true }),
        entrada({ estado: 'R', fecha: '2026-11-03', resp: ['EC'], texto: 'Documentació rebuda i validada per la DEO.', nueva: true, fin: '2026-11-03' }),
      ] },
      // Tema amb un únic punt nou marcat com a Informatiu — comprova la badge 'N/I'
      { id: uid(), num: '1.02', titulo: 'Nova normativa d\'accessibilitat aplicable a l\'obra', entradas: [
        entrada({ estado: 'I', fecha: '2026-11-03', resp: ['DO'], texto: 'S\'informa que a partir de gener entra en vigor la nova normativa d\'accessibilitat; es traslladarà a la resta d\'agents en la propera reunió.', nueva: true }),
      ] },
      // Tema de prova — punt de seguiment amb text molt llarg (ha de partir-se entre línies
      // si no hi cap sencer a la pàgina actual).
      { id: uid(), num: '1.03', titulo: 'Revisió d\'acabats interiors — prova de text llarg', entradas: [
        entrada({ estado: 'P', fecha: '2026-11-03', resp: ['DEO'], texto: textoMuyLargo, nueva: true }),
      ] },
      // Tema de prova — punt de seguiment amb 16 fotos (8 files de 2, ~238mm només de fotos):
      // no hi cap ni sencer en una pàgina nova, ha de partir-se ENTRE files de fotos i continuar
      // en una tercera pàgina (prova de partició múltiple sobre la mateixa entrada).
      { id: uid(), num: '1.04', titulo: 'Estat de façana nord — prova amb fotos', entradas: [
        entrada({ estado: 'P', fecha: '2026-11-03', resp: ['EC'], texto: 'Es documenta l\'estat actual de la façana nord amb reportatge fotogràfic complet.', nueva: true,
          fotos: Array.from({ length: 16 }, fotoFake) }),
      ] },
      // Un parell de temas curts més, per acabar d'omplir la pàgina i que els de prova caiguin
      // a mig full (no just a l'inici d'una pàgina nova).
      { id: uid(), num: '1.05', titulo: 'Neteja i ordre de l\'obra', entradas: [
        entrada({ estado: 'R', fecha: '2026-10-20', resp: ['EC'], texto: 'Correcte, sense incidències a destacar en aquesta visita.', nueva: false, fin: '2026-10-20' }),
      ] },
      { id: uid(), num: '1.06', titulo: 'Senyalització de seguretat', entradas: [
        entrada({ estado: 'P', fecha: '2026-10-20', resp: ['CSS'], texto: 'Falta senyalització de risc de caiguda a l\'obertura de forjat de planta primera.', nueva: false }),
      ] },
      // Tema de prova — text curt (1 línia) però MOLTS responsables: la columna de responsables
      // és més alta que el text (regressió detectada pel revisor a partirEntrada). Comprova que
      // mai es parteixi de manera que el fragment resultant desbordi l'espai disponible.
      { id: uid(), num: '1.07', titulo: 'Prova — text curt amb molts responsables', entradas: [
        entrada({ estado: 'P', fecha: '2026-11-03', resp: ['EC','DO','DEO','PR','DOE','DOI','CSS'], texto: 'Punt breu amb molts responsables assignats.', nueva: true }),
      ] },
    ] },
    { id: uid(), codigo: '2', titulo: 'INSTALACIONES', temas: [] },
    { id: uid(), codigo: '3', titulo: 'CONTROL DE CALIDAD', temas: [] },
    { id: uid(), codigo: '4', titulo: 'LEED & BREAM', temas: [] },
    { id: uid(), codigo: '5', titulo: 'PLANIFICACIÓN', temas: [] },
  ],
  hitos: {
    esenciales: [{ id: uid(), codigo: '6.1', descripcion: 'Finalització d\'estructura', fechaPlanning: '2026-12-01', fechaPrevista: '2026-12-10', fechaReal: '' }],
    intermedios: [{ id: uid(), codigo: '6.2', descripcion: 'Tancament de façanes', fechaPlanning: '2027-01-15', fechaPrevista: '2027-01-20', fechaReal: '' }],
  },
  contrataciones: [
    { id: uid(), empresa: 'Instal·lacions Elèctriques i de Climatització del Baix Montseny, S.L.', nif: 'B-61234567', actividad: 'Instal·lació elèctrica, climatització i domòtica integral de l\'edifici, incloent quadres generals, subquadres de planta i certificació final d\'instal·lació', contacto: 'Enric Mas', telefono: '93 870 12 34', correo: 'enric.mas@iecbm.cat' },
  ],
  clima: [
    { fecha: '2026-10-29', temp: 14, precip: 0,   condicion: 'soleado' },
    { fecha: '2026-10-30', temp: 13, precip: 1.2, condicion: 'nublado' },
    { fecha: '2026-10-31', temp: 11, precip: 6.5, condicion: 'lluvia' },
    { fecha: '2026-11-01', temp: 10, precip: 14.0,condicion: 'lluvia' },
    { fecha: '2026-11-02', temp: 12, precip: 0,   condicion: 'soleado' },
    { fecha: '2026-11-03', temp: 12, precip: 0.4, condicion: 'nublado' },
    { fecha: '2026-11-04', temp: 15, precip: 0,   condicion: 'soleado' },
  ],
  firmasSeleccionadas: ['promotor', 'pm', 'do', 'deo', 'ec'],
};

async function render(opcions, outName) {
  lastUrl = null;
  await generarActaVO_v2(obra, vo, 'es', opcions);
  const blob = resolveObjectURL(lastUrl);
  const buf = Buffer.from(await blob.arrayBuffer());
  fs.writeFileSync(new URL(`../out/${outName}`, import.meta.url), buf);
  console.log(`Escrit out/${outName} (${buf.length} bytes)`);
}

await render({ preview: true }, 'acta-preview.pdf');
await render({}, 'acta-normal.pdf');

// Variant amb el rol opcional DAO actiu — comprova el quadre de firmes amb 7 firmants (files de 3+3+1)
vo.firmasSeleccionadas = ['promotor', 'pm', 'do', 'deo', 'css', 'ec', 'dao'];
await render({}, 'acta-dao.pdf');
