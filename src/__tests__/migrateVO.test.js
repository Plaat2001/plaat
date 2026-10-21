import { describe, it, expect } from 'vitest';
import { migrateVO } from '../App.jsx';

describe('migrateVO', () => {
  it('omple tots els valors per defecte quan es parteix de null', () => {
    const vo = migrateVO(null);
    expect(vo.num).toBe(1);
    expect(typeof vo.fechaActa).toBe('string');
    expect(vo.firmasSeleccionadas).toEqual(['promotor', 'pm', 'do', 'deo', 'css', 'ec']);
    expect(vo.estadoObra).toEqual({ descripcion: '', ubicacions: [] });
    expect(vo.trabajosEnCurso).toEqual([]);
    expect(vo.hitos).toEqual({ esenciales: [], intermedios: [] });
    expect(vo.contrataciones).toEqual([]);
    expect(vo.clima).toEqual([]);
    expect(vo.equipo).toHaveLength(7);
    expect(vo.secciones).toHaveLength(5);
  });

  it('no sobreescriu num, fechaActa ni firmasSeleccionadas si ja existeixen', () => {
    const vo = migrateVO({ num: 4, fechaActa: '2026-01-15', firmasSeleccionadas: ['promotor'] });
    expect(vo.num).toBe(4);
    expect(vo.fechaActa).toBe('2026-01-15');
    expect(vo.firmasSeleccionadas).toEqual(['promotor']);
  });

  it('migra les fotos planes antigues d\'estadoObra a una ubicació', () => {
    const vo = migrateVO({ estadoObra: { fotos: [{ id: 'f1' }, { id: 'f2' }] } });
    expect(vo.estadoObra.fotos).toBeUndefined();
    expect(vo.estadoObra.ubicacions).toHaveLength(1);
    expect(vo.estadoObra.ubicacions[0].fotos).toEqual([{ id: 'f1' }, { id: 'f2' }]);
  });

  it('no crea cap ubicació si no hi havia fotos antigues', () => {
    const vo = migrateVO({ estadoObra: { fotos: [] } });
    expect(vo.estadoObra.ubicacions).toEqual([]);
  });

  it('normalitza el camp "resp" d\'una entrada: string -> array, buit -> []', () => {
    const vo = migrateVO({
      secciones: [{ id: 's1', codigo: '1', titulo: 'T', temas: [{
        id: 't1', titulo: 'Tema',
        entradas: [
          { id: 'e1', resp: 'Jan' },
          { id: 'e2' },
          { id: 'e3', resp: ['Jan', 'Xavier'] },
        ],
      }] }],
    });
    const [e1, e2, e3] = vo.secciones[0].temas[0].entradas;
    expect(e1.resp).toEqual(['Jan']);
    expect(e2.resp).toEqual([]);
    expect(e3.resp).toEqual(['Jan', 'Xavier']);
  });

  it('calcula "nueva" a partir de actaNum NOMÉS si encara no està definit', () => {
    const vo = migrateVO({
      num: 3,
      secciones: [{ id: 's1', codigo: '1', titulo: 'T', temas: [{
        id: 't1', titulo: 'Tema',
        entradas: [
          { id: 'e1', actaNum: 3 },           // sense 'nueva' definit -> es calcula
          { id: 'e2', actaNum: 1 },           // sense 'nueva' definit -> es calcula
          { id: 'e3', actaNum: 3, nueva: false }, // ja definit -> es respecta encara que actaNum coincideixi
        ],
      }] }],
    });
    const [e1, e2, e3] = vo.secciones[0].temas[0].entradas;
    expect(e1.nueva).toBe(true);
    expect(e2.nueva).toBe(false);
    expect(e3.nueva).toBe(false);
  });

  it('assigna un grup per defecte als rols antics que no en tenen', () => {
    const vo = migrateVO({
      equipo: [{ id: 'r1', nombre: 'CONTRATISTA (EC)', personas: [] }],
    });
    expect(vo.equipo[0].grupo).toBe('CONTRATISTA');
  });

  it('respecta el grup ja existent d\'un rol', () => {
    const vo = migrateVO({
      equipo: [{ id: 'r1', nombre: 'CONTRATISTA (EC)', grupo: 'GRUP PERSONALITZAT', personas: [] }],
    });
    expect(vo.equipo[0].grupo).toBe('GRUP PERSONALITZAT');
  });

  it('migra temes antics en format pla (amb "seccion") a l\'estructura de seccions', () => {
    const vo = migrateVO({
      temas: [{ id: 't1', seccion: '2', entradas: [{ id: 'e1', texto: 'Alguna cosa' }] }],
    });
    const seccioInstal = vo.secciones.find(s => s.codigo === '2');
    expect(seccioInstal.temas).toHaveLength(1);
    expect(seccioInstal.temas[0].entradas[0].fin).toBe('');
  });

  it('és idempotent: aplicar-la dues vegades no canvia el resultat', () => {
    const primer = migrateVO(null);
    const segon = migrateVO(primer);
    expect(segon).toEqual(primer);
  });
});
