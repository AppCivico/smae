import { describe, expect, it } from 'vitest';
import type { RouteLocation } from 'vue-router';
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
];

describe('tiparPropsDeRota', () => {
  it.each(tests)('deve tipar $route como $expected', ({ route, expected }) => {
    expect(tiparPropsDeRota(route as unknown as RouteLocation)).toStrictEqual(expected);
  });
});
