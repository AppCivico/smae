/* eslint-disable no-underscore-dangle */
import { describe, expect, it } from 'vitest';

import buscarDadosDoYup from './buscarDadosDoYup.ts';
import resultadoEsperado from './buscarDadosFromYup.test-files/resultadoEsperado';
import resultadoEsperadoAninhado from './buscarDadosFromYup.test-files/resultadoEsperadoAninhado';
import schema from './buscarDadosFromYup.test-files/schema';
import schemaComLazy from './buscarDadosFromYup.test-files/schemaComLazy';

describe('buscarDadosDoYup', () => {
  it('deve extrair corretamente os dados do schema do Yup', () => {
    const resultado = buscarDadosDoYup(schema, 'detalhamento');

    expect(resultado).toEqual(resultadoEsperado);
  });

  it('deve extrair corretamente os dados de um campo aninhado', () => {
    const resultado = buscarDadosDoYup(schema, 'acompanhamentos[1].encaminhamento');

    expect(resultado).toEqual(resultadoEsperadoAninhado);
  });

  it('deve retornar null se o campo não existir no schema', () => {
    const resultado = buscarDadosDoYup(schema, 'campo_inexistente');

    expect(resultado).toBeNull();
  });

  it('deve extrair corretamente os dados de um lazy schema', () => {
    const resultado = buscarDadosDoYup(schemaComLazy, 'campo_condicional');

    // Deve retornar o schema resolvido, não o lazy wrapper
    expect(resultado).toBeDefined();
    expect(resultado.type).toBe('string');

    // Deve extrair a validação max
    const maxTest = resultado.tests?.find((test) => test.OPTIONS?.name === 'max');
    expect(maxTest).toBeDefined();
    expect(maxTest.OPTIONS.params.max).toBe(1000);
  });

  it('deve lidar gracefully com lazy schema que falha ao resolver', () => {
    // Mesmo com erro na resolução, não deve quebrar a aplicação
    const resultado = buscarDadosDoYup(schemaComLazy, 'campo_com_dependencia');

    // Deve retornar o lazy wrapper original quando _resolve() falhar
    expect(resultado).toBeDefined();
    expect(typeof resultado._resolve).toBe('function');
  });

  it('deve funcionar normalmente com campos não-lazy', () => {
    const resultadoString = buscarDadosDoYup(schemaComLazy, 'campo_normal');
    expect(resultadoString).toBeDefined();
    expect(resultadoString.type).toBe('string');

    const resultadoMixed = buscarDadosDoYup(schemaComLazy, 'campo_mixed');
    expect(resultadoMixed).toBeDefined();
    // Mixed não tem validação _resolve
    expect(resultadoMixed._resolve).toBeUndefined();
  });
});
