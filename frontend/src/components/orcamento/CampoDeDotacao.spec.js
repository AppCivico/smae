import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

import { useDotaçãoStore } from '@/stores/dotacao.store.ts';

import CampoDeDotacao from './CampoDeDotacao.vue';

let mockCurrentRoute = { params: {} };

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockCurrentRoute),
}));

function montar(props = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn });

  const wrapper = mount(CampoDeDotacao, {
    props: {
      modelValue: '',
      parametrosParaValidacao: { portfolio_id: 1 },
      ...props,
    },
    global: {
      plugins: [pinia],
      stubs: { FormErrorsList: true },
    },
  });

  return { wrapper, dotacaoStore: useDotaçãoStore() };
}

describe('CampoDeDotacao e o ano de referência', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentRoute = { params: { ano: '2025' } };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sem a prop, usa o ano da rota, como nos demais módulos', () => {
    const { dotacaoStore } = montar();

    expect(dotacaoStore.getDotaçãoSegmentos).toHaveBeenCalledWith('2025');
  });

  it('com a prop, usa o ano informado em vez do da rota', () => {
    mockCurrentRoute = { params: {} };

    const { dotacaoStore } = montar({ anoDeReferencia: 2024 });

    expect(dotacaoStore.getDotaçãoSegmentos).toHaveBeenCalledWith(2024);
  });

  it('não descarta a validação do SOF ao montar', () => {
    const { wrapper } = montar();

    expect(wrapper.emitted('update:respostasof')).toBeUndefined();
  });

  it('ao trocar o ano, descarta a validação do SOF e carrega os segmentos do novo ano', async () => {
    mockCurrentRoute = { params: {} };
    const { wrapper, dotacaoStore } = montar({ anoDeReferencia: 2024 });

    await wrapper.setProps({ anoDeReferencia: 2023 });
    await flushPromises();

    expect(wrapper.emitted('update:respostasof')).toEqual([[{}]]);
    expect(dotacaoStore.getDotaçãoSegmentos).toHaveBeenLastCalledWith(2023);
  });
});
