import { mount } from '@vue/test-utils';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import SmaeCNPJCampo from './SmaeCNPJCampo.vue';

function montar(props = {}, options = {}) {
  return mount(SmaeCNPJCampo, { props, ...options });
}

describe('SmaeCNPJCampo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('renderização do campo', () => {
    it('renderiza um único <input>', async () => {
      const wrapper = montar({ name: 'cnpj' });

      const campos = wrapper.findAll('[data-test="campo"]');
      expect(campos).toHaveLength(1);
      expect(campos[0].element.tagName).toBe('INPUT');
    });

    it('inicia vazio quando não há valor', async () => {
      const wrapper = montar({ name: 'cnpj' });

      const campo = wrapper.get('[data-test="campo"]');
      expect(campo.element.value).toBe('');
    });
  });

  describe('modo autônomo (VeeValidate via useField interno)', () => {
    it('exibe o valor mascarado e emite apenas os dígitos ao digitar', async () => {
      const wrapper = montar({ name: 'cnpj' });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('12345678000199');

      expect(campo.element.value).toBe('12.345.678/0001-99');
      expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('12345678000199');
    });

    it('ignora caracteres que não são dígitos', async () => {
      const wrapper = montar({ name: 'cnpj' });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('ab.cd12efg345');

      expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe('12345');
    });

    it('emite null ao limpar o campo com anularVazio', async () => {
      const wrapper = montar({
        name: 'cnpj',
        anularVazio: true,
      });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('12345678000199');
      await campo.setValue('');

      expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe(null);
    });

    it('emite null ao limpar o campo com modelModifiers.anular', async () => {
      const wrapper = montar({
        name: 'cnpj',
        modelModifiers: { anular: true },
      });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('12345678000199');
      await campo.setValue('');

      expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe(null);
    });
  });

  describe('modo v-model (controlado pelo pai)', () => {
    it('exibe o valor inicial já formatado com a máscara', async () => {
      const wrapper = montar({
        name: 'cnpj',
        modelValue: '12345678000199',
      });

      const campo = wrapper.get('[data-test="campo"]');
      expect(campo.element.value).toBe('12.345.678/0001-99');
    });

    it('atualiza a máscara exibida quando o modelValue muda externamente', async () => {
      const wrapper = montar({
        name: 'cnpj',
        modelValue: '',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      });

      const campo = wrapper.get('[data-test="campo"]');
      expect(campo.element.value).toBe('');

      await wrapper.setProps({ modelValue: '12345678000199' });

      expect(campo.element.value).toBe('12.345.678/0001-99');
    });

    it('emite somente os dígitos ao digitar', async () => {
      const wrapper = montar({
        name: 'cnpj',
        modelValue: '',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('12345678000199');

      expect(wrapper.props('modelValue')).toBe('12345678000199');
      expect(campo.element.value).toBe('12.345.678/0001-99');
    });

    it('emite null ao limpar o campo com anularVazio', async () => {
      // O valor inicial não vazio faz o Maska formatar e reemitir o valor
      // de forma síncrona durante a montagem, antes do `wrapper` existir.
      // Por isso o handler real só é ligado após a montagem.
      let aoAtualizar = () => {};
      const wrapper = montar({
        name: 'cnpj',
        anularVazio: true,
        modelValue: '12345678000199',
        'onUpdate:modelValue': (e) => aoAtualizar(e),
      });
      aoAtualizar = (e) => { wrapper.setProps({ modelValue: e }); };

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('');

      expect(wrapper.props('modelValue')).toBe(null);
    });
  });
});
