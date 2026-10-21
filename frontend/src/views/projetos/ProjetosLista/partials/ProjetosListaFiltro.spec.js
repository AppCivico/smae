import { createTestingPinia } from '@pinia/testing';
import { shallowMount } from '@vue/test-utils';
import {
  describe, expect, it, vi,
} from 'vitest';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import ProjetosListaFiltro from './ProjetosListaFiltro.vue';

function montar() {
  return shallowMount(ProjetosListaFiltro, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
    },
  }).findComponent(FiltroParaPagina);
}

function todosOsCampos(filtro) {
  return filtro.props('formulario')
    .reduce((acc, grupo) => ({ ...acc, ...grupo.campos }), {});
}

describe('ProjetosListaFiltro', () => {
  it('oferece busca por número do contrato', () => {
    const filtro = montar();

    expect(todosOsCampos(filtro).numero_contrato).toMatchObject({ tipo: 'search' });
    expect(filtro.props('schema').fields.numero_contrato.spec.label)
      .toBe('Número do contrato');
  });

  it('oferece busca por código do projeto', () => {
    const filtro = montar();

    expect(todosOsCampos(filtro).codigo).toMatchObject({ tipo: 'search' });
    expect(filtro.props('schema').fields.codigo.spec.label)
      .toBe('Código do projeto');
  });

  it('agrupa número do contrato, código do projeto e retornar arquivados na mesma linha, nessa ordem', () => {
    const linha = montar().props('formulario')
      .find((grupo) => 'numero_contrato' in grupo.campos);

    expect(Object.keys(linha.campos))
      .toEqual(['numero_contrato', 'codigo', 'retornar_arquivados']);
  });
});
