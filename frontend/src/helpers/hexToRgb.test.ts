import {
  describe,
  expect,
  it,
} from 'vitest';
import hexToRgb from './hexToRgb';

describe('hexToRgb', () => {
  it('deve converter HEX para RGB', () => {
    const cor = '#ff00ff';
    const corRgb = hexToRgb(cor);

    expect(corRgb).toEqual([255, 0, 255]);
  });

  it('deve retornar nulo para uma cor inválida', () => {
    const cor = '#ff00ff00';
    const corRgb = hexToRgb(cor);

    expect(corRgb).toBeNull();
  });
});
