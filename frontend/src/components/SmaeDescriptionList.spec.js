import { mount } from '@vue/test-utils';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { object, string, number } from 'yup';
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

    it('usa título de itensSelecionados quando fornecido', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
        itensSelecionados: [{ chave: 'nome', titulo: 'Nome completo' }],
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

    it('usa título de itensSelecionados como fallback quando item não tem título', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', valor: 'João' },
        ],
        itensSelecionados: [{ chave: 'nome', titulo: 'Nome dos campos' }],
      });

      expect(wrapper.find('.description-list__term').text()).toBe('Nome dos campos');
    });

    it('título do item tem prioridade sobre título de itensSelecionados', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', titulo: 'Título do item', valor: 'João' },
        ],
        itensSelecionados: [{ chave: 'nome', titulo: 'Nome dos campos' }],
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
    it('renderiza slot "termo" para personalizar todos os termos', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João' },
        },
        {
          slots: {
            termo: '<span data-test="termo-custom">{{ params.item.chave.toUpperCase() }}</span>',
          },
        },
      );

      expect(wrapper.find('[data-test="termo-custom"]').exists()).toBe(true);
    });

    it('renderiza slot "termo--[nome]" para termo específico', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João', idade: 30 },
        },
        {
          slots: {
            'termo--nome': '<span data-test="termo-nome-custom">NOME ESPECIAL</span>',
          },
        },
      );

      expect(wrapper.find('[data-test="termo-nome-custom"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="termo-nome-custom"]').text()).toBe('NOME ESPECIAL');
    });

    it('renderiza slot "descricao" para personalizar todos os valores', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João' },
        },
        {
          slots: {
            descricao: '<em data-test="descricao-custom">{{ params.item.valor }}</em>',
          },
        },
      );

      expect(wrapper.find('[data-test="descricao-custom"]').exists()).toBe(true);
    });

    it('renderiza slot "descricao--[nome]" para descrição específica', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João', idade: 30 },
        },
        {
          slots: {
            'descricao--nome': '<strong data-test="descricao-nome-custom">{{ params.item.valor }}</strong>',
          },
        },
      );

      expect(wrapper.find('[data-test="descricao-nome-custom"]').exists()).toBe(true);
    });

    it('slot específico tem prioridade sobre slot genérico', () => {
      const wrapper = montarComponente(
        {
          objeto: { nome: 'João' },
        },
        {
          slots: {
            termo: '<span data-test="termo-generico">Genérico</span>',
            'termo--nome': '<span data-test="termo-especifico">Específico</span>',
          },
        },
      );

      expect(wrapper.find('[data-test="termo-especifico"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="termo-generico"]').exists()).toBe(false);
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
            descricao: '<span data-test="descricao-slot">{{ params.item.valor }} - {{ params.item.metadados?.extra }}</span>',
          },
        },
      );

      expect(wrapper.find('[data-test="descricao-slot"]').text()).toContain('João');
    });
  });

  describe('títulos via schema Yup', () => {
    const schema = object({
      nome: string().label('Nome completo'),
      idade: number().label('Idade (anos)'),
      cidade: string(),
    });

    it('usa label do schema como título com objeto', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João', idade: 30 },
        schema,
      });

      const termos = wrapper.findAll('.description-list__term');
      expect(termos[0].text()).toBe('Nome completo');
      expect(termos[1].text()).toBe('Idade (anos)');
    });

    it('usa label do schema como título com lista', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', valor: 'João' },
          { chave: 'idade', valor: 30 },
        ],
        schema,
      });

      const termos = wrapper.findAll('.description-list__term');
      expect(termos[0].text()).toBe('Nome completo');
      expect(termos[1].text()).toBe('Idade (anos)');
    });

    it('título do item tem prioridade sobre schema', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', titulo: 'Título manual', valor: 'João' },
        ],
        schema,
      });

      expect(wrapper.find('.description-list__term').text()).toBe('Título manual');
    });

    it('título de itensSelecionados tem prioridade sobre schema', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
        itensSelecionados: [{ chave: 'nome', titulo: 'Nome dos campos' }],
        schema,
      });

      expect(wrapper.find('.description-list__term').text()).toBe('Nome dos campos');
    });

    it('exibe chave quando campo não tem label no schema', () => {
      const wrapper = montarComponente({
        objeto: { cidade: 'São Paulo' },
        schema,
      });

      expect(wrapper.find('.description-list__term').text()).toBe('cidade');
    });
  });

  describe('prop itensSelecionados', () => {
    it('filtra e ordena propriedades do objeto conforme itensSelecionados', () => {
      const wrapper = montarComponente({
        objeto: {
          nome: 'João', idade: 30, cidade: 'SP', email: 'j@j.com',
        },
        itensSelecionados: ['idade', 'nome'],
      });

      const itens = wrapper.findAll('.description-list__item');
      expect(itens).toHaveLength(2);

      const termos = wrapper.findAll('.description-list__term');
      expect(termos[0].text()).toBe('idade');
      expect(termos[1].text()).toBe('nome');
    });

    it('aceita strings simples como atalho para { chave: "..." }', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João', idade: 30 },
        itensSelecionados: ['nome'],
      });

      expect(wrapper.findAll('.description-list__item')).toHaveLength(1);
      expect(wrapper.find('.description-list__term').text()).toBe('nome');
      expect(wrapper.find('.description-list__description').text()).toBe('João');
    });

    it('aceita mistura de strings e objetos', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João', idade: 30 },
        itensSelecionados: [
          { chave: 'idade', titulo: 'Idade (anos)' },
          'nome',
        ],
      });

      const termos = wrapper.findAll('.description-list__term');
      expect(termos[0].text()).toBe('Idade (anos)');
      expect(termos[1].text()).toBe('nome');
    });

    it('ignora campos que não existem no objeto', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
        itensSelecionados: ['nome', 'inexistente'],
      });

      expect(wrapper.findAll('.description-list__item')).toHaveLength(1);
    });

    it('aplica larguraBase definida no campo', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
        itensSelecionados: [{ chave: 'nome', larguraBase: '20em' }],
      });

      const item = wrapper.find('.description-list__item');
      expect(item.attributes('style')).toContain('flex-basis: 20em');
    });

    it('aplica atributosDoItem definidos no campo', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João' },
        itensSelecionados: [{ chave: 'nome', atributosDoItem: { class: 'fb20em', 'data-test': 'campo-nome' } }],
      });

      const item = wrapper.find('.description-list__item');
      expect(item.classes()).toContain('fb20em');
      expect(item.attributes('data-test')).toBe('campo-nome');
    });

    it('exibe todas as propriedades do objeto quando itensSelecionados não é fornecido', () => {
      const wrapper = montarComponente({
        objeto: { nome: 'João', idade: 30, cidade: 'SP' },
      });

      expect(wrapper.findAll('.description-list__item')).toHaveLength(3);
    });

    it('larguraBase do item da lista tem prioridade sobre larguraBase do campo', () => {
      const wrapper = montarComponente({
        lista: [
          { chave: 'nome', valor: 'João', larguraBase: '30em' },
        ],
        itensSelecionados: [{ chave: 'nome', larguraBase: '10em' }],
      });

      const item = wrapper.find('.description-list__item');
      expect(item.attributes('style')).toContain('flex-basis: 30em');
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

  describe('propriedade larguraBase', () => {
    it('aplica flex-basis quando larguraBase é fornecida', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'nome',
            valor: 'João',
            larguraBase: '20em',
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      expect(item.attributes('style')).toContain('flex-basis: 20em');
    });

    it('aplica flex-basis com porcentagem', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'descricao',
            valor: 'Texto longo',
            larguraBase: '100%',
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      expect(item.attributes('style')).toContain('flex-basis: 100%');
    });

    it('preserva atributosDoItem.style existente quando adiciona larguraBase', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'nome',
            valor: 'João',
            larguraBase: '20em',
            atributosDoItem: {
              style: { color: 'red', fontSize: '14px' },
            },
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      const style = item.attributes('style');
      expect(style).toContain('flex-basis: 20em');
      expect(style).toContain('color: red');
      expect(style).toContain('font-size: 14px');
    });

    it('não aplica flex-basis quando larguraBase não é fornecida', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'nome',
            valor: 'João',
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      const style = item.attributes('style');
      expect(style || '').not.toContain('flex-basis');
    });

    it('permite múltiplos itens com larguraBase diferentes', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'id',
            valor: '123',
            larguraBase: '5em',
          },
          {
            chave: 'nome',
            valor: 'João',
            larguraBase: '20em',
          },
          {
            chave: 'descricao',
            valor: 'Texto longo',
            larguraBase: '100%',
          },
        ],
      });

      const items = wrapper.findAll('.description-list__item');
      expect(items[0].attributes('style')).toContain('flex-basis: 5em');
      expect(items[1].attributes('style')).toContain('flex-basis: 20em');
      expect(items[2].attributes('style')).toContain('flex-basis: 100%');
    });

    it('lida com atributosDoItem.style como string', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'nome',
            valor: 'João',
            larguraBase: '20em',
            atributosDoItem: {
              style: 'color: red;',
            },
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      const style = item.attributes('style');
      expect(style).toContain('color: red');
      expect(style).toContain('flex-basis: 20em');
    });

    it('lida com atributosDoItem.style como string sem ponto e vírgula final', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'nome',
            valor: 'João',
            larguraBase: '20em',
            atributosDoItem: {
              style: 'color: red',
            },
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      const style = item.attributes('style');
      expect(style).toContain('color: red');
      expect(style).toContain('flex-basis: 20em');
      expect(style).toMatch(/red;\s*flex-basis/);
    });

    it('lida com atributosDoItem.style como string com múltiplas propriedades', () => {
      const wrapper = montarComponente({
        lista: [
          {
            chave: 'nome',
            valor: 'João',
            larguraBase: '20em',
            atributosDoItem: {
              style: 'color: red; font-size: 14px;',
            },
          },
        ],
      });

      const item = wrapper.find('.description-list__item');
      const style = item.attributes('style');
      expect(style).toContain('color: red');
      expect(style).toContain('font-size: 14px');
      expect(style).toContain('flex-basis: 20em');
    });
  });
});
