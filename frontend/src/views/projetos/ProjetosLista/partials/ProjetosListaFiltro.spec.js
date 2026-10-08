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
  });
}

describe('ProjetosListaFiltro', () => {
  it('oferece busca por número do contrato', () => {
    const filtro = montar().findComponent(FiltroParaPagina);

    const campos = filtro.props('formulario')
      .reduce((acc, grupo) => ({ ...acc, ...grupo.campos }), {});

    expect(campos.codigo).toMatchObject({ tipo: 'search' });
    expect(filtro.props('schema').fields.codigo.spec.label)
      .toBe('Número do contrato');
  });
});
