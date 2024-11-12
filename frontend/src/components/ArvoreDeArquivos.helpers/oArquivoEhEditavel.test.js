import { expect, test } from 'vitest';
import testarPermissoes from './oArquivoEhEditavel.ts';

test.each([
  { apenasLeitura: false, podeEditar: undefined, expected: true },
  { apenasLeitura: false, podeEditar: true, expected: true },
  { apenasLeitura: false, podeEditar: false, expected: false },
  { apenasLeitura: true, podeEditar: undefined, expected: false },
  { apenasLeitura: true, podeEditar: true, expected: false },
  { apenasLeitura: true, podeEditar: false, expected: false },
])('testarPermissoes(%apenasLeitura, %podeEditar) -> %expected', ({ apenasLeitura, podeEditar, expected }) => {
  expect(testarPermissoes(apenasLeitura, podeEditar)).toBe(expected);
});
