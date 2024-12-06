import {
  describe,
  expect,
  it,
} from 'vitest';
import prepararRotaDeEscape from './prepararRotaDeEscape.ts';

describe('prepararRotaDeEscape', () => {
  it('Ignora rotas vazias', () => {
    const rota = { };
    const expected = null;

    expect(prepararRotaDeEscape(rota)).toStrictEqual(expected);
  });

  it('Ignora rotas sem nome', () => {
    const rota = { query: { parameter: 'value' } };
    const expected = null;

    expect(prepararRotaDeEscape(rota)).toStrictEqual(expected);
  });

  it('Aceita a rotaDeEscape sobrescrita como segundo parâmetro da função', () => {
    const rota = { name: 'foo' };
    const rotaDeEscape = 'bar';
    const expected = { name: 'bar' };

    expect(prepararRotaDeEscape(rota, { name: rotaDeEscape })).toStrictEqual(expected);
  });

  it('Aceita a rotaDeEscape configurada no meta', () => {
    const rota = { name: 'foo', meta: { rotaDeEscape: 'bar' } };
    const expected = { name: 'bar' };

    expect(prepararRotaDeEscape(rota)).toStrictEqual(expected);
  });

  it('Aceita a rotaDeEscape sobrescrita como segundo parâmetro da função, ignorando a configurada no meta', () => {
    const rota = { name: 'foo', meta: { rotaDeEscape: 'bar' } };
    const rotaDeEscape = 'foo2';
    const expected = { name: 'foo2' };

    expect(prepararRotaDeEscape(rota, { name: rotaDeEscape })).toStrictEqual(expected);
  });

  it('Mantém os parâmetros e query da rota corrente', () => {
    const rota = {
      name: 'foo',
      meta: { rotaDeEscape: 'bar' },
      query: {
        parameter: 'value',
      },
      params: {
        id: 1,
      },
    };
    const expected = { name: 'bar', params: { id: 1 }, query: { parameter: 'value' } };

    expect(prepararRotaDeEscape(rota)).toStrictEqual(expected);
  });

  it('Permite a sobrescrita da rota de escape com seus parâmetros e query via query string, mas a exclui do resultado final', () => {
    const rota = {
      name: 'foo',
      meta: { rotaDeEscape: 'bar' },
      query: {
        parameter: 'value',
        escape: {
          name: 'foo2',
          query: {
            parameter: 'value2',
          },
        },
      },
    };
    const expected = { name: 'foo2', query: { parameter: 'value2' } };

    expect(prepararRotaDeEscape(rota)).toStrictEqual(expected);
  });

  it('Combina a query string da rota corrente com a da rota de escape', () => {
    const rota = {
      path: '/variaveis/4908',
      name: 'variaveisEditar',
      params: { variavelId: '4908' },
      meta: { rotaDeEscape: 'variaveisListar' },
      query: {
        escape: {
          query: {
            ipp: 100, ordem_coluna: 'codigo', ordem_direcao: 'asc', pagina: 1, palavra_chave: 'foobar',
          },
        },
      },
    };

    const expected = {
      name: 'variaveisListar',
      params: { variavelId: '4908' },
      query: {
        ipp: 100, ordem_coluna: 'codigo', ordem_direcao: 'asc', pagina: 1, palavra_chave: 'foobar',
      },
    };
    expect(prepararRotaDeEscape(rota)).toStrictEqual(expected);
  });

  it('Combina a rota de escape com os parametros fornecidos', () => {
    const rota = {
      path: '/variaveis/4908',
      name: 'variaveisEditar',
      params: { variavelId: '4908' },
      meta: { rotaDeEscape: 'variaveisListar' },
      query: {
        escape: {
          name: 'foo2',
          query: {
            ipp: 100, ordem_coluna: 'codigo', ordem_direcao: 'asc', pagina: 1, palavra_chave: 'foobar',
          },
        },
      },
    };

    const expected = {
      name: 'variaveisItem',
      params: { variavelId: 79 },
      query: {
        ipp: 100, ordem_coluna: 'codigo', ordem_direcao: 'asc', pagina: 1, palavra_chave: 'foobar', foo: 'bar',
      },
    };
    expect(prepararRotaDeEscape(rota, { name: 'variaveisItem', params: { variavelId: 79 }, query: { foo: 'bar' } })).toStrictEqual(expected);
  });
});
