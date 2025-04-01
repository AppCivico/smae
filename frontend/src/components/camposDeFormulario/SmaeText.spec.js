import { mount } from '@vue/test-utils';
import {
  describe,
  expect,
  it,
} from 'vitest';
import SmaeText from './SmaeText.vue';

describe('SmaeText', () => {
  it('criar um campo de texto longo', async () => {
    const wrapper = mount(SmaeText, {
      props: {
        name: 'name',
        as: 'textarea',
      },
    });

    const campos = await wrapper.findAll('[data-test="campo"]');

    expect(campos).toHaveLength(1);
    expect(campos[0].element.tagName).toBe('TEXTAREA');
  });

  it('emite nulo para texto vazio', async () => {
    const wrapper = mount(SmaeText, {
      props: {
        name: 'name',
        modelValue: 'texto inicial',
        modelModifiers: {
          anular: true,
        },
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const campo = await wrapper.get('[data-test="campo"]');

    expect(campo.element.value).toBe('texto inicial');

    await campo.setValue('');

    expect(wrapper.props('modelValue')).toBe(null);
  });

  it('criar um campo sem contador', async () => {
    const wrapper = mount(SmaeText, {
      props: {
        name: 'name',
      },
    });

    expect(wrapper.find('[data-test="maximo-de-caracteres"]').exists()).toBe(false);
  });

  it('criar um campo com contador', async () => {
    const wrapper = mount(SmaeText, {
      props: {
        maxLength: 10,
        name: 'name',
      },
    });

    const campo = await wrapper.get('[data-test="campo"]');

    const contador = wrapper.find('[data-test="total-de-caracteres"]');
    expect(contador.exists()).toBe(true);

    const maximo = wrapper.find('[data-test="maximo-de-caracteres"]');
    expect(maximo.exists()).toBe(true);

    expect(campo.attributes('maxlength')).toBe('10');
    expect(contador.attributes('for')).toBe('name');

    expect(maximo.text()).toBe('10');
  });

  it('atualiza o contador', async () => {
    const wrapper = mount(SmaeText, {
      props: {
        maxLength: 24,
        name: 'name',
        modelValue: 'texto inicial',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const campo = await wrapper.get('[data-test="campo"]');
    const contador = wrapper.find('[data-test="total-de-caracteres"]');

    expect(contador.text()).toBe('13');

    await campo.setValue('Novo, novo texto');
    expect(contador.text()).toBe('16');
    expect(campo.classes('smae-text__contagem-de-caracteres--falta-muito')).toBe(true);

    await campo.setValue('Novo texto mais longo');
    expect(contador.text()).toBe('21');
    expect(campo.classes('smae-text__contagem-de-caracteres--falta-pouco')).toBe(false);
  });
});
