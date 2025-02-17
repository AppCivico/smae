import {
  describe,
  expect,
  it,
} from 'vitest';
import rgbToHex from './rgbToHex';

describe('rgbToHex', () => {
  it('deve converter RGB para HEX, a partir de uma lista de canais', () => {
    const cor: [number, number, number] = [255, 0, 255];
    const corHex = rgbToHex(cor);

    expect(corHex).toEqual('#ff00ff');
  });

  it('deve converter RGB para HEX, a partir de uma notação `rgb(0,0,0)`', () => {
    const cor = 'rgb(255, 0, 255)';
    const corHex = rgbToHex(cor);

    expect(corHex).toEqual('#ff00ff');
  });

  it('deve retornar nulo para uma cor inválida', () => {
    const cor = 'rgb(255, 0, 255, 0)';
    const corHex = rgbToHex(cor);

    expect(corHex).toBeNull();
  });
});
