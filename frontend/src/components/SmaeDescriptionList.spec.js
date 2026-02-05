import { mount } from '@vue/test-utils';
import {
  describe,
  expect,
  it,
} from 'vitest';
import SmaeDescriptionList from './SmaeDescriptionList.vue';

describe('SmaeDescriptionList', () => {
  const montarComponente = (props = {}, options = {}) => mount(SmaeDescriptionList, {
    props,
    ...options,
  });

  describe('renderização com objeto', () => {
    it('renderiza a lista de descrição a partir de um objeto', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João', idade: 30 },
      });

      expect(wrapper.find('dl.description-list').exists()).toBe(true);
      expect(wrapper.findAll('.description-list__item')).toHaveLength(2);
    });

    it('exibe chaves como termos quando não há mapa de títulos', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
      });

      expect(wrapper.find('.description-list__term').text()).toBe('nome');
    });

    it('exibe valores corretamente', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
      });

      expect(wrapper.find('.description-list__description').text()).toBe('João');
    });

    it('usa mapa de títulos quando fornecido', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
        mapaDeTitulos: { nome: 'Nome completo' },
      });

      expect(wrapper.find('.description-list__term').text()).toBe('Nome completo');
    });

    it('exibe travessão para valores nulos', () => {
      const wrapper = montarComponente({
        objeto: { nome: null },
      });

      expect(wrapper.find('.description-list__description').text()).toBe('—');
    });

    it('exibe travessão para valores undefined', () => {
      const wrapper = montarComponente({
        objeto: { nome: undefined },
      });

      expect(wrapper.find('.description-list__description').text()).toBe('—');
    });

    it('exibe travessão para strings vazias', () => {
      const wrapper = montarComponente({
        objeto: { nome: '' },
      });

      expect(wrapper.find('.description-list__description').text()).toBe('—');
    });
  });

  describe('renderização com lista', () => {
    it('renderiza a lista de descrição a partir de uma lista estruturada', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', valor: 'João' },
          { chave: 'idade', valor: 30 },
        ],
      });

      expect(wrapper.find('dl.description-list').exists()).toBe(true);
      expect(wrapper.findAll('.description-list__item')).toHaveLength(2);
    });

    it('usa título do item quando fornecido', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', titulo: 'Nome completo', valor: 'João' },
        ],
      });

      expect(wrapper.find('.description-list__term').text()).toBe('Nome completo');
    });

    it('usa mapa de títulos como fallback quando item não tem título', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', valor: 'João' },
        ],
        mapaDeTitulos: { nome: 'Nome do mapa' },
      });

      expect(wrapper.find('.description-list__term').text()).toBe('Nome do mapa');
    });

    it('título do item tem prioridade sobre mapa de títulos', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', titulo: 'Título do item', valor: 'João' },
        ],
        mapaDeTitulos: { nome: 'Nome do mapa' },
      });

      expect(wrapper.find('.description-list__term').text()).toBe('Título do item');
    });

    it('aplica atributosDoItem no elemento do item', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'nome',
            valor: 'João',
            atributosDoItem: { class: 'fb20em', 'data-test': 'item-nome' },
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      expect(item.classes()).toContain('fb20em');
      expect(item.attributes('data-test')).toBe('item-nome');
    });
  });

  describe('slots', () => {
    it('renderiza slot "chave" para personalizar todos os termos', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João' },
        },
        {
          slots: {
            chave: '<span data-test="chave-custom">{{ params.item.chave.toUpperCase() }}</span>',
          },
        },
      );

      expect(wrapper.find('[data-test="chave-custom"]').exists()).toBe(true);
    });

    it('renderiza slot "chave--[nome]" para chave específica', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João', idade: 30 },
        },
        {
          slots: {
            'chave--nome': '<span data-test="chave-nome-custom">NOME ESPECIAL</span>',
          },
        },
      );

      expect(wrapper.find('[data-test="chave-nome-custom"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="chave-nome-custom"]').text()).toBe('NOME ESPECIAL');
    });

    it('renderiza slot "valor" para personalizar todos os valores', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João' },
        },
        {
          slots: {
            valor: '<em data-test="valor-custom">{{ params.item.valor }}</em>',
          },
        },
      );

      expect(wrapper.find('[data-test="valor-custom"]').exists()).toBe(true);
    });

    it('renderiza slot "valor--[nome]" para valor específico', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João', idade: 30 },
        },
        {
          slots: {
            'valor--nome': '<strong data-test="valor-nome-custom">{{ params.item.valor }}</strong>',
          },
        },
      );

      expect(wrapper.find('[data-test="valor-nome-custom"]').exists()).toBe(true);
    });

    it('slot específico tem prioridade sobre slot genérico', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João' },
        },
        {
          slots: {
            chave: '<span data-test="chave-generica">Genérico</span>',
            'chave--nome': '<span data-test="chave-especifica">Específico</span>',
          },
        },
      );

      expect(wrapper.find('[data-test="chave-especifica"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="chave-generica"]').exists()).toBe(false);
    });

    it('expõe item no scoped slot', () => {
      const wrapper = montarComponente(
        {
          lista: [
            {
              chave: 'nome', titulo: 'Nome', valor: 'João', metadados: { extra: 'info' },
            },
          ],
        },
        {
          slots: {
            valor: `
              <template #valor="{ item }">
                <span data-test="valor-slot">{{ item.valor }} - {{ item.metadados?.extra }}</span>
              </template>
            `,
          },
        },
      );

      expect(wrapper.find('[data-test="valor-slot"]').text()).toContain('João');
    });
  });

  describe('renderização condicional', () => {
    it('não renderiza nada quando objeto está vazio', () => {
      const wrapper = montarComponente({
        objeto: {},
      });

      expect(wrapper.find('dl').exists()).toBe(false);
    });

    it('não renderiza nada quando lista está vazia', () => {
      const wrapper = montarComponente({
        lista: [],
      });

      expect(wrapper.find('dl').exists()).toBe(false);
    });

    it('não renderiza nada quando nenhuma prop é fornecida', () => {
      const wrapper = montarComponente();

      expect(wrapper.find('dl').exists()).toBe(false);
    });
  });

  describe('classes CSS', () => {
    it('aplica classes corretas no container', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
      });

      const dl = wrapper.find('dl');
      expect(dl.classes()).toContain('description-list');
      expect(dl.classes()).toContain('flex');
      expect(dl.classes()).toContain('g2');
      expect(dl.classes()).toContain('mb1');
      expect(dl.classes()).toContain('flexwrap');
    });

    it('aplica classes corretas no item', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
      });

      const item = wrapper.find('.description-list__item');
      expect(item.classes()).toContain('f1');
      expect(item.classes()).toContain('mb1');
    });

    it('aplica classes corretas no termo', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
      });

      const term = wrapper.find('.description-list__term');
      expect(term.classes()).toContain('t12');
      expect(term.classes()).toContain('uc');
      expect(term.classes()).toContain('w700');
      expect(term.classes()).toContain('mb05');
      expect(term.classes()).toContain('tamarelo');
    });

    it('aplica classes corretas na descrição', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
      });

      const description = wrapper.find('.description-list__description');
      expect(description.classes()).toContain('t13');
    });
  });

  describe('valores numéricos', () => {
    it('exibe valores numéricos corretamente', () => {
      const wrapper = montarComponente({
        objeto: { quantidade: 42 },
      });

      expect(wrapper.find('.description-list__description').text()).toBe('42');
    });

    it('exibe zero como valor válido', () => {
      const wrapper = montarComponente({
        objeto: { quantidade: 0 },
      });

      expect(wrapper.find('.description-list__description').text()).toBe('0');
    });
  });
});
