import { mount } from '@vue/test-utils';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import SmaeRangeInput from './SmaeRangeInput.vue';

function montar(props = {}) {
  return mount(SmaeRangeInput, {
    props: {
      modelValue: 50,
      ...props,
    },
  });
}

describe('SmaeRangeInput', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('renderização', () => {
    it('renderiza um input[type="range"]', () => {
      const wrapper = montar();
      expect(wrapper.find('input[type="range"]').exists()).toBe(true);
    });

    it('aplica o valor atual via atributo value', () => {
      const wrapper = montar({ modelValue: 30 });
      expect(wrapper.find('input').attributes('value')).toBe('30');
    });

    it('aplica os atributos min, max e step', () => {
      const wrapper = montar({ min: 10, max: 200, step: 5 });
      const input = wrapper.find('input');
      expect(input.attributes('min')).toBe('10');
      expect(input.attributes('max')).toBe('200');
      expect(input.attributes('step')).toBe('5');
    });

    it('aplica o atributo name quando fornecido', () => {
      const wrapper = montar({ name: 'nivel' });
      expect(wrapper.find('input').attributes('name')).toBe('nivel');
    });

    it('usa defaults: min=0, max=100, step=1, name=""', () => {
      const wrapper = montar({ modelValue: 0 });
      const input = wrapper.find('input');
      expect(input.attributes('min')).toBe('0');
      expect(input.attributes('max')).toBe('100');
      expect(input.attributes('step')).toBe('1');
      expect(input.attributes('name')).toBe('');
    });
  });

  describe('fill (CSS --inputrange-fill)', () => {
    it('calcula fill corretamente para valor no meio do range', () => {
      const wrapper = montar({ modelValue: 50, min: 0, max: 100 });
      const style = wrapper.find('input').attributes('style');
      expect(style).toContain('--inputrange-fill: 50%');
    });

    it('calcula fill 0% quando modelValue === min', () => {
      const wrapper = montar({ modelValue: 0, min: 0, max: 100 });
      const style = wrapper.find('input').attributes('style');
      expect(style).toContain('--inputrange-fill: 0%');
    });

    it('calcula fill 100% quando modelValue === max', () => {
      const wrapper = montar({ modelValue: 100, min: 0, max: 100 });
      const style = wrapper.find('input').attributes('style');
      expect(style).toContain('--inputrange-fill: 100%');
    });

    it('retorna 100% quando max <= min', () => {
      const wrapper = montar({ modelValue: 5, min: 10, max: 5 });
      const style = wrapper.find('input').attributes('style');
      expect(style).toContain('--inputrange-fill: 100%');
    });

    it('retorna 100% quando min === max', () => {
      const wrapper = montar({ modelValue: 50, min: 50, max: 50 });
      const style = wrapper.find('input').attributes('style');
      expect(style).toContain('--inputrange-fill: 100%');
    });

    it('aceita min e max como strings', () => {
      const wrapper = montar({ modelValue: 5, min: '0', max: '10' });
      const style = wrapper.find('input').attributes('style');
      expect(style).toContain('--inputrange-fill: 50%');
    });

    it('atualiza fill reativamente quando modelValue muda', async () => {
      const wrapper = montar({ modelValue: 0, min: 0, max: 100 });
      expect(wrapper.find('input').attributes('style')).toContain('--inputrange-fill: 0%');

      await wrapper.setProps({ modelValue: 75 });
      expect(wrapper.find('input').attributes('style')).toContain('--inputrange-fill: 75%');
    });
  });

  describe('emits', () => {
    it('emite update:modelValue com número ao interagir com o slider', async () => {
      const wrapper = montar({ modelValue: 0 });
      await wrapper.find('input').setValue(42);

      expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
      expect(wrapper.emitted('update:modelValue')![0][0]).toBe(42);
    });

    it('o valor emitido é sempre do tipo number', async () => {
      const wrapper = montar({ modelValue: 0 });
      await wrapper.find('input').setValue('75');

      const emitted = wrapper.emitted('update:modelValue')![0][0];
      expect(typeof emitted).toBe('number');
      expect(emitted).toBe(75);
    });
  });

  describe('reatividade de props', () => {
    it('atualiza o atributo value quando modelValue muda', async () => {
      const wrapper = montar({ modelValue: 10 });
      await wrapper.setProps({ modelValue: 80 });
      expect(wrapper.find('input').attributes('value')).toBe('80');
    });

    it('atualiza min e max reativamente', async () => {
      const wrapper = montar({ modelValue: 50, min: 0, max: 100 });
      await wrapper.setProps({ min: 20, max: 200 });

      const input = wrapper.find('input');
      expect(input.attributes('min')).toBe('20');
      expect(input.attributes('max')).toBe('200');
    });
  });
});
