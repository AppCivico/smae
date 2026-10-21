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

function rotuloDoCampo(wrapper, nome) {
  const campo = wrapper.find(`input[name="${nome}"]:not([type="hidden"])`);

  return wrapper.find(`label[for="${campo.attributes('id')}"]`).text();
}

describe('FiltroDeListagemDeObras', () => {
  beforeEach(() => {
    mockCurrentRoute = { query: {} };
  });

  describe('número do contrato', () => {
    it('exibe o campo com o rótulo "Número do contrato"', () => {
      expect(rotuloDoCampo(montar(), 'numero_contrato')).toBe('Número do contrato');
    });

    it('preenche o campo com o valor da query string', () => {
      mockCurrentRoute = { query: { numero_contrato: 'CT-045/2024' } };

      expect(montar().find('input[name="numero_contrato"]').element.value)
        .toBe('CT-045/2024');
    });
  });

  describe('código da obra', () => {
    it('exibe o campo com o rótulo "Código da obra"', () => {
      expect(rotuloDoCampo(montar(), 'codigo')).toBe('Código da obra');
    });

    it('preenche o campo com o valor da query string', () => {
      mockCurrentRoute = { query: { codigo: 'OB-0001' } };

      expect(montar().find('input[name="codigo"]').element.value)
        .toBe('OB-0001');
    });
  });

  it('exibe número do contrato, código da obra e retornar arquivados na mesma linha, nessa ordem', () => {
    const wrapper = montar();
    const linha = wrapper.find('input[name="numero_contrato"]').element.closest('.flexwrap');

    const nomesNaLinha = [...linha.querySelectorAll('input:not([type="hidden"])')]
      .map((campo) => campo.name);

    expect(nomesNaLinha).toEqual(['numero_contrato', 'codigo', 'retornar_arquivados']);
  });
});
