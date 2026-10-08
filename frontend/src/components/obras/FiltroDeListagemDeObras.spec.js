import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import FiltroDeListagemDeObras from './FiltroDeListagemDeObras.vue';

let mockCurrentRoute = { query: {} };

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockCurrentRoute),
}));

function montar() {
  return mount(FiltroDeListagemDeObras, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
    },
  });
}

describe('FiltroDeListagemDeObras', () => {
  beforeEach(() => {
    mockCurrentRoute = { query: {} };
  });

  describe('número do contrato', () => {
    it('exibe o campo com o rótulo "Número do contrato"', () => {
      const wrapper = montar();
      const campo = wrapper.find('input[name="codigo"]');

      expect(campo.exists()).toBe(true);
      expect(wrapper.find(`label[for="${campo.attributes('id')}"]`).text())
        .toBe('Número do contrato');
    });

    it('preenche o campo com o valor da query string', () => {
      mockCurrentRoute = { query: { codigo: 'CT-045/2024' } };

      const wrapper = montar();

      expect(wrapper.find('input[name="codigo"]').element.value)
        .toBe('CT-045/2024');
    });
  });
});
