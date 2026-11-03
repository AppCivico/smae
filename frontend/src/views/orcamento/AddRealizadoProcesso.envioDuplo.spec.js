import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

import AddRealizadoProcesso from './AddRealizadoProcesso.vue';

const push = vi.fn();
const mockCurrentRoute = {
  params: { transferenciaId: 317 },
  meta: { entidadeMãe: 'TransferenciasVoluntarias', rotaDeEscape: 'TransferenciaOrcamentoRealizado' },
  query: {},
};

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRoute: vi.fn(() => mockCurrentRoute),
  useRouter: vi.fn(() => ({ push })),
}));

// preenche um mês válido, como se o usuário o tivesse informado
const ItensRealizadoStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  mounted() {
    this.$emit('update:modelValue', [{ mes: 3, valor_empenho: 1000, valor_liquidado: 500 }]);
  },
  template: '<div />',
};

function montar() {
  return mount(AddRealizadoProcesso, {
    props: { anoDeReferencia: 2026, parametrosParaValidacao: { transferencia_id: 317 } },
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      directives: { ScrollLockDebug: {} },
      mocks: { $route: mockCurrentRoute },
      stubs: {
        CheckClose: true,
        ItensRealizado: ItensRealizadoStub,
        ListaDeCompartilhamentos: true,
        SmaeFieldsetSubmit: true,
        TituloDaPagina: true,
      },
    },
  });
}

const esperar = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// valida o processo no SOF e escolhe a dotação, o que exibe os meses
async function prepararEnvio(wrapper) {
  useDotaçãoStore().getDotaçãoRealizadoProcesso.mockResolvedValue([{
    dotacao: '16.10.12.361.3010.2.873.33903900.00',
    empenho_liquido: '5000.00',
    valor_liquidado: '5000.00',
  }]);

  await wrapper.find('input[name="processo"]').setValue('6016.2024/0000001-1');
  await wrapper.find('form button[type="button"]').trigger('click');
  await vi.waitFor(() => expect(wrapper.find('input[name="dotacao"]').exists()).toBe(true));
  await wrapper.find('input[name="dotacao"]').setValue(true);
  await flushPromises();
}

describe('AddRealizadoProcesso e o envio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('ignora um segundo envio enquanto o primeiro está em andamento', async () => {
    const wrapper = montar();
    const store = useOrcamentosStore();
    store.insertOrcamentoRealizado.mockImplementation(() => esperar(50).then(() => true));

    await prepararEnvio(wrapper);
    wrapper.find('form').trigger('submit');
    await esperar(5);
    wrapper.find('form').trigger('submit');
    await esperar(100);
    await flushPromises();

    expect(store.insertOrcamentoRealizado).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('não envia quando o liquidado supera o empenhado', async () => {
    const wrapper = montar();
    const store = useOrcamentosStore();
    await prepararEnvio(wrapper);

    wrapper.findComponent(ItensRealizadoStub)
      .vm.$emit('update:modelValue', [{ mes: 3, valor_empenho: 500, valor_liquidado: 1000 }]);
    await flushPromises();
    await wrapper.find('form').trigger('submit');
    await esperar(20);
    await flushPromises();

    expect(store.insertOrcamentoRealizado).not.toHaveBeenCalled();
  });

  it('permanece no formulário quando o envio falha', async () => {
    const wrapper = montar();
    const store = useOrcamentosStore();
    store.insertOrcamentoRealizado.mockRejectedValue(new Error('Já existe um registro'));

    await prepararEnvio(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(store.insertOrcamentoRealizado).toHaveBeenCalled());
    await flushPromises();

    expect(push).not.toHaveBeenCalled();
  });

  it('permite tentar de novo depois de uma falha', async () => {
    const wrapper = montar();
    const store = useOrcamentosStore();
    store.insertOrcamentoRealizado.mockRejectedValueOnce(new Error('400')).mockResolvedValueOnce(true);

    await prepararEnvio(wrapper);
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(store.insertOrcamentoRealizado).toHaveBeenCalledTimes(1));
    await flushPromises();

    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(store.insertOrcamentoRealizado).toHaveBeenCalledTimes(2));
    await flushPromises();

    expect(push).toHaveBeenCalledTimes(1);
  });
});
