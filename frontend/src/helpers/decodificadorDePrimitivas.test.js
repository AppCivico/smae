import { describe, expect, it } from 'vitest';
import decodificadorDePrimitivas from './decodificadorDePrimitivas.ts';

const tests = [
  {
    test: 'true',
    expected: true,
  },
  {
    test: 'false',
    expected: false,
  },
  {
    test: '42',
    expected: 42,
  },
  {
    test: '3.14',
    expected: 3.14,
  },
  {
    test: '0',
    expected: 0,
  },
  {
    test: 'null',
    expected: null,
  },
  {
    test: 'undefined',
    expected: undefined,
  },
];

describe('decodificadorDePrimitivas', () => {
  it.each(tests)('converte "$test" para "$expected"', ({ test, expected }) => {
    expect(decodificadorDePrimitivas(test)).toEqual(expected);
  });
});
