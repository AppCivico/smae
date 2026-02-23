import { mount } from '@vue/test-utils';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { nextTick } from 'vue';
import SmaeText from './SmaeText.vue';

function montar(props = {}, options = {}) {
  return mount(SmaeText, { props, ...options });
}

describe('SmaeText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('renderização do campo', () => {
    it('renderiza um <input> por padrão', async () => {
      const wrapper = montar({ name: 'campo' });

      const campos = wrapper.findAll('[data-test="campo"]');
      expect(campos).toHaveLength(1);
      expect(campos[0].element.tagName).toBe('INPUT');
    });

    it('renderiza um <textarea> quando as="textarea"', async () => {
      const wrapper = montar({ name: 'campo', as: 'textarea' });

      const campos = wrapper.findAll('[data-test="campo"]');
      expect(campos).toHaveLength(1);
      expect(campos[0].element.tagName).toBe('TEXTAREA');
    });

    it('não exibe o contador sem maxlength', async () => {
      const wrapper = montar({ name: 'campo' });

      expect(wrapper.find('[data-test="maximo-de-caracteres"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="total-de-caracteres"]').exists()).toBe(false);
    });

    it('exibe o contador quando maxLength é fornecido', async () => {
      const wrapper = montar({ name: 'campo', maxLength: 10 });

      const campo = wrapper.get('[data-test="campo"]');
      const contador = wrapper.get('[data-test="total-de-caracteres"]');
      const maximo = wrapper.get('[data-test="maximo-de-caracteres"]');

      expect(campo.attributes('maxlength')).toBe('10');
      expect(contador.attributes('for')).toBe('campo');
      expect(contador.text()).toBe('0');
      expect(maximo.text()).toBe('10');
    });
  });

  describe('modo autônomo (VeeValidate via useField interno)', () => {
    it('exibe o valor inicial gerenciado pelo VeeValidate', async () => {
      const wrapper = montar({ name: 'campo', maxLength: 20 });

      const campo = wrapper.get('[data-test="campo"]');
      const contador = wrapper.get('[data-test="total-de-caracteres"]');

      expect(campo.element.value).toBe('');
      expect(contador.text()).toBe('0');
    });

    it('atualiza o contador ao digitar', async () => {
      const wrapper = montar({ name: 'campo', maxLength: 24 });

      const campo = wrapper.get('[data-test="campo"]');
      const contador = wrapper.get('[data-test="total-de-caracteres"]');

      await campo.setValue('Novo, novo texto!!!');

      expect(contador.text()).toBe('19');
      expect(wrapper.classes('smae-text--falta-muito')).toBe(true);
      expect(wrapper.classes('smae-text--falta-pouco')).toBe(false);
    });

    it('atualiza as classes de aviso conforme o preenchimento', async () => {
      const wrapper = montar({ name: 'campo', maxLength: 24 });

      const campo = wrapper.get('[data-test="campo"]');

      // 19 chars: 19/24 = 0.79 → falta-muito (> 0.75, <= 0.9)
      await campo.setValue('Novo texto longo!!!');
      await nextTick();
      expect(wrapper.classes('smae-text--falta-muito')).toBe(true);
      expect(wrapper.classes('smae-text--falta-pouco')).toBe(false);

      // 22 chars: 22/24 = 0.92 → falta-pouco (> 0.9)
      await campo.setValue('Texto quase no limite!');
      await nextTick();
      expect(wrapper.classes('smae-text--falta-pouco')).toBe(true);
      expect(wrapper.classes('smae-text--falta-muito')).toBe(false);

      await campo.setValue('');
      await nextTick();
      expect(wrapper.classes('smae-text--falta-pouco')).toBe(false);
      expect(wrapper.classes('smae-text--falta-muito')).toBe(false);
    });

    it('emite null ao limpar o campo com anularVazio', async () => {
      const wrapper = montar({
        name: 'campo',
        anularVazio: true,
      });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('texto');
      await campo.setValue('');

      expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe(null);
    });

    it('emite null ao limpar o campo com modelModifiers.anular', async () => {
      const wrapper = montar({
        name: 'campo',
        modelModifiers: { anular: true },
      });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('texto');
      await campo.setValue('');

      expect(wrapper.emitted('update:modelValue').at(-1)[0]).toBe(null);
    });
  });

  describe('modo v-model (controlado pelo pai)', () => {
    it('exibe o valor inicial fornecido via modelValue', async () => {
      const wrapper = montar({
        name: 'campo',
        maxLength: 20,
        modelValue: 'texto inicial',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      });

      const campo = wrapper.get('[data-test="campo"]');
      const contador = wrapper.get('[data-test="total-de-caracteres"]');

      expect(campo.element.value).toBe('texto inicial');
      expect(contador.text()).toBe('13');
    });

    it('atualiza o contador conforme o modelValue muda', async () => {
      const wrapper = montar({
        name: 'campo',
        maxLength: 24,
        modelValue: 'texto inicial',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      });

      const campo = wrapper.get('[data-test="campo"]');
      const contador = wrapper.get('[data-test="total-de-caracteres"]');

      expect(contador.text()).toBe('13');
      expect(wrapper.classes('smae-text--falta-pouco')).toBe(false);
      expect(wrapper.classes('smae-text--falta-muito')).toBe(false);

      await campo.setValue('Novo, novo texto!!!');
      expect(contador.text()).toBe('19');
      expect(wrapper.classes('smae-text--falta-muito')).toBe(true);
      expect(wrapper.classes('smae-text--falta-pouco')).toBe(false);

      await campo.setValue('');
      expect(contador.text()).toBe('0');
    });

    it('emite null ao limpar o campo com anularVazio', async () => {
      const wrapper = montar({
        name: 'campo',
        anularVazio: true,
        modelValue: 'texto inicial',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('');

      expect(wrapper.props('modelValue')).toBe(null);
    });

    it('emite null ao limpar com modelModifiers.anular', async () => {
      const wrapper = montar({
        name: 'campo',
        modelValue: 'texto inicial',
        modelModifiers: { anular: true },
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      });

      const campo = wrapper.get('[data-test="campo"]');

      await campo.setValue('');

      expect(wrapper.props('modelValue')).toBe(null);
    });

    it('remove espaços em branco no final ao sair do campo', async () => {
      const wrapper = montar({
        name: 'campo',
        maxLength: 32,
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      });

      const campo = wrapper.get('[data-test="campo"]');
      const contador = wrapper.get('[data-test="total-de-caracteres"]');

      await campo.setValue('Texto com espaços no final    ');

      expect(campo.element.value).toBe('Texto com espaços no final');
      expect(contador.text()).toBe('26');
    });
  });
});
