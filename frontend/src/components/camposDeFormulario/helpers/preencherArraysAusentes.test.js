import {
  array, number, object, string,
} from 'yup';
import { describe, expect, it } from 'vitest';

import schema from './buscarDadosFromYup.test-files/schema';
import preencherArraysAusentes from './preencherArraysAusentes.ts';

describe('preencherArraysAusentes', () => {
  it('preenche com array vazio os campos do tipo array ausentes na carga', () => {
    const resultado = preencherArraysAusentes(schema, {});

    expect(resultado).toEqual({ acompanhamentos: [], risco: [] });
  });

  it('não sobrescreve um campo do tipo array que já tenha valor', () => {
    const resultado = preencherArraysAusentes(schema, { acompanhamentos: [{ id: 1 }] });

    expect(resultado.acompanhamentos).toEqual([{ id: 1 }]);
    expect(resultado.risco).toEqual([]);
  });

  it('preserva um campo do tipo array explicitamente definido como null', () => {
    const resultado = preencherArraysAusentes(schema, { acompanhamentos: null });

    expect(resultado.acompanhamentos).toBeNull();
    expect(resultado.risco).toEqual([]);
  });

  it('preserva campos que não são arrays', () => {
    const resultado = preencherArraysAusentes(schema, { numero: '123' });

    expect(resultado.numero).toBe('123');
  });

  it('preenche arrays ausentes dentro dos itens de um campo do tipo array', () => {
    const schemaComArrayAninhado = object().shape({
      orcamento_config: array().of(object().shape({
        ano_referencia: number(),
        execucao_disponivel_meses: array(),
      })),
    });

    const resultado = preencherArraysAusentes(schemaComArrayAninhado, {
      orcamento_config: [{ ano_referencia: 2024 }],
    });

    expect(resultado.orcamento_config).toEqual([
      { ano_referencia: 2024, execucao_disponivel_meses: [] },
    ]);
  });

  it('preenche arrays ausentes dentro de um campo do tipo objeto', () => {
    const schemaComObjetoAninhado = object().shape({
      endereco: object().shape({
        tags: array(),
      }),
    });

    const resultado = preencherArraysAusentes(schemaComObjetoAninhado, {
      endereco: { logradouro: 'Rua X' },
    });

    expect(resultado.endereco).toEqual({ logradouro: 'Rua X', tags: [] });
  });

  it('não cria um campo do tipo objeto que esteja ausente na carga', () => {
    const schemaComObjetoAninhado = object().shape({
      endereco: object().shape({
        tags: array(),
      }),
    });

    const resultado = preencherArraysAusentes(schemaComObjetoAninhado, {});

    expect(resultado.endereco).toBeUndefined();
  });

  it('não quebra quando os itens de um array não são objetos', () => {
    const schemaDeArrayDeStrings = object().shape({
      tags: array().of(string()),
    });

    const resultado = preencherArraysAusentes(schemaDeArrayDeStrings, { tags: ['a', 'b'] });

    expect(resultado.tags).toEqual(['a', 'b']);
  });
});
