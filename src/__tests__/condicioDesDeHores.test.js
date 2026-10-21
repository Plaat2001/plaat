import { describe, it, expect } from 'vitest';
import { condicioDesDeHores } from '../App.jsx';

describe('condicioDesDeHores', () => {
  it('retorna "lluvia" si la precipitació total supera 0.2mm, sigui com sigui el cel', () => {
    expect(condicioDesDeHores(0.3, [0, 0, 0, 0])).toBe('lluvia');
    expect(condicioDesDeHores(5, [3, 3, 3, 3])).toBe('lluvia');
  });

  it('mai retorna "lluvia" si la precipitació sumada és 0, encara que el codi horari ho suggereixi', () => {
    expect(condicioDesDeHores(0, [61, 63, 80])).not.toBe('lluvia');
  });

  it('retorna "nublado" quan més de la meitat de les hores laborals són codi 2 o 3', () => {
    expect(condicioDesDeHores(0, [2, 3, 3, 0])).toBe('nublado');
  });

  it('retorna "soleado" quan la meitat o menys de les hores són núvol (2/3)', () => {
    expect(condicioDesDeHores(0, [2, 0, 0, 0])).toBe('soleado');
  });

  it('un array buit d\'hores (sense dades) es considera "soleado"', () => {
    expect(condicioDesDeHores(0, [])).toBe('soleado');
  });

  it('el llindar de precipitació és estrictament > 0.2, no >=', () => {
    expect(condicioDesDeHores(0.2, [0])).not.toBe('lluvia');
  });
});
