import { describe, it, expect } from 'vitest';
import { obraRow, rowToObra } from '../App.jsx';

const obraCompleta = {
  id: 'obra1', nombre: 'Casa Pla', cliente: 'Client X', direccion: 'C/ Major 1',
  responsable: 'Alex Pla', estado: 'estructura', tipo: 'residencial',
  diasVisita: [1, 3], emplazamiento: 'Girona', propiedad: 'Prop SL',
  proyectista: 'Studio Y', direccionObra: 'C/ Obra 2', constructora: 'Constru SL',
  deoFirmante: 'Xavier Pla', numActaSeq: 5, fechaCFO: '2026-01-01',
  fases: ['f1'], disciplinas: ['arq'], lotes: ['l1'],
  hormigonModo: 'bloques', hormigonBloques: [{ id: 'b1' }],
  creadaEn: '2025-01-01T00:00:00.000Z',
  climaLat: 41.9, climaLon: 2.8, geoLat: 41.9, geoLon: 2.8,
  logoClienteB64: 'abc123',
};

describe('obraRow', () => {
  it('serialitza l\'obra sencera dins de "data", amb user_id i updated_at', () => {
    const row = obraRow(obraCompleta, 'user1');
    expect(row.id).toBe('obra1');
    expect(row.user_id).toBe('user1');
    expect(typeof row.updated_at).toBe('string');
    expect(row.data.nombre).toBe('Casa Pla');
    expect(row.data.climaLat).toBe(41.9);
    expect(row.data.climaLon).toBe(2.8);
    expect(row.data.hormigonBloques).toEqual([{ id: 'b1' }]);
  });

  it('aplica defaults quan falten hormigonModo/hormigonBloques/fechaCFO', () => {
    const row = obraRow({ id: 'obra2' }, 'user1');
    expect(row.data.hormigonModo).toBe('unico');
    expect(row.data.hormigonBloques).toEqual([]);
    expect(row.data.fechaCFO).toBe('');
  });
});

describe('rowToObra', () => {
  it('reconstrueix l\'obra a partir d\'una fila sense mòduls', () => {
    const row = obraRow(obraCompleta, 'user1');
    const obra = rowToObra(row, {});
    expect(obra.id).toBe('obra1');
    expect(obra.nombre).toBe('Casa Pla');
    expect(obra.estado).toBe('estructura');
    expect(obra.climaLat).toBe(41.9);
    expect(obra.hormigonBloques).toEqual([{ id: 'b1' }]);
    expect(obra.incidencias).toEqual([]);
    expect(obra.actaVO).toBeNull();
    expect(obra.materiales).toEqual([]);
    expect(obra.seguimientoCQ).toEqual([]);
  });

  it('normalitza els estats antics (en_curso/pendiente) en llegir', () => {
    const rowAntiga = { id: 'obra3', data: { estado: 'en_curso' } };
    expect(rowToObra(rowAntiga, {}).estado).toBe('estructura');

    const rowPendent = { id: 'obra4', data: { estado: 'pendiente' } };
    expect(rowToObra(rowPendent, {}).estado).toBe('proyecto');
  });

  it('no toca els estats ja migrats', () => {
    const row = { id: 'obra5', data: { estado: 'acabada' } };
    expect(rowToObra(row, {}).estado).toBe('acabada');
  });

  it('munta els mòduls (incidencias, acta VO, notas, calidad) a partir del batch carregat', () => {
    const row = { id: 'obra6', data: {} };
    const obra = rowToObra(row, {
      incidencias: [{ data: { id: 'i1' } }],
      actas_vo: [{ data: { num: 2 } }],
      notas: [{ data: { id: 'n1' } }],
      calidad: [{ data: { materiales: [{ id: 'm1' }], seguimientoCQ: [{ id: 's1' }] } }],
    });
    expect(obra.incidencias).toEqual([{ id: 'i1' }]);
    expect(obra.actaVO).toEqual({ num: 2 });
    expect(obra.apuntes).toEqual([{ id: 'n1' }]);
    expect(obra.materiales).toEqual([{ id: 'm1' }]);
    expect(obra.seguimientoCQ).toEqual([{ id: 's1' }]);
  });

  it('round-trip: obraRow + rowToObra conserva els camps principals de l\'obra', () => {
    const row = obraRow(obraCompleta, 'user1');
    const obra = rowToObra(row, {});
    for (const camp of ['nombre', 'cliente', 'direccion', 'responsable', 'estado', 'tipo', 'diasVisita', 'climaLat', 'climaLon', 'logoClienteB64']) {
      expect(obra[camp]).toEqual(obraCompleta[camp]);
    }
  });
});
