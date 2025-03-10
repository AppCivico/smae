import { describe, expect, it } from 'vitest';
import titleCase from './titleCase.ts';

describe('titleCase', () => {
  it('deve retornar o título formatado', () => {
    const titulo = 'título do livro';
    const resultado = titleCase(titulo);
    expect(resultado).toBe('Título do Livro');
  });

  it('deve retornar o título formatado', () => {
    const titulo = 'TÍTULO DO LIVRO';
    const resultado = titleCase(titulo);
    expect(resultado).toBe('Título do Livro');
  });

  it('deve retornar o título formatado', () => {
    const titulo = 'Título do livro';
    const resultado = titleCase(titulo);
    expect(resultado).toBe('Título do Livro');
  });

  it('deve retornar o título formatado', () => {
    const resultado = titleCase('');
    expect(resultado).toBe('');
  });
});
