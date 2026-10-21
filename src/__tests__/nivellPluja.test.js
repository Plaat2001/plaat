import { describe, it, expect } from 'vitest';
import { nivellPluja } from '../App.jsx';

describe('nivellPluja', () => {
  it('classifica els llindars en català (per defecte)', () => {
    expect(nivellPluja(0)).toBe('sense pluja');
    expect(nivellPluja(2)).toBe('pluja feble');
    expect(nivellPluja(10)).toBe('pluja moderada');
    expect(nivellPluja(10.1)).toBe('pluja forta');
  });

  it('classifica els mateixos llindars en castellà quan esCA=false', () => {
    expect(nivellPluja(0, false)).toBe('sin lluvia');
    expect(nivellPluja(2, false)).toBe('lluvia leve');
    expect(nivellPluja(10, false)).toBe('lluvia moderada');
    expect(nivellPluja(15, false)).toBe('lluvia fuerte');
  });

  it('tracta valors negatius, buits o no numèrics com a "sense pluja"', () => {
    expect(nivellPluja(-5)).toBe('sense pluja');
    expect(nivellPluja('')).toBe('sense pluja');
    expect(nivellPluja(undefined)).toBe('sense pluja');
    expect(nivellPluja('abc')).toBe('sense pluja');
  });

  it('accepta valors en format string (parseFloat)', () => {
    expect(nivellPluja('3.5')).toBe('pluja moderada');
  });
});
