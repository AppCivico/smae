import {
  describe, it, expect,
} from 'vitest';
import { mount } from '@vue/test-utils';
import InputDateMasked from './SmaeMonth.vue';

const defaultProps = {
  diaPrefixo: '1',
};

describe('InputDateMasked.vue', () => {
  function montar(props = {}) {
    return mount(InputDateMasked, {
      props: {
        ...defaultProps,
        ...props,
      },
    });
  }

  it.skip('deve formatar corretamente o valor digitado', async () => {
    const wrapper = montar();

    const input = wrapper.find('input');
    await input.setValue('042025'); // digita "042025"

    expect(input.element.value).toBe('04/2025');
  });

  it.skip('deve limitar a 6 dígitos numéricos', async () => {
    const wrapper = montar();

    const input = wrapper.find('input');
    await input.setValue('042020'); // digita além de 6 dígitos

    expect(input.element.value).toBe('04/2025'); // deve truncar
  });

  it.skip('deve emitir "update:modelValue" e "change" com valor formatado corretamente', async () => {
    const wrapper = montar();

    const input = wrapper.find('input');
    await input.setValue('012025');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('change')).toBeTruthy();

    const lastEmitted = wrapper.emitted('update:modelValue')?.pop();
    expect(lastEmitted).toEqual(['01-01-2025']);
  });

  it.skip('deve aceitar valor vindo de props como string', async () => {
    const wrapper = montar({
      modelValue: '072024',
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('07/2024');
  });

  it.skip('deve aceitar valor vindo de props como Date', async () => {
    const wrapper = montar({
      modelValue: new Date(2025, 3, 1), // abril de 2025
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('04/2025');
  });

  it.skip('deve preencher com zeros ao sair do campo se valor incompleto', async () => {
    const wrapper = mount(InputDateMasked);

    const input = wrapper.find('input');
    await input.setValue('05202'); // incompleto
    await input.trigger('blur');

    expect(input.element.value).toBe('05/2020'); // ainda exibe, mas pode querer limitar
  });

  it('Não deve permitir inserir texto', async () => {
    const wrapper = mount(InputDateMasked);

    const input = wrapper.find('input');
    await input.setValue('abc'); // incompleto

    expect(input.element.value).toBe(''); // ainda exibe, mas pode querer limitar
  });
});
