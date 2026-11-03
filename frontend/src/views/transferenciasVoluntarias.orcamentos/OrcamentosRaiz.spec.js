import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { defineComponent, h } from 'vue';

import { useAuthStore } from '@/stores/auth.store.ts';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

import OrcamentosRaiz from './OrcamentosRaiz.vue';

const anoCorrente = new Date().getUTCFullYear();

let propsDoFilho;

// simula uma tela de inclusão, que expõe o slot do ano de referência
const Filho = defineComponent({
  props: {
    anoDeReferencia: { type: Number, default: null },
    distribuicoesDeRecursos: { type: Array, default: null },
    parametrosParaValidacao: { type: Object, default: () => ({}) },
    podeEditar: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    propsDoFilho = props;
    return () => h('form', slots['ano-de-referencia']?.());
  },
});

const RouterViewStub = defineComponent({
  setup(_, { slots }) {
    return () => slots.default?.({ Component: Filho });
  },
});

function montar({ podeEditar = true, anoDaTransferencia = null } = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn });

  useAuthStore().temPermissãoPara = () => podeEditar;
  useTransferenciasVoluntariasStore().emFoco = { id: 320, ano: anoDaTransferencia };

  return mount(OrcamentosRaiz, {
    props: { transferenciaId: 320 },
    global: {
      plugins: [pinia],
      stubs: {
        RouterView: RouterViewStub,
        ErrorComponent: true,
      },
    },
  });
}

describe('OrcamentosRaiz de transferências', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propsDoFilho = undefined;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('busca as distribuições da transferência e as repassa às rotas filhas', () => {
    montar();

    const distribuicaoRecursosStore = useDistribuicaoRecursosStore();

    expect(distribuicaoRecursosStore.buscarTudo)
      .toHaveBeenCalledWith({ transferencia_id: 320 });
    expect(propsDoFilho.distribuicoesDeRecursos).toBe(distribuicaoRecursosStore.lista);
  });

  it('valida no SOF pela transferência', () => {
    montar();

    expect(propsDoFilho.parametrosParaValidacao).toEqual({ transferencia_id: 320 });
  });

  it.each([true, false])('repassa a permissão de edição (%s)', (podeEditar) => {
    montar({ podeEditar });

    expect(propsDoFilho.podeEditar).toBe(podeEditar);
  });

  describe('ano de referência na inclusão', () => {
    it('oferece do ano corrente até o ano da transferência', () => {
      const wrapper = montar({ anoDaTransferencia: anoCorrente - 2 });

      const anos = wrapper.findAll('#ano-de-referencia option')
        .map((x) => Number(x.element.value));

      expect(anos).toEqual([anoCorrente, anoCorrente - 1, anoCorrente - 2]);
    });

    it('oferece os últimos cinco anos quando a transferência não tem ano', () => {
      const wrapper = montar();

      expect(wrapper.findAll('#ano-de-referencia option')).toHaveLength(6);
    });

    it('começa no ano corrente', () => {
      const wrapper = montar({ anoDaTransferencia: anoCorrente - 3 });

      expect(propsDoFilho.anoDeReferencia).toBe(anoCorrente);
      expect(wrapper.find('#ano-de-referencia').element.value).toBe(String(anoCorrente));
    });

    it('repassa o ano escolhido sem recriar a tela', async () => {
      const wrapper = montar({ anoDaTransferencia: anoCorrente - 3 });
      const propsAntes = propsDoFilho;

      await wrapper.find('#ano-de-referencia').setValue(String(anoCorrente - 2));

      expect(propsDoFilho).toBe(propsAntes);
      expect(propsDoFilho.anoDeReferencia).toBe(anoCorrente - 2);
    });

    it('volta ao ano corrente ao trocar de transferência', async () => {
      const wrapper = montar({ anoDaTransferencia: anoCorrente - 5 });
      await wrapper.find('#ano-de-referencia').setValue(String(anoCorrente - 4));

      // a nova transferência só começa no ano corrente; o ano anterior não existe nela
      useTransferenciasVoluntariasStore().emFoco = { id: 317, ano: anoCorrente };
      await wrapper.setProps({ transferenciaId: 317 });

      expect(propsDoFilho.anoDeReferencia).toBe(anoCorrente);
      expect(wrapper.find('#ano-de-referencia').element.value).toBe(String(anoCorrente));
      expect(useDistribuicaoRecursosStore().buscarTudo)
        .toHaveBeenLastCalledWith({ transferencia_id: 317 });
    });
  });
});
