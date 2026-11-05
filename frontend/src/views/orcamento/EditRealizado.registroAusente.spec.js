import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { reactive } from 'vue';

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

  // em projetos, o ano vem da rota, e a store guarda o erro no lugar da lista
  it.each([
    ['um erro', { error: 'Falha na busca' }, false],
    ['outro valor que não uma lista', { loading: true }, true],
  ])('volta para a listagem quando o ano guarda %s', async (_, doAno, avisa) => {
    mockCurrentRoute = {
      params: { ano: '2025', id: '1', projetoId: 5 },
      meta: { entidadeMãe: 'projeto', rotaDeEscape: 'projetoOrcamento' },
      query: {},
    };

    montar({ 2025: doAno });
    await flushPromises();

    expect(replace).toHaveBeenCalledWith({ name: 'projetoOrcamento', query: {} });
    if (avisa) {
      expect(useAlertStore().error).toHaveBeenCalledWith('Execução orçamentária não encontrada.');
    } else {
      expect(useAlertStore().error).not.toHaveBeenCalled();
    }
  });

  it('com o registro presente, não sai da tela', async () => {
    mockCurrentRoute.params.id = '1';
    montar({ 2024: [{ id: 1, ano_referencia: 2024, dotacao: '16.10.12.361.3010.2.873.33903900.00' }] });
    await flushPromises();

    expect(replace).not.toHaveBeenCalled();
    expect(useAlertStore().error).not.toHaveBeenCalled();
  });

  describe('reaproveitada para outro registro pela rota', () => {
    const dotacao = '16.10.12.361.3010.2.873.33903900.00';
    const doAno = {
      2024: [
        { id: 1, ano_referencia: 2024, dotacao },
        { id: 2, ano_referencia: 2024, dotacao },
      ],
    };

    beforeEach(() => {
      // a rota reativa permite que a troca de parâmetro dispare o watcher
      mockCurrentRoute = reactive({ ...mockCurrentRoute, params: { transferenciaId: 317, id: '1' } });
    });

    it('carrega o novo registro', async () => {
      montar(doAno);
      await flushPromises();
      const orcamentosStore = useOrcamentosStore();

      expect(orcamentosStore.emFoco.id).toBe(1);

      mockCurrentRoute.params.id = '2';
      await flushPromises();

      expect(orcamentosStore.buscarTodosOsOrcamentosRealizados).toHaveBeenCalledTimes(2);
      expect(orcamentosStore.emFoco.id).toBe(2);
      expect(replace).not.toHaveBeenCalled();
    });

    it('não sai da tela quando a carga do registro anterior falha depois', async () => {
      let falharAnterior;
      montar(doAno, (store) => {
        store.buscarTodosOsOrcamentosRealizados
          .mockImplementationOnce(() => new Promise((_, reject) => {
            falharAnterior = () => reject(new Error('500'));
          }));
      });
      const orcamentosStore = useOrcamentosStore();

      mockCurrentRoute.params.id = '2';
      await flushPromises();

      expect(orcamentosStore.emFoco.id).toBe(2);

      falharAnterior();
      await flushPromises();

      expect(replace).not.toHaveBeenCalled();
      expect(orcamentosStore.emFoco.id).toBe(2);
    });
  });

  it('associa o rótulo "Execução associada a" ao seu campo', async () => {
    mockCurrentRoute.params.id = '1';
    const wrapper = montar({
      2024: [{
        id: 1,
        ano_referencia: 2024,
        dotacao: '16.10.12.361.3010.2.873.33903900.00',
        distribuicao_recurso: { id: 7, nome: 'Reforma da UBS' },
      }],
    });
    await flushPromises();

    const rotulo = wrapper.findAll('label').find((x) => x.text() === 'Execução associada a');
    const campo = wrapper.find(`#${rotulo.attributes('for')}`);

    expect(campo.element.value).toBe('Reforma da UBS');
    expect(wrapper.findAll('#execucao-associada-a')).toHaveLength(1);
  });
});
