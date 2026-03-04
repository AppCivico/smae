import { mount } from '@vue/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import AutocompleteField2 from './AutocompleteField2.vue';

vi.mock('vee-validate', () => ({
  useField: vi.fn(() => ({
    handleChange: vi.fn(),
  })),
}));

describe('AutocompleteField2', () => {
  const grupoMock = [
    { id: 1, nome: 'Item Um' },
    { id: 2, nome: 'Item Dois' },
    { id: 3, nome: 'Item Três' },
  ];

  const criarControlador = (participantes = []) => ({
    busca: '',
    participantes,
  });

  const montarComponente = (props = {}, options = {}) => mount(AutocompleteField2, {
    props: {
      controlador: criarControlador(),
      grupo: grupoMock,
      label: 'nome',
      ...props,
    },
    ...options,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderização', () => {
    it('renderiza o input de busca quando há opções', () => {
      const wrapper = montarComponente();

      expect(wrapper.find('input.inputtext').exists()).toBe(true);
    });

    it('renderiza mensagem quando não há opções disponíveis', () => {
      const wrapper = montarComponente({ grupo: [] });

      expect(wrapper.find('.mensagem-alerta').exists()).toBe(true);
      expect(wrapper.text()).toContain('Não há opções disponíveis');
    });

    it('renderiza a lista de opções filtradas', () => {
      const wrapper = montarComponente();

      const botoes = wrapper.findAll('ul button');
      expect(botoes).toHaveLength(3);
    });

    it('exibe o label correto para cada opção', () => {
      const wrapper = montarComponente();

      const botoes = wrapper.findAll('ul button');
      expect(botoes[0].text()).toBe('Item Um');
      expect(botoes[1].text()).toBe('Item Dois');
      expect(botoes[2].text()).toBe('Item Três');
    });

    it('renderiza participantes selecionados como tags', () => {
      const controlador = criarControlador([1, 2]);
      const wrapper = montarComponente({ controlador });

      const tags = wrapper.findAll('.tagsmall');
      expect(tags).toHaveLength(2);
    });

    it('renderiza participantes como span quando readonly', () => {
      const controlador = criarControlador([1]);
      const wrapper = montarComponente({ controlador, readonly: true });

      expect(wrapper.findAll('span.tagsmall')).toHaveLength(1);
      expect(wrapper.findAll('button.tagsmall')).toHaveLength(0);
    });
  });

  describe('filtragem', () => {
    it('filtra opções baseado no texto de busca', async () => {
      const wrapper = montarComponente();
      const input = wrapper.find('input.inputtext');

      await input.setValue('dois');

      const botoes = wrapper.findAll('ul button');
      expect(botoes).toHaveLength(1);
      expect(botoes[0].text()).toBe('Item Dois');
    });

    it('filtragem é case-insensitive', async () => {
      const wrapper = montarComponente();
      const input = wrapper.find('input.inputtext');

      await input.setValue('TRÊS');

      const botoes = wrapper.findAll('ul button');
      expect(botoes).toHaveLength(1);
      expect(botoes[0].text()).toBe('Item Três');
    });

    it('filtragem ignora diacríticos', async () => {
      const wrapper = montarComponente();
      const input = wrapper.find('input.inputtext');

      await input.setValue('tres');

      const botoes = wrapper.findAll('ul button');
      expect(botoes).toHaveLength(1);
      expect(botoes[0].text()).toBe('Item Três');
    });

    it('não exibe opções já selecionadas na lista', () => {
      const controlador = criarControlador([1]);
      const wrapper = montarComponente({ controlador });

      const botoes = wrapper.findAll('ul button');
      expect(botoes).toHaveLength(2);
      expect(botoes.map((b) => b.text())).not.toContain('Item Um');
    });
  });

  describe('seleção de itens', () => {
    it('adiciona item aos participantes ao clicar', async () => {
      const controlador = criarControlador();
      const wrapper = montarComponente({ controlador });

      const botao = wrapper.findAll('ul button')[0];
      await botao.trigger('click');

      expect(controlador.participantes).toContain(1);
    });

    it('emite evento change ao adicionar item', async () => {
      const controlador = criarControlador();
      const wrapper = montarComponente({ controlador });

      const botao = wrapper.findAll('ul button')[0];
      await botao.trigger('click');

      expect(wrapper.emitted('change')).toBeTruthy();
      expect(wrapper.emitted('change')[0][0]).toContain(1);
    });

    it('remove item dos participantes ao clicar na tag', async () => {
      const controlador = criarControlador([1, 2]);
      const wrapper = montarComponente({ controlador });

      const tag = wrapper.findAll('.tagsmall')[0];
      await tag.trigger('click');

      expect(controlador.participantes).not.toContain(1);
    });

    it('emite evento change ao remover item', async () => {
      const controlador = criarControlador([1, 2]);
      const wrapper = montarComponente({ controlador });

      const tag = wrapper.findAll('.tagsmall')[0];
      await tag.trigger('click');

      expect(wrapper.emitted('change')).toBeTruthy();
    });
  });

  describe('limite de participantes', () => {
    it('respeita o número máximo de participantes', async () => {
      const controlador = criarControlador([1]);
      const wrapper = montarComponente({
        controlador,
        numeroMaximoDeParticipantes: 1,
      });

      const botao = wrapper.findAll('ul button')[0];
      await botao.trigger('click');

      expect(controlador.participantes).toHaveLength(1);
    });

    it('define input como readonly quando limite é atingido', () => {
      const controlador = criarControlador([1]);
      const wrapper = montarComponente({
        controlador,
        numeroMaximoDeParticipantes: 1,
      });

      const input = wrapper.find('input.inputtext');
      expect(input.attributes('readonly')).toBeDefined();
    });
  });

  describe('navegação por teclado', () => {
    it('foca no primeiro botão ao pressionar ArrowDown no input', async () => {
      const wrapper = montarComponente();
      const input = wrapper.find('input.inputtext');
      const primeiroBotao = wrapper.findAll('ul button')[0];

      const focusSpy = vi.spyOn(primeiroBotao.element, 'focus');

      await input.trigger('keydown', { key: 'ArrowDown' });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('navega para o próximo botão com ArrowDown', async () => {
      const wrapper = montarComponente();
      const botoes = wrapper.findAll('ul button');
      const segundoBotao = botoes[1];

      const focusSpy = vi.spyOn(segundoBotao.element, 'focus');

      await botoes[0].trigger('keydown', { key: 'ArrowDown' });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('navega para o botão anterior com ArrowUp', async () => {
      const wrapper = montarComponente();
      const botoes = wrapper.findAll('ul button');
      const primeiroBotao = botoes[0];

      const focusSpy = vi.spyOn(primeiroBotao.element, 'focus');

      await botoes[1].trigger('keydown', { key: 'ArrowUp' });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('foca no input ao pressionar ArrowUp no primeiro botão', async () => {
      const wrapper = montarComponente();
      const input = wrapper.find('input.inputtext');
      const primeiroBotao = wrapper.findAll('ul button')[0];

      const focusSpy = vi.spyOn(input.element, 'focus');

      await primeiroBotao.trigger('keydown', { key: 'ArrowUp' });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('cicla para o primeiro botão ao pressionar ArrowDown no último', async () => {
      const wrapper = montarComponente();
      const botoes = wrapper.findAll('ul button');
      const primeiroBotao = botoes[0];
      const ultimoBotao = botoes[botoes.length - 1];

      const focusSpy = vi.spyOn(primeiroBotao.element, 'focus');

      await ultimoBotao.trigger('keydown', { key: 'ArrowDown' });

      expect(focusSpy).toHaveBeenCalled();
    });

    it('limpa busca e remove foco ao pressionar Escape', async () => {
      const controlador = criarControlador();
      controlador.busca = 'teste';
      const wrapper = montarComponente({ controlador });
      const input = wrapper.find('input.inputtext');

      const blurSpy = vi.spyOn(input.element, 'blur');

      await input.trigger('keyup', { key: 'Escape' });

      expect(controlador.busca).toBe('');
      expect(blurSpy).toHaveBeenCalled();
    });
  });

  describe('busca por Enter', () => {
    it('seleciona primeiro item correspondente ao pressionar Enter', async () => {
      const controlador = criarControlador();
      controlador.busca = 'dois';
      const wrapper = montarComponente({ controlador });

      const input = wrapper.find('input.inputtext');
      await input.trigger('keyup', { key: 'Enter', keyCode: 13 });

      expect(controlador.participantes).toContain(2);
      expect(controlador.busca).toBe('');
    });

    it('não seleciona nada se busca estiver vazia', async () => {
      const controlador = criarControlador();
      const wrapper = montarComponente({ controlador });

      const input = wrapper.find('input.inputtext');
      await input.trigger('keyup', { key: 'Enter', keyCode: 13 });

      expect(controlador.participantes).toHaveLength(0);
    });
  });

  describe('props', () => {
    it('aceita readonly para desabilitar interações', () => {
      const wrapper = montarComponente({ readonly: true });
      const input = wrapper.find('input.inputtext');

      expect(input.attributes('readonly')).toBeDefined();
    });

    it('emite array vazio quando retornarArrayVazio é true e grupo está vazio', () => {
      const wrapper = montarComponente({
        grupo: [],
        retornarArrayVazio: true,
      });

      expect(wrapper.emitted('change')).toBeTruthy();
      expect(wrapper.emitted('change')[0][0]).toEqual([]);
    });
  });

  describe('unique', () => {
    it('emite valor único (não array) ao selecionar item', async () => {
      const controlador = criarControlador();
      const wrapper = montarComponente({ controlador, unique: true });

      const botao = wrapper.findAll('ul button')[0];
      await botao.trigger('click');

      expect(wrapper.emitted('change')[0][0]).toBe(1);
    });

    it('limita seleção a um único item', async () => {
      const controlador = criarControlador([1]);
      const wrapper = montarComponente({ controlador, unique: true });

      const botao = wrapper.findAll('ul button')[0];
      await botao.trigger('click');

      expect(controlador.participantes).toHaveLength(1);
    });

    it('define input como readonly quando um item já está selecionado', () => {
      const controlador = criarControlador([1]);
      const wrapper = montarComponente({ controlador, unique: true });

      const input = wrapper.find('input.inputtext');
      expect(input.attributes('readonly')).toBeDefined();
    });

    it('emite null ao remover o item selecionado', async () => {
      const controlador = criarControlador([1]);
      const wrapper = montarComponente({ controlador, unique: true });

      const tag = wrapper.find('.tagsmall');
      await tag.trigger('click');

      const changeEvents = wrapper.emitted('change');
      expect(changeEvents[changeEvents.length - 1][0]).toBeNull();
    });

    it('emite null quando retornarArrayVazio é true e grupo está vazio', () => {
      const wrapper = montarComponente({
        grupo: [],
        retornarArrayVazio: true,
        unique: true,
      });

      expect(wrapper.emitted('change')[0][0]).toBeNull();
    });
  });

  describe('acessibilidade', () => {
    it('input tem aria-readonly quando readonly', () => {
      const wrapper = montarComponente({ readonly: true });
      const input = wrapper.find('input.inputtext');

      expect(input.attributes('aria-readonly')).toBe('true');
    });

    it('input desabilitado tem aria-disabled', () => {
      const wrapper = montarComponente({ grupo: [] });
      const input = wrapper.find('input.inputtext');

      expect(input.attributes('aria-disabled')).toBe('true');
    });

    it('input desabilitado tem aria-describedby apontando para alerta', () => {
      const wrapper = montarComponente({ grupo: [] });
      const input = wrapper.find('input.inputtext');

      expect(input.attributes('aria-describedby')).toBe('alerta');
    });

    it('alerta tem aria-live para leitores de tela', () => {
      const wrapper = montarComponente({ grupo: [] });
      const alerta = wrapper.find('#alerta');

      expect(alerta.attributes('aria-live')).toBe('polite');
    });

    it('botões de opção têm title com informação adicional', () => {
      const grupoComDescricao = [
        { id: 1, nome: 'Item', descricao: 'Descrição do item' },
      ];
      const wrapper = montarComponente({ grupo: grupoComDescricao });
      const botao = wrapper.find('ul button');

      expect(botao.attributes('title')).toBe('Descrição do item');
    });
  });
});
