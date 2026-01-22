import { mount } from '@vue/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import MaskedFloatInput from './MaskedFloatInput.vue';

vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    handleChange: vi.fn(),
  })),
}));

vi.mock('@/helpers/dinheiro', () => ({
  default: vi.fn((valor, opcoes = {}) => {
    if (valor === '' || valor === null || Number.isNaN(parseFloat(valor))) {
      return '';
    }
    const minimumFractionDigits = opcoes.minimumFractionDigits ?? 2;
    const maximumFractionDigits = opcoes.maximumFractionDigits ?? minimumFractionDigits;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(Number(valor));
  }),
}));

vi.mock('@/helpers/maskFloat', () => ({
  default: vi.fn(),
}));

describe('MaskedFloatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const montarComponente = (props = {}) => mount(MaskedFloatInput, {
    props: {
      name: 'valor',
      ...props,
    },
  });

  describe('renderização', () => {
    it('renderiza um input de texto', () => {
      const wrapper = montarComponente();

      const input = wrapper.find('input');
      expect(input.exists()).toBe(true);
      expect(input.attributes('type')).toBe('text');
    });

    it('aplica inputmode numeric', () => {
      const wrapper = montarComponente();

      const input = wrapper.find('input');
      expect(input.attributes('inputmode')).toBe('numeric');
    });

    it('aplica o atributo name corretamente', () => {
      const wrapper = montarComponente({ name: 'meu-campo' });

      const input = wrapper.find('input');
      expect(input.attributes('name')).toBe('meu-campo');
    });
  });

  describe('valor inicial exibido', () => {
    it('exibe valor numérico formatado com 2 casas decimais por padrão', () => {
      const wrapper = montarComponente({ value: 1234.56 });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('1.234,56');
    });

    it('exibe valor string formatado', () => {
      const wrapper = montarComponente({ value: '999.99' });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('999,99');
    });

    it('exibe vazio para valor null', () => {
      const wrapper = montarComponente({ value: null });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('');
    });

    it('exibe vazio para valor string vazia', () => {
      const wrapper = montarComponente({ value: '' });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('');
    });

    it('exibe valor zero formatado corretamente', () => {
      const wrapper = montarComponente({ value: 0 });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('0,00');
    });

    it('exibe valor pequeno formatado corretamente', () => {
      const wrapper = montarComponente({ value: 0.01 });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('0,01');
    });

    it('exibe valor inteiro com casas decimais', () => {
      const wrapper = montarComponente({ value: 100 });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('100,00');
    });
  });

  describe('casas decimais (fractionDigits)', () => {
    describe('com 0 casas decimais', () => {
      it('exibe valor inicial sem casas decimais', () => {
        const wrapper = montarComponente({
          value: 1234,
          fractionDigits: 0,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('1.234');
      });

      it('exibe valor inteiro sem vírgula', () => {
        const wrapper = montarComponente({
          value: 500,
          fractionDigits: 0,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('500');
      });

      it('emite valor correto ao digitar', async () => {
        const wrapper = montarComponente({
          value: null,
          fractionDigits: 0,
        });

        const input = wrapper.find('input');
        await input.setValue('1234');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')[0][0]).toBe(1234);
      });

      it('passa fractionDigits 0 para maskFloat', async () => {
        const maskFloat = (await import('@/helpers/maskFloat')).default;
        const wrapper = montarComponente({ fractionDigits: 0 });

        const input = wrapper.find('input');
        input.element.value = '123';
        await input.trigger('keyup');

        expect(maskFloat).toHaveBeenCalledWith(expect.anything(), 0);
      });
    });

    describe('com 1 casa decimal', () => {
      it('exibe valor inicial com 1 casa decimal', () => {
        const wrapper = montarComponente({
          value: 1234.5,
          fractionDigits: 1,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('1.234,5');
      });

      it('exibe valor com zeros à direita', () => {
        const wrapper = montarComponente({
          value: 100,
          fractionDigits: 1,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('100,0');
      });

      it('emite valor correto ao digitar', async () => {
        const wrapper = montarComponente({
          value: null,
          fractionDigits: 1,
        });

        const input = wrapper.find('input');
        await input.setValue('1234');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')[0][0]).toBe(123.4);
      });

      it('passa fractionDigits 1 para maskFloat', async () => {
        const maskFloat = (await import('@/helpers/maskFloat')).default;
        const wrapper = montarComponente({ fractionDigits: 1 });

        const input = wrapper.find('input');
        input.element.value = '123';
        await input.trigger('keyup');

        expect(maskFloat).toHaveBeenCalledWith(expect.anything(), 1);
      });
    });

    describe('com 2 casas decimais (padrão)', () => {
      it('exibe valor inicial com 2 casas decimais', () => {
        const wrapper = montarComponente({
          value: 1234.56,
          fractionDigits: 2,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('1.234,56');
      });

      it('usa 2 casas decimais por padrão', () => {
        const wrapper = montarComponente({ value: 99.9 });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('99,90');
      });

      it('emite valor correto ao digitar', async () => {
        const wrapper = montarComponente({
          value: null,
          fractionDigits: 2,
        });

        const input = wrapper.find('input');
        await input.setValue('123456');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')[0][0]).toBe(1234.56);
      });

      it('passa fractionDigits 2 para maskFloat', async () => {
        const maskFloat = (await import('@/helpers/maskFloat')).default;
        const wrapper = montarComponente({ fractionDigits: 2 });

        const input = wrapper.find('input');
        input.element.value = '123';
        await input.trigger('keyup');

        expect(maskFloat).toHaveBeenCalledWith(expect.anything(), 2);
      });
    });

    describe('com 3 casas decimais', () => {
      it('exibe valor inicial com 3 casas decimais', () => {
        const wrapper = montarComponente({
          value: 1234.567,
          fractionDigits: 3,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('1.234,567');
      });

      it('exibe valor com zeros à direita', () => {
        const wrapper = montarComponente({
          value: 50.5,
          fractionDigits: 3,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('50,500');
      });

      it('emite valor correto ao digitar', async () => {
        const wrapper = montarComponente({
          value: null,
          fractionDigits: 3,
        });

        const input = wrapper.find('input');
        await input.setValue('1234567');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')[0][0]).toBe(1234.567);
      });

      it('passa fractionDigits 3 para maskFloat', async () => {
        const maskFloat = (await import('@/helpers/maskFloat')).default;
        const wrapper = montarComponente({ fractionDigits: 3 });

        const input = wrapper.find('input');
        input.element.value = '123';
        await input.trigger('keyup');

        expect(maskFloat).toHaveBeenCalledWith(expect.anything(), 3);
      });
    });
  });

  describe('emissão de eventos', () => {
    it('emite update:modelValue com valor numérico por padrão', async () => {
      const wrapper = montarComponente({
        value: null,
        converterPara: 'number',
      });

      const input = wrapper.find('input');
      await input.setValue('123456');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe(1234.56);
    });

    it('emite update:modelValue com valor string quando converterPara é "string"', async () => {
      const wrapper = montarComponente({
        value: null,
        converterPara: 'string',
      });

      const input = wrapper.find('input');
      await input.setValue('123456');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe('1234.56');
    });

    it('emite update:modelValue com valor string quando converterPara é "text"', async () => {
      const wrapper = montarComponente({
        value: null,
        converterPara: 'text',
      });

      const input = wrapper.find('input');
      await input.setValue('50000');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe('500');
    });

    it('emite null para valor vazio', async () => {
      const wrapper = montarComponente({ value: 100 });

      const input = wrapper.find('input');
      await input.setValue('');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe(null);
    });
  });

  describe('validação de valor máximo', () => {
    it('limita valor ao máximo quando max é definido', async () => {
      const wrapper = montarComponente({
        value: null,
        max: 100,
      });

      const input = wrapper.find('input');
      await input.setValue('150,00');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe(100);
    });

    it('não limita valor quando max é 0', async () => {
      const wrapper = montarComponente({
        value: null,
        max: 0,
      });

      const input = wrapper.find('input');
      await input.setValue('99999999');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe(999999.99);
    });

    it('permite valores menores que o máximo', async () => {
      const wrapper = montarComponente({
        value: null,
        max: 100,
      });

      const input = wrapper.find('input');
      await input.setValue('50,00');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe(50);
    });

    it('permite valor igual ao máximo', async () => {
      const wrapper = montarComponente({
        value: null,
        max: 100,
      });

      const input = wrapper.find('input');
      await input.setValue('100,00');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe(100);
    });
  });

  describe('integração com maskFloat', () => {
    it('chama maskFloat no evento keyup quando há valor', async () => {
      const maskFloat = (await import('@/helpers/maskFloat')).default;
      const wrapper = montarComponente({ fractionDigits: 2 });

      const input = wrapper.find('input');
      input.element.value = '123';
      await input.trigger('keyup');

      expect(maskFloat).toHaveBeenCalled();
    });

    it('não chama maskFloat quando campo está vazio', async () => {
      const maskFloat = (await import('@/helpers/maskFloat')).default;
      vi.clearAllMocks();
      const wrapper = montarComponente({ fractionDigits: 2 });

      const input = wrapper.find('input');
      input.element.value = '';
      await input.trigger('keyup');

      expect(maskFloat).not.toHaveBeenCalled();
    });

    it('passa fractionDigits para maskFloat', async () => {
      const maskFloat = (await import('@/helpers/maskFloat')).default;
      const wrapper = montarComponente({ fractionDigits: 4 });

      const input = wrapper.find('input');
      input.element.value = '123';
      await input.trigger('keyup');

      expect(maskFloat).toHaveBeenCalledWith(expect.anything(), 4);
    });
  });

  describe('props', () => {
    it('aceita fractionDigits personalizado', () => {
      const wrapper = montarComponente({ fractionDigits: 4 });

      expect(wrapper.props('fractionDigits')).toBe(4);
    });

    it('usa fractionDigits padrão de 2', () => {
      const wrapper = montarComponente();

      expect(wrapper.props('fractionDigits')).toBe(2);
    });

    it('aceita converterPara como "number"', () => {
      const wrapper = montarComponente({ converterPara: 'number' });

      expect(wrapper.props('converterPara')).toBe('number');
    });

    it('aceita converterPara como "string"', () => {
      const wrapper = montarComponente({ converterPara: 'string' });

      expect(wrapper.props('converterPara')).toBe('string');
    });

    it('aceita converterPara como "text"', () => {
      const wrapper = montarComponente({ converterPara: 'text' });

      expect(wrapper.props('converterPara')).toBe('text');
    });

    it('usa converterPara padrão de "number"', () => {
      const wrapper = montarComponente();

      expect(wrapper.props('converterPara')).toBe('number');
    });

    it('aceita max como número', () => {
      const wrapper = montarComponente({ max: 1000 });

      expect(wrapper.props('max')).toBe(1000);
    });

    it('usa max padrão de 0', () => {
      const wrapper = montarComponente();

      expect(wrapper.props('max')).toBe(0);
    });
  });
});
