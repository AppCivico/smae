import {
  afterEach, describe, expect, it, vi,
} from 'vitest';

import obterPropriedadeNoObjeto from './obterPropriedadeNoObjeto.ts';

describe('obterPropriedadeNoObjeto', () => {
  const consoleSpyOnWarning = vi.spyOn(console, 'warn');

  afterEach(() => {
    consoleSpyOnWarning.mockReset();
  });

  it('deve obter uma propriedade de um objeto simples', () => {
    const objeto = { nome: 'Alice', idade: 30 };
    const resultado = obterPropriedadeNoObjeto('nome', objeto);
    expect(resultado).toBe('Alice');
  });

  it('deve obter uma propriedade aninhada de um objeto', () => {
    const objeto = { equipe: { pessoa: { humana: { nome: 'Alice' } } } };
    const resultado = obterPropriedadeNoObjeto('equipe.pessoa.humana.nome', objeto);
    expect(resultado).toBe('Alice');
  });

  it('deve retornar objeto para uma propriedade inexistente', () => {
    const objeto = { nome: 'Alice', idade: 30 };
    const resultado = obterPropriedadeNoObjeto('altura', objeto);
    expect(resultado).toStrictEqual({ nome: 'Alice', idade: 30 });
  });

  it('deve retornar o objeto pai para uma propriedade aninhada inexistente', () => {
    const objeto = { equipe: { pessoa: { humana: { nome: 'Alice' } } } };
    const resultado = obterPropriedadeNoObjeto('equipe.pessoa.humana.altura', objeto);
    expect(resultado).toStrictEqual({ nome: 'Alice' });
  });

  it('não deve se confundir com propriedades homônimas no caso de um nível inexistente', () => {
    const objeto = { equipe: { humana: { nome: 'Alice' } } };
    const resultado = obterPropriedadeNoObjeto('equipe.pessoa.humana.nome', objeto);
    expect(resultado).toStrictEqual({ humana: { nome: 'Alice' } });
  });

  it('deve lidar com objetos vazios', () => {
    const objeto = {};
    const resultado = obterPropriedadeNoObjeto('nome', objeto);
    expect(resultado).toStrictEqual({});
  });

  it('deve lidar com objetos nulos', () => {
    const objeto = null;
    const resultado = obterPropriedadeNoObjeto('nome', objeto);
    expect(resultado).toStrictEqual(null);
  });

  it('deve alertar para caminhos inválidos', () => {
    const objeto = { nome: 'Alice', idade: 30 };
    const resultado = obterPropriedadeNoObjeto('nome.idade', objeto);
    expect(consoleSpyOnWarning).toHaveBeenCalledOnce();
    expect(consoleSpyOnWarning).toHaveBeenLastCalledWith('Propriedade "idade" não encontrada em:', 'Alice');
    expect(resultado).toBe('Alice');
  });

  it('deve permitir ignorar alertas de propriedades não encontradas', () => {
    const objeto = { nome: 'Alice', idade: 30 };
    const resultado = obterPropriedadeNoObjeto('altura', objeto, true);
    expect(consoleSpyOnWarning).not.toHaveBeenCalled();
    expect(resultado).toStrictEqual({ nome: 'Alice', idade: 30 });
  });
});
