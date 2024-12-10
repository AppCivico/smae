import {
  describe,
  expect,
  it,
  test,
} from 'vitest';
import haDuplicatasNaLista from './haDuplicatasNaLista.ts';

describe('haDuplicatasNaLista', () => {
  it('Deve estourar um erro para configurações conflitantes', () => {
    const array = [];

    expect(() => haDuplicatasNaLista(array, { apenas: 'foo', exceto: 'bar' })).toThrow();
  });

  it('Deve retornar `false` para uma lista vazia', () => {
    const array = [];

    expect(haDuplicatasNaLista(array)).toBe(false);
  });

  describe('Identifica duplicatas em lista de primitivas', () => {
    test.each([
      {
        array: [1, 2, 3, 4, 5],
        expected: false,
      },
      {
        array: [1, 2, 3, 4, 5, 3],
        expected: true,
      },
      {
        array: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
        expected: false,
      },
      {
        array: ['Alice', 'Bob', '', 'Charlie', 'David', 'Eve', ''],
        expected: true,
      },
      {
        array: [null, undefined, null],
        expected: true,
      },
      {
        array: [null, undefined],
        expected: false,
      },
    ])('haDuplicatasNaLista($array) -> $expected', ({ array, expected }) => {
      expect(haDuplicatasNaLista(array)).toBe(expected);
    });
  });

  describe('Identifica duplicatas em lista de objetos', () => {
    test.each([
      {
        array: [
          { id: 1, name: 'Alice', surname: 'Brown' },
          { id: 2, name: 'Bob', surname: 'Jones' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 4, name: 'David', surname: 'Jones' },
          { id: 5, name: 'Eve', surname: 'Miller' },
          { id: 6, name: 'Charlie', surname: 'Smith' },
        ],
        expected: false,
      },
      {
        array: [
          { id: 1, name: 'Alice', surname: 'Brown' },
          { id: 2, name: 'Bob', surname: 'Jones' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 4, name: 'David', surname: 'Jones' },
          { id: 5, name: 'Eve', surname: 'Miller' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
        ],
        expected: true,
      },
      {
        array: [
          [1, 'Alice', 'Brown'],
          [2, 'Bob', 'Jones'],
          [3, 'Charlie', 'Smith'],
          [4, 'David', 'Jones'],
          [5, 'Eve', 'Miller'],
          [3, 'Charlie', 'Smith'],
        ],
        expected: true,
      },
    ])('haDuplicatasNaLista($array) -> $expected', ({ array, expected }) => {
      expect(haDuplicatasNaLista(array)).toBe(expected);
    });
  });

  describe('Considera a ordem de valores em cada item numa listas de objetos', () => {
    test.each([
      {
        array: [
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 3, surname: 'Smith', name: 'Charlie' },
        ],
        expected: false,
      },
      {
        array: [
          [3, 'Charlie', 'Smith'],
          [3, 'Smith', 'Charlie'],
        ],
        expected: false,
      },
    ])('haDuplicatasNaLista($array) -> $expected', ({ array, expected }) => {
      expect(haDuplicatasNaLista(array)).toBe(expected);
    });
  });

  describe('Considera o tipo de cada item ao avaliar as duplicatas', () => {
    test.each([
      {
        array: [0, false, null, undefined, ''],
        expected: false,
      },
      {
        array: ['0', 2, 0, 4, 5, 3],
        expected: false,
      },
      {
        array: [
          1,
          { id: 2, name: 'Bob', surname: 'Jones' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 4, name: 'David', surname: 'Jones' },
          'Eve',
          { id: 3, name: 'Charlie', surname: 'Smith' },
        ],
        expected: true,
      },
    ])('haDuplicatasNaLista($array) -> $expected', ({ array, expected }) => {
      expect(haDuplicatasNaLista(array)).toBe(expected);
    });
  });

  describe('Permite limitar a comparação à propriedades específicas', () => {
    test.each([
      {
        describe: 'apenas uma propriedade',
        array: [
          { id: 1, name: 'Alice', surname: 'Brown' },
          { id: 2, name: 'Bob', surname: 'Jones' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 4, name: 'David', surname: 'Jones' },
          { id: 5, name: 'Eve', surname: 'Miller' },
          { id: 6, name: 'Charlie', surname: 'Miller' },
        ],
        params: { apenas: 'name' },
        expected: true,
      },
      {
        describe: 'apenas duas propriedades',
        array: [
          { id: 1, name: 'Alice', surname: 'Brown' },
          { id: 2, name: 'Bob', surname: 'Jones' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 4, name: 'David', surname: 'Jones' },
          { id: 5, name: 'Eve', surname: 'Miller' },
          { id: 6, name: 'Charlie', surname: 'Smith' },
        ],
        params: { apenas: ['name', 'surname'] },
        expected: true,
      },
      {
        describe: 'apenas uma propriedade inexistente',
        array: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' },
          { id: 4, name: 'David' },
          { id: 5, name: 'Eve' },
        ],
        params: { apenas: 'surname' },
        expected: true,
      },
      {
        describe: 'propriedade inexistente numa lista de primitivas',
        array: [
          1,
          2,
          3,
          4,
          5,
        ],
        params: { apenas: 'surname' },
        expected: true,
      },
      {
        describe: 'índice que aponta para uma primitiva',
        array: [
          [1, 'Alice'],
          [2, 'Bob'],
          [3, 'Charlie'],
          [4, 'David'],
          [5, 'Eve'],
          [6, 'Charlie'],
        ],
        params: { apenas: 1 },
        expected: true,
      },
      {
        describe: 'índice que aponta para um objeto',
        array: [
          [{ id: 1 }], [{ name: 'Alice' }],
          [{ id: 2 }], [{ name: 'Bob' }],
          [{ id: 3 }], [{ name: 'Charlie' }],
          [{ id: 4 }], [{ name: 'David' }],
          [{ id: 5 }], [{ name: 'Eve' }],
          [{ id: 6 }], [{ name: 'Charlie' }],
        ],
        params: { apenas: 1 },
        expected: true,
      },
    ])('$describe', ({ array, params, expected }) => {
      expect(haDuplicatasNaLista(array, params)).toBe(expected);
    });
  });

  describe('Permite excluir propriedades específicas da comparação', () => {
    test.each([
      {
        array: [
          { id: 1, name: 'Alice', surname: 'Brown' },
          { id: 2, name: 'Bob', surname: 'Jones' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 1, name: 'David', surname: 'Jones' },
          { id: 2, name: 'Eve', surname: 'Miller' },
          { name: 'Charlie', surname: 'Miller' },
        ],
        params: { exceto: ['id', 'surname'] },
        expected: true,
      },
      {
        array: [
          { id: 1, name: 'Alice', surname: 'Brown' },
          { id: 2, name: 'Bob', surname: 'Jones' },
          { id: 3, name: 'Charlie', surname: 'Smith' },
          { id: 1, name: 'David', surname: 'Jones' },
          { id: 2, name: 'Eve', surname: 'Miller' },
        ],
        params: { exceto: ['id', 'surname'] },
        expected: false,
      },
      {
        array: [
          [1, 'Alice', 'Brown'],
          [2, 'Bob', 'Jones'],
          [3, 'Charlie', 'Smith'],
          [1, 'David', 'Jones'],
          [2, 'Eve', 'Miller'],
        ],
        params: { exceto: [0, 2] },
        expected: false,
      },
    ])('haDuplicatasNaLista($array, $params) -> $expected', ({ array, params, expected }) => {
      expect(haDuplicatasNaLista(array, params)).toBe(expected);
    });
  });
});
