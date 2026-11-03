import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

import CampoDeDotacao from '@/components/orcamento/CampoDeDotacao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

import AddRealizado from './AddRealizado.vue';
import AddRealizadoNota from './AddRealizadoNota.vue';
import AddRealizadoProcesso from './AddRealizadoProcesso.vue';

let mockCurrentRoute;

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRoute: vi.fn(() => mockCurrentRoute),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

function montar(componente, props = {}, stubs = {}) {
  return mount(componente, {
    props: {
      parametrosParaValidacao: { portfolio_id: 1 },
      ...props,
    },
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      components: { TituloDaPagina },
      directives: { ScrollLockDebug: {} },
      mocks: { $route: mockCurrentRoute },
      stubs: {
        CampoDeDistribuicaoDeRecurso: true,
        CampoDeDotacao: true,
        CheckClose: true,
        ItensRealizado: true,
        ListaDeCompartilhamentos: true,
        SmaeFieldsetSubmit: true,
        ...stubs,
      },
    },
  });
}

const anoExibido = (wrapper) => wrapper.find('h3 strong').text();

describe.each([
  ['AddRealizado', AddRealizado],
  ['AddRealizadoProcesso', AddRealizadoProcesso],
  ['AddRealizadoNota', AddRealizadoNota],
])('%s e o ano de referência', (_, componente) => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentRoute = {
      params: { ano: '2025' },
      meta: { entidadeMãe: 'projeto' },
      query: {},
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sem a prop, usa o ano da rota, como nos demais módulos', () => {
    const wrapper = montar(componente);

    expect(anoExibido(wrapper)).toBe('2025');
  });

  it('com a prop, usa o ano informado em vez do da rota', () => {
    mockCurrentRoute.params = {};

    const wrapper = montar(componente, { anoDeReferencia: 2024 });

    expect(anoExibido(wrapper)).toBe('2024');
  });

  it('acompanha a troca de ano sem ser recriada', async () => {
    mockCurrentRoute.params = {};
    const wrapper = montar(componente, { anoDeReferencia: 2024 });

    await wrapper.setProps({ anoDeReferencia: 2023 });

    expect(anoExibido(wrapper)).toBe('2023');
  });
});

describe.each([
  ['AddRealizado', AddRealizado],
  ['AddRealizadoProcesso', AddRealizadoProcesso],
  ['AddRealizadoNota', AddRealizadoNota],
])('%s e o subtítulo', (_, componente) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('em transferências, exibe o título da página em vez de ano e código', () => {
    mockCurrentRoute = {
      params: {},
      meta: {
        entidadeMãe: 'TransferenciasVoluntarias',
        título: () => 'Execução orçamentária da transferência 12/2024',
      },
      query: {},
    };

    const wrapper = montar(componente, { anoDeReferencia: 2024 });

    expect(wrapper.find('h3').text()).toBe('Execução orçamentária da transferência 12/2024');
  });

  it('sem item pai nos demais módulos, exibe só o ano, sem traços soltos', () => {
    mockCurrentRoute = {
      params: { ano: '2025' },
      meta: { entidadeMãe: 'projeto' },
      query: {},
    };

    const wrapper = montar(componente);

    expect(wrapper.find('h3').text()).toBe('2025');
  });
});

describe('detalhes por tela', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentRoute = {
      params: {},
      meta: { entidadeMãe: 'TransferenciasVoluntarias' },
      query: {},
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('AddRealizado repassa o ano ao campo de dotação', async () => {
    const wrapper = montar(AddRealizado, { anoDeReferencia: 2024 });

    expect(wrapper.findComponent(CampoDeDotacao).props('anoDeReferencia')).toBe(2024);

    await wrapper.setProps({ anoDeReferencia: 2023 });

    expect(wrapper.findComponent(CampoDeDotacao).props('anoDeReferencia')).toBe(2023);
  });

  it('AddRealizado só oferece o vínculo depois de validada a dotação', async () => {
    const wrapper = montar(AddRealizado, {
      anoDeReferencia: 2024,
      distribuicoesDeRecursos: [{ id: 7, nome: 'Reforma da UBS' }],
    });
    const campoDeVinculo = () => wrapper.findComponent({ name: 'CampoDeDistribuicaoDeRecurso' });

    expect(campoDeVinculo().exists()).toBe(false);

    wrapper.findComponent(CampoDeDotacao).vm.$emit('update:respostasof', { loading: true });
    await flushPromises();

    expect(campoDeVinculo().exists()).toBe(false);

    wrapper.findComponent(CampoDeDotacao).vm.$emit('update:respostasof', { empenho_liquido: 10 });
    await flushPromises();

    expect(campoDeVinculo().exists()).toBe(true);
  });

  it('AddRealizadoProcesso consulta o SOF no ano escolhido', async () => {
    const wrapper = montar(AddRealizadoProcesso, {
      anoDeReferencia: 2024,
      parametrosParaValidacao: { transferencia_id: 320 },
    });
    const dotacaoStore = useDotaçãoStore();
    dotacaoStore.getDotaçãoRealizadoProcesso.mockResolvedValue([]);

    await wrapper.setProps({ anoDeReferencia: 2023 });
    await wrapper.find('input[name="processo"]').setValue('6016.2024/0000001-1');
    await wrapper.find('form button[type="button"]').trigger('click');

    // a validação do yup leva alguns ciclos antes da consulta ao SOF
    await vi.waitFor(() => expect(dotacaoStore.getDotaçãoRealizadoProcesso)
      .toHaveBeenCalledWith(expect.anything(), 2023, { transferencia_id: 320 }));
  });

  it('AddRealizadoNota acompanha o ano da nota com o ano escolhido', async () => {
    const wrapper = montar(AddRealizadoNota, { anoDeReferencia: 2024 });

    expect(wrapper.find('input[name="nota_ano"]').element.value).toBe('2024');

    await wrapper.setProps({ anoDeReferencia: 2023 });
    await flushPromises();

    expect(wrapper.find('input[name="nota_ano"]').element.value).toBe('2023');
  });

  it('AddRealizadoNota envia `nota_ano` como texto, como exige a API', async () => {
    // preenche um mês válido, exigido pelo schema
    const ItensRealizado = {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      mounted() {
        this.$emit('update:modelValue', [{ mes: 3, valor_empenho: 1000, valor_liquidado: 500 }]);
      },
      template: '<div />',
    };
    const wrapper = montar(AddRealizadoNota, { anoDeReferencia: 2024 }, { ItensRealizado });
    const dotacaoStore = useDotaçãoStore();
    const orcamentosStore = useOrcamentosStore();
    dotacaoStore.getDotaçãoRealizadoNota.mockResolvedValue({
      nota_empenho: '000123/2024',
      dotacao: '16.10.12.361.3010.2.873.33903900.00',
    });
    orcamentosStore.insertOrcamentoRealizado.mockResolvedValue(true);

    await wrapper.find('input[name="nota_empenho"]').setValue('123');
    // o primeiro envio valida a nota no SOF; o segundo grava
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(dotacaoStore.getDotaçãoRealizadoNota).toHaveBeenCalled());
    await flushPromises();
    await wrapper.find('form').trigger('submit');
    await vi.waitFor(() => expect(orcamentosStore.insertOrcamentoRealizado).toHaveBeenCalled());

    expect(orcamentosStore.insertOrcamentoRealizado.mock.calls[0][0])
      .toMatchObject({ nota_ano: '2024', nota_empenho: '000123/2024' });
  });
});
