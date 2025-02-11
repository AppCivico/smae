import {
  describe,
  expect,
  it,
} from 'vitest';
import gerarCoresIntermediarias from './gerarCoresIntermediarias';

describe('gerarCoresIntermediarias', () => {
  it('deve gerar cores intermediárias a partir de HEXA', () => {
    const corInicial = '#FF0000';
    const corFinal = '#0000FF';
    const quantidadeCores = 3;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
    );

    expect(coresIntermediarias).toEqual(['#bf0040', '#800080', '#4000bf']);
  });

  it('deve gerar cores intermediárias a partir de HEXA com formato de saída RGB', () => {
    const corInicial = '#FF0000';
    const corFinal = '#0000FF';
    const quantidadeCores = 3;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
      { format: 'rgb' },
    );

    expect(coresIntermediarias).toEqual(['rgb(191, 0, 64)', 'rgb(128, 0, 128)', 'rgb(64, 0, 191)']);
  });

  it('deve gerar cores intermediárias a partir de RGB', () => {
    const corInicial = 'rgb(255, 0, 0)';
    const corFinal = 'rgb(0, 0, 255)';
    const quantidadeCores = 3;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
    );

    expect(coresIntermediarias).toEqual(['rgb(191, 0, 64)', 'rgb(128, 0, 128)', 'rgb(64, 0, 191)']);
  });

  it('deve gerar cores intermediárias a partir de RGB com formato de saída HEX', () => {
    const corInicial = 'rgb(255, 0, 0)';
    const corFinal = 'rgb(0, 0, 255)';
    const quantidadeCores = 3;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
      { format: 'hex' },
    );

    expect(coresIntermediarias).toEqual(['#bf0040', '#800080', '#4000bf']);
  });

  it('deve gerar cores intermediárias a partir de HSL pelo caminho curto', () => {
    const corInicial = 'hsl(0, 60% ,40%)';
    const corFinal = 'hsl(240,40%,60%)';
    const quantidadeCores = 3;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
    );

    expect(coresIntermediarias).toEqual([
      'hsl(330, 55%, 45%)',
      'hsl(300, 50%, 50%)',
      'hsl(270, 45%, 55%)',
    ]);
  });

  it('deve gerar cores intermediárias a partir de HSL pelo caminho longo', () => {
    const corInicial = 'hsl(0, 60% ,40%)';
    const corFinal = 'hsl(240,40%,60%)';
    const quantidadeCores = 3;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
      {
        format: 'hsl',
        huePath: 'long',
      },
    );

    expect(coresIntermediarias).toEqual([
      'hsl(60, 55%, 45%)',
      'hsl(120, 50%, 50%)',
      'hsl(180, 45%, 55%)',
    ]);
  });

  it('deve retornar array vazio se a quantidade de cores for zero', () => {
    const corInicial = '#FF0000';
    const corFinal = '#0000FF';
    const quantidadeCores = 0;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
      {
        format: 'hex',
      },
    );

    expect(coresIntermediarias).toEqual([]);
  });

  it.each([
    ['rgb(255, 0)', 'rgb(0, 0, 255)'],
    ['invalidColor', '#0000FF'],
    ['#FF0000', 'invalidColor'],
    ['foo', 'bar'],
  ])('deve gerar uma lista vazia em caso de valores de cor inválidos', (corInicial, corFinal) => {
    const quantidadeCores = 3;

    const coresIntermediarias = gerarCoresIntermediarias(
      corInicial,
      corFinal,
      quantidadeCores,
      {
        format: 'hex',
      },
    );

    expect(coresIntermediarias).toEqual([]);
  });
});
