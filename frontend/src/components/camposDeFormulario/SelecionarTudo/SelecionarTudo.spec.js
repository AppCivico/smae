import { mount } from '@vue/test-utils';
import {
  describe,
  expect,
  it,
} from 'vitest';
import SelecionarTudo from './SelecionarTudo.vue';

describe('SelecionarTudo', () => {
  it('monta apenas um campo', async () => {
    const wrapper = mount(SelecionarTudo, {
      props: {
        listaDeOpcoes: [5, 6, 7, 8, 9],
        modelValue: [5, 6],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const campos = await wrapper.findAll('[type="checkbox"]');

    expect(campos).toHaveLength(1);
    expect(campos[0].element.tagName).toBe('INPUT');
  });

  it('monta um campo em parcialmente selecionado', async () => {
    const wrapper = mount(SelecionarTudo, {
      props: {
        listaDeOpcoes: [5, 6, 7, 8, 9],
        modelValue: [5, 6],
      },
    });

    const campo = await wrapper.find('[type="checkbox"]');

    expect(wrapper.props('modelValue')).toStrictEqual([5, 6]);

    expect(campo.element.checked).toBe(false);
    expect(campo.element.indeterminate).toBe(true);
  });

  it('monta um campo completamente selecionado', async () => {
    const wrapper = mount(SelecionarTudo, {
      props: {
        listaDeOpcoes: [5, 6],
        modelValue: [5, 6],
      },
    });
    const campo = await wrapper.find('[type="checkbox"]');

    expect(wrapper.props('modelValue')).toStrictEqual([5, 6]);

    expect(campo.element.checked).toBe(true);
    expect(campo.element.indeterminate).toBe(false);
  });

  it('monta um campo completamente desselecionado', async () => {
    const wrapper = mount(SelecionarTudo, {
      props: {
        listaDeOpcoes: [5, 6],
        modelValue: [],
      },
    });
    const campo = await wrapper.find('[type="checkbox"]');

    expect(wrapper.props('modelValue')).toStrictEqual([]);

    expect(campo.element.checked).toBe(false);
    expect(campo.element.indeterminate).toBe(false);
  });

  it('seleciona todas as opções', async () => {
    const wrapper = mount(SelecionarTudo, {
      props: {
        listaDeOpcoes: [5, 6, 7, 8, 9],
        modelValue: [5, 6],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });

    const campo = await wrapper.find('[type="checkbox"]');

    expect(wrapper.props('modelValue')).toStrictEqual([5, 6]);

    await campo.setValue();

    expect(wrapper.props('modelValue')).toStrictEqual([5, 6, 7, 8, 9]);

    await campo.setValue(false);

    expect(wrapper.props('modelValue')).toStrictEqual([]);
  });

  it('adiciona ou remove opções num formulário paginado', async () => {
    const wrapper = mount(SelecionarTudo, {
      props: {
        listaDeOpcoes: [5, 6, 7, 8, 9],
        modelValue: [1, 2, 3, 4, 5, 6],
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    });
    const campo = await wrapper.find('[type="checkbox"]');

    expect(campo.element.tagName).toBe('INPUT');
    expect(campo.attributes('type')).toBe('checkbox');

    expect(wrapper.props('modelValue')).toStrictEqual([1, 2, 3, 4, 5, 6]);

    await campo.setValue();

    expect(wrapper.props('modelValue')).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    await campo.setValue(false);

    expect(wrapper.props('modelValue')).toStrictEqual([1, 2, 3, 4]);
  });
});
