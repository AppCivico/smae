import { describe, expect, it } from 'vitest';
import type { RouteLocation } from 'vue-router';
import type { Tipos } from './tiparPropsDeRota';
import tiparPropsDeRota from './tiparPropsDeRota';

const tests = [
  {
    route: { params: { id: '1' } },
    expected: { id: 1 },
  },
  {
    route: { params: { id: '2' } },
    expected: { id: 2 },
  },
  {
    route: { params: {} },
    expected: {},
  },
  {
    route: { params: { id: '1', nome: 'teste' } },
    expected: { id: 1, nome: 'teste' },
  },
  {
    route: { params: { concluidas: 'true' } },
    expected: { concluidas: true },
  },
  {
    route: { params: { filtro: 'null' } },
    expected: { filtro: null },
  },
  {
    route: { params: { termo: 'undefined' } },
    expected: { termo: undefined },
  },
  {
    route: { params: { termo: 'undefined' } },
    expected: { termo: 'undefined' },
    tipos: { termo: 'string' },
  },
  {
    route: { params: { valor: '1024' } },
    expected: { valor: '1024' },
    tipos: { valor: 'string' },
  },
  {
    route: { params: { valor: 'true' } },
    expected: { valor: NaN },
    tipos: { valor: 'number' },
  },
  {
    route: { params: { concluidas: 1 } },
    expected: { concluidas: true },
    tipos: { concluidas: 'boolean' },
  },
];

describe('tiparPropsDeRota', () => {
  it.each(tests)('deve tipar $route como $expected', ({ route, expected, tipos }) => {
    expect(tiparPropsDeRota(route as unknown as RouteLocation, tipos as unknown as Tipos))
      .toStrictEqual(expected);
  });
});
