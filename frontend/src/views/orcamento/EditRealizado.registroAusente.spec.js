import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

import { useAlertStore } from '@/stores/alert.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

import EditRealizado from './EditRealizado.vue';

const replace = vi.fn();
let mockCurrentRoute;

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRoute: vi.fn(() => mockCurrentRoute),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace })),
  onBeforeRouteLeave: vi.fn(),
}));

function montar(OrcamentoRealizado = {}, prepararStore = () => {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: { Orcamentos: { OrcamentoRealizado, emFoco: {} } },
  });
  const orcamentosStore = useOrcamentosStore(pinia);
  // em `main.ts`, um plugin dá a rota corrente às stores
  orcamentosStore.route = mockCurrentRoute;
  prepararStore(orcamentosStore);

  return mount(EditRealizado, {
    props: { parametrosParaValidacao: { transferencia_id: 317 } },
    global: {
      plugins: [pinia],
      directives: { ScrollLockDebug: {} },
      mocks: { $route: mockCurrentRoute },
      stubs: {
        CheckClose: true,
        ItensRealizado: true,
        ListaDeCompartilhamentos: true,
        SmaeFieldsetSubmit: true,
        TituloDaPagina: true,
      },
    },
  });
}

describe('EditRealizado sem o registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentRoute = {
      params: { transferenciaId: 317, id: '99' },
      meta: {
        entidadeMãe: 'TransferenciasVoluntarias',
        rotaDeEscape: 'TransferenciaOrcamentoRealizado',
      },
      query: {},
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('em transferências, avisa e volta para a listagem quando o id não existe', async () => {
    montar({ 2024: [{ id: 1, ano_referencia: 2024, dotacao: '16.10' }] });
    await flushPromises();

    expect(useAlertStore().error).toHaveBeenCalledWith('Execução orçamentária não encontrada.');
    expect(replace).toHaveBeenCalledWith({ name: 'TransferenciaOrcamentoRealizado', query: {} });
  });

  it('volta para a listagem quando a busca falha, sem repetir o alerta do `requestS`', async () => {
    montar({}, (store) => {
      store.buscarTodosOsOrcamentosRealizados.mockRejectedValue(new Error('500'));
    });
    await flushPromises();

    expect(useAlertStore().error).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith({ name: 'TransferenciaOrcamentoRealizado', query: {} });
  });

  it('com o registro presente, não sai da tela', async () => {
    mockCurrentRoute.params.id = '1';
    montar({ 2024: [{ id: 1, ano_referencia: 2024, dotacao: '16.10.12.361.3010.2.873.33903900.00' }] });
    await flushPromises();

    expect(replace).not.toHaveBeenCalled();
    expect(useAlertStore().error).not.toHaveBeenCalled();
  });
});
