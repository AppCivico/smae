import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { reactive } from 'vue';

import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';

import EdicoesEmLoteObrasSelecionar from './EdicoesEmLoteObrasSelecionar.vue';

const idsPorPortfolio: Record<string, number[]> = {
  1: [11, 12, 13],
  2: [21, 22],
  3: [31, 32, 33],
};

const mockRoute = reactive({
  query: { portfolio_id: '1' } as Record<string, string>,
  meta: { tipoDeAcoesEmLote: 'teste' },
});

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
}));

const mockRequestS = {
  get: vi.fn(async (url: string, params: Record<string, string> = {}) => {
    const ids = idsPorPortfolio[params.portfolio_id] || [];

    if (url.endsWith('/projeto-mdo/ids')) {
      return { ids };
    }

    return {
      linhas: ids.map((id) => ({ id, nome: `Obra ${id}` })),
      total_registros: ids.length,
      paginas: 1,
      pagina_corrente: 1,
      tem_mais: false,
      token_paginacao: null,
    };
  }),
};

const montar = () => mount(EdicoesEmLoteObrasSelecionar, {
  global: {
    plugins: [createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      plugins: [() => ({ requestS: mockRequestS })],
    })],
    directives: {
      selecionarMultiplasOpcoes: {},
    },
    stubs: {
      MigalhasDePão: true,
      CabecalhoDePagina: true,
      MenuPaginacao: true,
      SmaeTable: true,
      SmaeLink: true,
      FiltroParaRegistros: { template: '<div><slot /></div>' },
      SmaeFieldsetSubmit: { template: '<div><slot /></div>' },
    },
  },
});

const botao = (envelope: ReturnType<typeof montar>, texto: string) => envelope
  .findAll('button')
  .filter((elemento) => elemento.text().startsWith(texto))[0];

const idsSelecionados = () => useEdicoesEmLoteStore('teste').idsSelecionados;

describe('EdicoesEmLoteObrasSelecionar', () => {
  afterEach(() => {
    mockRoute.query = { portfolio_id: '1' };
    vi.clearAllMocks();
  });

  it('marca todas as obras do filtro atual após o filtro ser alterado', async () => {
    const envelope = montar();
    await flushPromises();

    await botao(envelope, 'marcar todas').trigger('click');
    await flushPromises();

    expect(idsSelecionados()).toEqual([11, 12, 13]);

    await botao(envelope, 'desmarcar').trigger('click');

    mockRoute.query = { portfolio_id: '2' };
    await flushPromises();

    await botao(envelope, 'marcar todas').trigger('click');
    await flushPromises();

    expect(idsSelecionados()).toEqual([21, 22]);
  });

  it('permite marcar todas quando o novo filtro tem o mesmo total de obras já selecionadas', async () => {
    const envelope = montar();
    await flushPromises();

    await botao(envelope, 'marcar todas').trigger('click');
    await flushPromises();

    mockRoute.query = { portfolio_id: '3' };
    await flushPromises();

    expect(botao(envelope, 'marcar todas').attributes('aria-disabled')).toBe('false');

    await botao(envelope, 'marcar todas').trigger('click');
    await flushPromises();

    expect(idsSelecionados()).toEqual([31, 32, 33]);
  });
});
