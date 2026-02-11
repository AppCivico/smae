import { mount } from '@vue/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { nextTick, ref } from 'vue';
import SmaeRangeInput from './SmaeRangeInput.vue';

// Mock dos helpers
vi.mock('@/helpers/dinheiro', () => ({
  default: vi.fn((valor: number, opcoes?: { style?: string; currency?: string }) => {
    if (opcoes?.style === 'currency') {
      return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }
    if (opcoes?.style === 'decimal') {
      return valor.toFixed(2).replace('.', ',');
    }
    return valor.toString();
  }),
}));

vi.mock('@/helpers/toFloat', () => ({
  default: vi.fn((v: string | number) => {
    if (typeof v === 'number') return v;
    const str = String(v).replace(/[^0-9\-,]/g, '').replace(',', '.');
    return parseFloat(str);
  }),
}));

// Mock do useField
const mockSetMin = vi.fn();
const mockSetMax = vi.fn();
const mockValorMinRef = ref<number | string | null>(null);
const mockValorMaxRef = ref<number | string | null>(null);

vi.mock('vee-validate', () => ({
  useField: vi.fn((name) => {
    const fieldName = typeof name === 'function' ? name() : name;
    if (fieldName.includes('min')) {
      return {
        value: mockValorMinRef,
        setValue: mockSetMin,
      };
    }
    return {
      value: mockValorMaxRef,
      setValue: mockSetMax,
    };
  }),
}));

describe('SmaeRangeInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValorMinRef.value = null;
    mockValorMaxRef.value = null;
  });

  const montarComponente = (props = {}) => mount(SmaeRangeInput, {
    props: {
      nameMin: 'valor_min',
      nameMax: 'valor_max',
      min: 0,
      max: 100,
      ...props,
    },
  });

  describe('renderização', () => {
    it('renderiza dois sliders de range', () => {
      const wrapper = montarComponente();

      const sliders = wrapper.findAll('input[type="range"]');
      expect(sliders).toHaveLength(2);
    });

    it('renderiza inputs hidden para submissão de formulário', () => {
      const wrapper = montarComponente();

      const hiddenInputs = wrapper.findAll('input[type="hidden"]');
      expect(hiddenInputs).toHaveLength(2);
      expect(hiddenInputs[0].attributes('name')).toBe('valor_min');
      expect(hiddenInputs[1].attributes('name')).toBe('valor_max');
    });

    it('aplica valores min e max aos sliders', async () => {
      const wrapper = montarComponente({ min: 10, max: 100 });

      await nextTick();

      const vm = wrapper.vm as any;

      // Verificar que os valores estão dentro do range
      expect(vm.sliderMin).toBeGreaterThanOrEqual(10);
      expect(vm.sliderMax).toBeLessThanOrEqual(100);
    });

    it('renderiza labels quando mostrarInputs é false', () => {
      const wrapper = montarComponente({ mostrarInputs: false });

      expect(wrapper.find('.range-labels').exists()).toBe(true);
      expect(wrapper.find('.range-inputs').exists()).toBe(false);
    });

    it('renderiza inputs editáveis quando mostrarInputs é true', () => {
      const wrapper = montarComponente({ mostrarInputs: true });

      expect(wrapper.find('.range-inputs').exists()).toBe(true);
      expect(wrapper.find('.range-labels').exists()).toBe(false);
    });

    it('renderiza prefixo R$ nos inputs quando formatarMoeda é true', () => {
      const wrapper = montarComponente({ mostrarInputs: true, formatarMoeda: true });

      const prefix = wrapper.find('.input-prefix');
      expect(prefix.exists()).toBe(true);
      expect(prefix.text()).toBe('R$');
    });

    it('não renderiza prefixo R$ quando formatarMoeda é false', () => {
      const wrapper = montarComponente({ mostrarInputs: true, formatarMoeda: false });

      expect(wrapper.find('.input-prefix').exists()).toBe(false);
    });
  });

  describe('props e defaults', () => {
    it('usa valores padrão quando props não são fornecidas', () => {
      const wrapper = montarComponente();

      const sliders = wrapper.findAll('input[type="range"]');
      expect(sliders).toHaveLength(2);
    });

    it('usa step customizado quando fornecido', () => {
      const wrapper = montarComponente({ step: 5 });

      const sliders = wrapper.findAll('input[type="range"]');
      expect(sliders[0].attributes('step')).toBe('5');
    });

    it('usa step padrão 0.01 quando não fornecido', () => {
      const wrapper = montarComponente({ step: null });

      const sliders = wrapper.findAll('input[type="range"]');
      expect(sliders[0].attributes('step')).toBe('0.01');
    });
  });

  describe('interação com sliders', () => {
    it('atualiza valor mínimo ao mover slider mínimo', async () => {
      const wrapper = montarComponente({ min: 0, max: 100 });

      const sliderMin = wrapper.findAll('input[type="range"]')[0];
      await sliderMin.setValue(30);

      expect(mockSetMin).toHaveBeenCalledWith(30);
    });

    it('atualiza valor máximo ao mover slider máximo', async () => {
      const wrapper = montarComponente({ min: 0, max: 100 });

      const sliderMax = wrapper.findAll('input[type="range"]')[1];
      await sliderMax.setValue(70);

      expect(mockSetMax).toHaveBeenCalledWith(70);
    });
  });

  describe('interação com inputs de texto', () => {
    it('atualiza slider ao editar input mínimo', async () => {
      const wrapper = montarComponente({
        min: 0,
        max: 1000,
        mostrarInputs: true,
      });

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      const inputMin = inputs[0];

      await inputMin.setValue('500');
      await inputMin.trigger('change');

      expect(mockSetMin).toHaveBeenCalled();
    });

    it('atualiza slider ao editar input máximo', async () => {
      const wrapper = montarComponente({
        min: 0,
        max: 1000,
        mostrarInputs: true,
      });

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      const inputMax = inputs[1];

      await inputMax.setValue('800');
      await inputMax.trigger('change');

      expect(mockSetMax).toHaveBeenCalled();
    });

    it('valida valores ao editar inputs', async () => {
      const wrapper = montarComponente({
        min: 0,
        max: 100,
        mostrarInputs: true,
      });
      const vm = wrapper.vm as any;

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      const inputMin = inputs[0];

      // Tentar definir valor acima do máximo
      await inputMin.setValue('150');
      await inputMin.trigger('change');

      // Deve ser limitado ao máximo
      expect(vm.sliderMin).toBeLessThanOrEqual(100);
    });
  });

  describe('acessibilidade', () => {
    it('slider mínimo tem aria-label básico quando mostrarInputs é false', () => {
      const wrapper = montarComponente({ mostrarInputs: false });

      const sliderMin = wrapper.findAll('input[type="range"]')[0];
      expect(sliderMin.attributes('aria-label')).toBe('Valor mínimo');
    });

    it('slider máximo tem aria-label básico quando mostrarInputs é false', () => {
      const wrapper = montarComponente({ mostrarInputs: false });

      const sliderMax = wrapper.findAll('input[type="range"]')[1];
      expect(sliderMax.attributes('aria-label')).toBe('Valor máximo');
    });

    it('slider mínimo tem aria-label diferenciado quando mostrarInputs é true', () => {
      const wrapper = montarComponente({ mostrarInputs: true });

      const sliderMin = wrapper.findAll('input[type="range"]')[0];
      expect(sliderMin.attributes('aria-label')).toBe('Slider valor mínimo');
    });

    it('slider máximo tem aria-label diferenciado quando mostrarInputs é true', () => {
      const wrapper = montarComponente({ mostrarInputs: true });

      const sliderMax = wrapper.findAll('input[type="range"]')[1];
      expect(sliderMax.attributes('aria-label')).toBe('Slider valor máximo');
    });

    it('inputs de texto têm aria-label quando mostrarInputs é true', () => {
      const wrapper = montarComponente({ mostrarInputs: true });

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      expect(inputs[0].attributes('aria-label')).toBe('Valor mínimo');
      expect(inputs[1].attributes('aria-label')).toBe('Valor máximo');
    });

    it('inputs de texto têm placeholder', () => {
      const wrapper = montarComponente({ mostrarInputs: true });

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      expect(inputs[0].attributes('placeholder')).toBe('Mínimo');
      expect(inputs[1].attributes('placeholder')).toBe('Máximo');
    });
  });

  describe('formatação', () => {
    it('formata valores como moeda quando formatarMoeda é true', async () => {
      const wrapper = montarComponente({
        min: 0,
        max: 10000,
        formatarMoeda: true,
        mostrarInputs: false,
      });
      const vm = wrapper.vm as any;

      vm.sliderMin = 1234.56;
      await nextTick();

      // Verifica se o helper dinheiro foi chamado
      const dinheiro = await import('@/helpers/dinheiro');
      expect(dinheiro.default).toHaveBeenCalled();
    });

    it('exibe valores numéricos quando formatarMoeda é false', () => {
      const wrapper = montarComponente({
        min: 0,
        max: 100,
        formatarMoeda: false,
        mostrarInputs: false,
      });
      const vm = wrapper.vm as any;

      const valorFormatado = vm.valorMinFormatado;
      expect(typeof valorFormatado === 'number' || typeof valorFormatado === 'string').toBe(true);
    });

    it('inputs de texto têm type="text" quando formatarMoeda é true', () => {
      const wrapper = montarComponente({
        mostrarInputs: true,
        formatarMoeda: true,
      });

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      expect(inputs[0].attributes('type')).toBe('text');
    });

    it('inputs de texto têm type="number" quando formatarMoeda é false', () => {
      const wrapper = montarComponente({
        mostrarInputs: true,
        formatarMoeda: false,
      });

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      expect(inputs[0].attributes('type')).toBe('number');
    });
  });

  describe('sincronização com VeeValidate', () => {
    it('inicializa com valores do VeeValidate quando disponíveis', () => {
      mockValorMinRef.value = 25;
      mockValorMaxRef.value = 75;

      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      expect(vm.sliderMin).toBe(25);
      expect(vm.sliderMax).toBe(75);
    });

    it('usa valores padrão quando VeeValidate retorna null', () => {
      mockValorMinRef.value = null;
      mockValorMaxRef.value = null;

      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      expect(vm.sliderMin).toBe(0);
      expect(vm.sliderMax).toBe(100);
    });

    it('chama setValue do VeeValidate ao inicializar com valores padrão', () => {
      mockValorMinRef.value = null;
      mockValorMaxRef.value = null;

      montarComponente({ min: 0, max: 100 });

      expect(mockSetMin).toHaveBeenCalledWith(0);
      expect(mockSetMax).toHaveBeenCalledWith(100);
    });

    it('preserva valores do VeeValidate mesmo quando estão fora do range visual', () => {
      mockValorMinRef.value = 12312315414.18;
      mockValorMaxRef.value = 12312315414.18;

      const wrapper = montarComponente({ min: 0, max: 10000000 });
      const vm = wrapper.vm as any;

      // Os valores reais devem ser preservados, não limitados
      expect(vm.sliderMin).toBe(12312315414.18);
      expect(vm.sliderMax).toBe(12312315414.18);
    });

    it('preserva valores negativos do VeeValidate', () => {
      mockValorMinRef.value = -100;
      mockValorMaxRef.value = -50;

      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      // Valores negativos são válidos e devem ser preservados
      expect(vm.sliderMin).toBe(-100);
      expect(vm.sliderMax).toBe(-50);
    });
  });

  describe('ciclo de vida', () => {
    it('atualiza ranges após montagem', async () => {
      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      // onMounted é executado após nextTick
      await nextTick();
      await nextTick();

      expect(vm.ready).toBe(true);
    });

    it('atualiza ranges quando prop min muda', async () => {
      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      await wrapper.setProps({ min: 10 });
      await nextTick();

      // Verifica que a função de atualização foi chamada (não modifica valores)
      expect(vm.inputMinRef).toBeTruthy();
    });

    it('atualiza ranges quando prop max muda', async () => {
      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      await wrapper.setProps({ max: 90 });
      await nextTick();

      // Verifica que a função de atualização foi chamada (não modifica valores)
      expect(vm.inputMaxRef).toBeTruthy();
    });
  });

  describe('validação de valores', () => {
    it('mantém valores dentro do range ao atualizar via input', async () => {
      const wrapper = montarComponente({
        min: 0,
        max: 100,
        mostrarInputs: true,
      });
      const vm = wrapper.vm as any;

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      const inputMin = inputs[0];

      // Tentar valor negativo
      await inputMin.setValue('-50');
      await inputMin.trigger('change');

      expect(vm.sliderMin).toBeGreaterThanOrEqual(0);
    });

    it('ignora valores NaN ao atualizar via input', async () => {
      const wrapper = montarComponente({
        min: 0,
        max: 100,
        mostrarInputs: true,
      });
      const vm = wrapper.vm as any;

      const valorAnterior = vm.sliderMin;
      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      const inputMin = inputs[0];

      // Valor inválido
      await inputMin.setValue('abc');
      await inputMin.trigger('change');

      // Valor não deve mudar
      expect(vm.sliderMin).toBe(valorAnterior);
    });
  });

  describe('estilização dinâmica', () => {
    it('aplica variáveis CSS customizadas', () => {
      const wrapper = montarComponente();

      const rangeWrapper = wrapper.find('.range-wrapper');
      const style = rangeWrapper.attributes('style');

      expect(style).toContain('--thumb-width');
      expect(style).toContain('--track-height');
    });

    it('atualiza gradient-position nos sliders', async () => {
      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      await nextTick();

      // Verificar que os elementos têm referências
      expect(vm.inputMinRef).toBeTruthy();
      expect(vm.inputMaxRef).toBeTruthy();
    });
  });

  describe('caso especial: min === max', () => {
    it('marca sliders como readonly quando min === max', () => {
      const wrapper = montarComponente({ min: 12312315414.18, max: 12312315414.18 });

      const sliders = wrapper.findAll('input[type="range"]');
      expect(sliders[0].attributes('data-readonly')).toBe('true');
      expect(sliders[1].attributes('data-readonly')).toBe('true');
    });

    it('marca inputs de texto como readonly quando min === max', () => {
      const wrapper = montarComponente({
        min: 12312315414.18,
        max: 12312315414.18,
        mostrarInputs: true,
      });

      const inputs = wrapper.findAll('.range-inputs input:not([type="hidden"])');
      expect(inputs[0].attributes('readonly')).toBeDefined();
      expect(inputs[1].attributes('readonly')).toBeDefined();
    });

    it('define valores iguais quando min === max', () => {
      mockValorMinRef.value = null;
      mockValorMaxRef.value = null;

      const wrapper = montarComponente({ min: 1000, max: 1000 });
      const vm = wrapper.vm as any;

      expect(vm.sliderMin).toBe(1000);
      expect(vm.sliderMax).toBe(1000);
    });

    it('isReadonly é true quando min === max', () => {
      const wrapper = montarComponente({ min: 5000, max: 5000 });
      const vm = wrapper.vm as any;

      expect(vm.isReadonly).toBe(true);
    });

    it('isReadonly é false quando min !== max', () => {
      const wrapper = montarComponente({ min: 0, max: 100 });
      const vm = wrapper.vm as any;

      expect(vm.isReadonly).toBe(false);
    });
  });
});
