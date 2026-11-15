// Arnès de test de la recuperació de numeració de temes de l'Acta VO.
// Extreu `numsRepetitsVO` i `planRestaurarNums` del propi App.jsx (per no duplicar la lògica)
// i comprova els casos que van trencar la numeració d'una obra real:
//   · temes que van canviar de número en renumerar-se les seccions → han de tornar al seu
//   · números repetits → mai en poden quedar dos iguals dins d'una secció
//   · temes afegits després d'exportar l'acta → no es perden ni canvien si no cal
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
function extreu(nom) {
  const i = src.indexOf(`function ${nom}(`);
  assert.ok(i !== -1, `no s'ha trobat ${nom} a App.jsx`);
  // Fins a la primera línia que torna a començar per "}" a columna 0
  const fi = src.indexOf('\n}', i);
  return src.slice(i, fi + 2);
}
const { numsRepetitsVO, planRestaurarNums } = (new Function(
  `${extreu('numsRepetitsVO')}\n${extreu('planRestaurarNums')}\nreturn { numsRepetitsVO, planRestaurarNums };`
))();

const tema = (id, num, titulo) => ({ id, num, titulo, entradas: [{ id: id + 'e', texto: 'x' }] });

// ── Cas 1 — l'acta exportada és la bona; l'actual té prefixos barrejats i un repetit ──
const versio = {
  num: 7,
  secciones: [
    { id: 's1', codigo: '1', titulo: 'GENERALES', temas: [tema('t1', '1.01', 'Replanteo'), tema('t2', '1.02', 'Estructura')] },
    { id: 's2', codigo: '2', titulo: 'INSTALACIONES', temas: [tema('t3', '2.01', 'Clima'), tema('t4', '2.07', 'Fontanería')] },
  ],
};
const actual = {
  num: 8,
  secciones: [
    { id: 's1', codigo: '1', titulo: 'GENERALES', temas: [tema('t1', '1.01', 'Replanteo'), tema('t2', '1.01', 'Estructura'), tema('t5', '1.03', 'Tema nuevo')] },
    { id: 's2', codigo: '2', titulo: 'INSTALACIONES', temas: [tema('t3', '2.01', 'Clima'), tema('t4', '2.02', 'Fontanería'), tema('t6', '2.07', 'Otro nuevo')] },
  ],
};

const { vo, canvis } = planRestaurarNums(actual, versio);
const nums = Object.fromEntries(vo.secciones.flatMap(s => s.temas.map(t => [t.id, t.num])));

assert.equal(nums.t1, '1.01');                 // ja era correcte
assert.equal(nums.t2, '1.02');                 // recupera el seu i deixa de repetir l'1.01
assert.equal(nums.t3, '2.01');
assert.equal(nums.t4, '2.07');                 // torna al número amb què va sortir al PDF
assert.equal(nums.t5, '1.03');                 // afegit després: conserva el seu
assert.equal(nums.t6, '2.02');                 // xocava amb el 2.07 recuperat → primer lliure

// Cap tema perdut i cap número repetit
assert.equal(vo.secciones.flatMap(s => s.temas).length, 6);
assert.deepEqual(numsRepetitsVO(vo), []);
// Només es toquen els temes que calen
assert.deepEqual(canvis.map(c => `${c.de}→${c.a}`).sort(), ['1.01→1.02', '2.02→2.07', '2.07→2.02'].sort());

// ── Cas 2 — idempotent: tornar-ho a aplicar no mou res ──
const segona = planRestaurarNums(vo, versio);
assert.deepEqual(segona.canvis, []);

// ── Cas 3 — tema sense número i acta de referència amb repetits ──
const versioBruta = { num: 9, secciones: [{ id: 's1', codigo: '1', temas: [tema('t1', '1.01', 'A'), tema('t2', '1.01', 'B')] }] };
assert.deepEqual(numsRepetitsVO(versioBruta), ['1.01']);
const r3 = planRestaurarNums({ secciones: [{ id: 's1', codigo: '1', temas: [tema('t1', '', 'A'), tema('t2', '', 'B')] }] }, versioBruta);
assert.deepEqual(r3.vo.secciones[0].temas.map(t => t.num), ['1.01', '1.02']); // el segon no es queda repetit
assert.deepEqual(numsRepetitsVO(r3.vo), []);

console.log('OK — restauració de numeració correcta (3 casos)');
