import { describe, expect, it } from 'vitest';

import buscarDadosDoYup from './buscarDadosDoYup.ts';
import resultadoEsperado from './buscarDadosFromYup.test-files/resultadoEsperado';
import resultadoEsperadoAninhado from './buscarDadosFromYup.test-files/resultadoEsperadoAninhado';
import schema from './buscarDadosFromYup.test-files/schema';

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
});
