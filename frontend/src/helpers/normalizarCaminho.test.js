import { describe, expect, it } from 'vitest';

import normalizarCaminho from './normalizarCaminho.ts';

describe('normalizarCaminho', () => {
  it('deve retornar "/" quando a entrada for vazia, nula ou indefinida', () => {
    expect(normalizarCaminho('')).toBe('/');
    expect(normalizarCaminho(null)).toBe('/');
    expect(normalizarCaminho(undefined)).toBe('/');
  });

  it('deve garantir a barra final', () => {
    expect(normalizarCaminho('/caminho/para/arquivo')).toBe('/caminho/para/arquivo/');
  });

  it('deve remover "./" inicial', () => {
    expect(normalizarCaminho('./caminho/para/arquivo/')).toBe('caminho/para/arquivo/');
  });

  it('deve combinar ambas as normalizações', () => {
    expect(normalizarCaminho('./caminho/para/arquivo')).toBe('caminho/para/arquivo/');
  });
});
