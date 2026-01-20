import {
  describe, it, expect, vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import SmaeDateInput from './SmaeDateInput.vue';

vi.mock('vee-validate', () => ({
  useField: () => ({
    handleChange: vi.fn(),
  }),
}));

describe('SmaeDateInput.vue', () => {
  function montar(props = {}) {
    return mount(SmaeDateInput, {
      props,
    });
  }

  describe('Exibição de valores (getter)', () => {
    describe('String ISO com timezone UTC (Z)', () => {
      it('deve exibir data correta para string ISO UTC à meia-noite', () => {
        const wrapper = montar({
          modelValue: '2025-01-02T00:00:00.000Z',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-01-02');
      });

      it('deve exibir data correta para string ISO UTC com horário', () => {
        const wrapper = montar({
          modelValue: '2025-06-15T14:30:00.000Z',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-06-15');
      });

      it('deve exibir data correta para string ISO UTC no fim do dia', () => {
        const wrapper = montar({
          modelValue: '2025-12-31T23:59:59.999Z',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-12-31');
      });
    });

    describe('String no formato yyyy-MM-dd', () => {
      it('deve exibir data correta para string simples', () => {
        const wrapper = montar({
          modelValue: '2025-03-20',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-03-20');
      });

      it('deve exibir data correta para primeiro dia do mês', () => {
        const wrapper = montar({
          modelValue: '2025-01-01',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-01-01');
      });

      it('deve exibir data correta para último dia do mês', () => {
        const wrapper = montar({
          modelValue: '2025-02-28',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-02-28');
      });
    });

    describe('Objeto Date', () => {
      it('deve exibir data correta para objeto Date', () => {
        const wrapper = montar({
          modelValue: new Date(Date.UTC(2025, 4, 10)),
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-05-10');
      });

      it('deve exibir data correta para Date criado com string ISO', () => {
        const wrapper = montar({
          modelValue: new Date('2025-07-04T00:00:00.000Z'),
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-07-04');
      });
    });

    describe('Valores nulos e vazios', () => {
      it('deve retornar null para modelValue null', () => {
        const wrapper = montar({
          modelValue: null,
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('');
      });

      it('deve retornar null para modelValue undefined', () => {
        const wrapper = montar({});

        const input = wrapper.find('input');
        expect(input.element.value).toBe('');
      });

      it('deve retornar null para string vazia', () => {
        const wrapper = montar({
          modelValue: '',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('');
      });
    });

    describe('Datas em casos extremos', () => {
      it('deve exibir corretamente ano bissexto', () => {
        const wrapper = montar({
          modelValue: '2024-02-29T00:00:00.000Z',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2024-02-29');
      });

      it('deve exibir corretamente virada de ano', () => {
        const wrapper = montar({
          modelValue: '2024-12-31T00:00:00.000Z',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2024-12-31');
      });

      it('deve exibir corretamente primeiro dia do ano', () => {
        const wrapper = montar({
          modelValue: '2025-01-01T00:00:00.000Z',
        });

        const input = wrapper.find('input');
        expect(input.element.value).toBe('2025-01-01');
      });
    });
  });

  describe('Emissão de valores (setter)', () => {
    describe('converterPara: date (padrão)', () => {
      it('deve emitir objeto Date ao alterar valor', async () => {
        const wrapper = montar({
          modelValue: null,
          converterPara: 'date',
        });

        const input = wrapper.find('input');
        await input.setValue('2025-08-15');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();

        const valorEmitido = emitted?.[0]?.[0] as Date;
        expect(valorEmitido).toBeInstanceOf(Date);
        expect(valorEmitido.toISOString()).toContain('2025-08-15');
      });

      it('deve emitir null ao limpar o campo', async () => {
        const wrapper = montar({
          modelValue: '2025-08-15',
          converterPara: 'date',
        });

        const input = wrapper.find('input');
        await input.setValue('');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]?.[0]).toBeNull();
      });
    });

    describe('converterPara: string', () => {
      it('deve emitir string no formato yyyy-MM-dd', async () => {
        const wrapper = montar({
          modelValue: null,
          converterPara: 'string',
        });

        const input = wrapper.find('input');
        await input.setValue('2025-09-20');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]?.[0]).toBe('2025-09-20');
      });

      it('deve emitir null ao limpar o campo', async () => {
        const wrapper = montar({
          modelValue: '2025-09-20',
          converterPara: 'string',
        });

        const input = wrapper.find('input');
        await input.setValue('');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]?.[0]).toBeNull();
      });
    });

    describe('converterPara: text', () => {
      it('deve emitir string no formato yyyy-MM-dd', async () => {
        const wrapper = montar({
          modelValue: null,
          converterPara: 'text',
        });

        const input = wrapper.find('input');
        await input.setValue('2025-10-25');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]?.[0]).toBe('2025-10-25');
      });
    });
  });

  describe('Propriedade name', () => {
    it('deve aplicar o atributo name ao input', () => {
      const wrapper = montar({
        name: 'data_nascimento',
      });

      const input = wrapper.find('input');
      expect(input.attributes('name')).toBe('data_nascimento');
    });

    it('deve ter name vazio por padrão', () => {
      const wrapper = montar({});

      const input = wrapper.find('input');
      expect(input.attributes('name')).toBe('');
    });
  });

  describe('Tipo do input', () => {
    it('deve ser do tipo date', () => {
      const wrapper = montar({});

      const input = wrapper.find('input');
      expect(input.attributes('type')).toBe('date');
    });
  });

  describe('Valores inválidos', () => {
    it('deve retornar null para string inválida', () => {
      const wrapper = montar({
        modelValue: 'data-invalida',
      });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('');
    });

    it('deve retornar null para objeto Date inválido', () => {
      const wrapper = montar({
        modelValue: new Date('invalid'),
      });

      const input = wrapper.find('input');
      expect(input.element.value).toBe('');
    });
  });

  describe('Reatividade', () => {
    it('deve atualizar o input quando modelValue mudar', async () => {
      const wrapper = montar({
        modelValue: '2025-01-01T00:00:00.000Z',
      });

      expect(wrapper.find('input').element.value).toBe('2025-01-01');

      await wrapper.setProps({ modelValue: '2025-06-15T00:00:00.000Z' });

      expect(wrapper.find('input').element.value).toBe('2025-06-15');
    });

    it('deve limpar o input quando modelValue for null', async () => {
      const wrapper = montar({
        modelValue: '2025-01-01T00:00:00.000Z',
      });

      expect(wrapper.find('input').element.value).toBe('2025-01-01');

      await wrapper.setProps({ modelValue: null });

      expect(wrapper.find('input').element.value).toBe('');
    });
  });
});
