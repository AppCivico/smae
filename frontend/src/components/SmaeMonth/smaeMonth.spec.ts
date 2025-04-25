import {
  describe, it, expect,
} from 'vitest';
import { mount } from '@vue/test-utils';
import InputDateMasked from './SmaeMonth.vue';

describe('InputDateMasked.vue', () => {
  it('deve formatar corretamente o valor digitado', async () => {
    const wrapper = mount(InputDateMasked);

    const input = wrapper.find('input');
    await input.setValue('042025'); // digita "042025"

    expect(input.element.value).toBe('04/2025');
  });

  it('deve limitar a 6 dígitos numéricos', async () => {
    const wrapper = mount(InputDateMasked);

    const input = wrapper.find('input');
    await input.setValue('04202599'); // digita além de 6 dígitos

    expect(input.element.value).toBe('04/2025'); // deve truncar
  });

  it('deve emitir "update:modelValue" e "change" com valor formatado corretamente', async () => {
    const wrapper = mount(InputDateMasked);

    const input = wrapper.find('input');
    await input.setValue('012025');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('change')).toBeTruthy();

    const lastEmitted = wrapper.emitted('update:modelValue')?.pop();
    expect(lastEmitted).toEqual(['01-2025']);
  });

  it('deve aceitar valor vindo de props como string', async () => {
    const wrapper = mount(InputDateMasked, {
      props: {
        modelValue: '072024',
      },
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('07/2024');
  });

  it('deve aceitar valor vindo de props como Date', async () => {
    const wrapper = mount(InputDateMasked, {
      props: {
        modelValue: new Date(2025, 3, 1), // abril de 2025
      },
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('04/2025');
  });

  it('deve preencher com zeros ao sair do campo se valor incompleto', async () => {
    const wrapper = mount(InputDateMasked);

    const input = wrapper.find('input');
    await input.setValue('05202'); // incompleto
    await input.trigger('blur');

    expect(input.element.value).toBe('05/202020'); // ainda exibe, mas pode querer limitar
  });
});
