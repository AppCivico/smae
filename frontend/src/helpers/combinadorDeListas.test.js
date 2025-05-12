import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import combinadorDeListas from './combinadorDeListas.ts';

describe('combinadorDeListas', () => {
  const consoleSpyOnError = vi.spyOn(console, 'error');
  const consoleSpyOnWarning = vi.spyOn(console, 'warn');

  afterEach(() => {
    consoleSpyOnError.mockReset();
    consoleSpyOnWarning.mockReset();
  });

  it('deve combinar um array de strings com um separador', () => {
    const result = combinadorDeListas(['maçã', 'banana', 'cereja'], ', ');
    expect(result).toBe('maçã, banana, cereja');
  });

  it('deve combinar um array de números com um separador', () => {
    const result = combinadorDeListas([1, 2, 3], '-');
    expect(result).toBe('1-2-3');
  });

  it('deve combinar um array de objetos usando uma propriedade especificada', () => {
    const result = combinadorDeListas(
      [{ nome: 'Alice' }, { nome: 'Bob' }, { nome: 'Charlie' }],
      ', ',
      'nome',
    );
    expect(result).toBe('Alice, Bob, Charlie');
  });

  it('deve combinar um array de objetos usando uma propriedade aninhada', () => {
    const result = combinadorDeListas(
      [
        { equipe: { pessoa: { humana: { nome: 'Alice' } } } },
        { equipe: { pessoa: { humana: { nome: 'Bob' } } } },
        { equipe: { pessoa: { humana: { nome: 'Charlie' } } } },
      ],
      ', ',
      'equipe.pessoa.humana.nome',
    );
    expect(result).toBe('Alice, Bob, Charlie');
  });

  it('deve retornar uma string vazia para um array vazio', () => {
    const result = combinadorDeListas([], ', ');
    expect(result).toBe('');
  });

  it('deve lidar com objetos sem a propriedade especificada', () => {
    const result = combinadorDeListas(
      [{ nome: 'Alice' }, { age: 30 }, { nome: 'Charlie' }],
      ', ',
      'nome',
    );

    expect(result).toBe('Alice, {"age":30}, Charlie');
  });

  it('deve lidar com arrays com tipos mistos', () => {
    const result = combinadorDeListas(
      ['maçã', { nome: 'banana' }, { fruta: 'cereja' }],
      ', ',
      'nome',
    );

    expect(result).toBe('maçã, banana, {"fruta":"cereja"}');
  });

  it('deve usar a string ", " como separador padrão se nenhum for fornecido', () => {
    const result = combinadorDeListas(['a', 'b', 'c']);
    expect(result).toBe('a, b, c');
  });

  it('deve retornar uma string vazia se o array não for um array', () => {
    expect(combinadorDeListas(null, ', ')).toBe('');
    expect(combinadorDeListas(undefined, ', ')).toBe('');
    expect(combinadorDeListas('string', ', ')).toBe('');
    expect(combinadorDeListas(123, ', ')).toBe('');
  });

  it('deve avisar se a propriedade especificada não for uma string', () => {
    const result = combinadorDeListas(
      [{ nome: 'Alice' }, { nome: 'Bob' }, { nome: 'Charlie' }],
      ', ',
      123,
    );

    expect(consoleSpyOnError).toHaveBeenCalledOnce();
    expect(consoleSpyOnError).toHaveBeenLastCalledWith('O caminho da propriedade deve ser uma string');

    expect(result).toBe('');
  });

  it('deve avisar se o separador não for uma string', () => {
    const result = combinadorDeListas(
      ['maçã', 'banana', 'cereja'],
      123,
    );

    expect(consoleSpyOnError).toHaveBeenCalledOnce();
    expect(consoleSpyOnError).toHaveBeenLastCalledWith('O separador deve ser uma string');

    expect(result).toBe('maçã, banana, cereja');
  });
});
