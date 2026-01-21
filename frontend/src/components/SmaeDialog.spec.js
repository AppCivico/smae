import { mount } from '@vue/test-utils';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import SmaeDialog from './SmaeDialog.vue';

const mockRouterPush = vi.fn(() => Promise.resolve());
const mockRouterReplace = vi.fn(() => Promise.resolve());

let mockCurrentRoute = {
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockCurrentRoute),
  useRouter: vi.fn(() => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    currentRoute: {
      value: mockCurrentRoute,
    },
  })),
}));

vi.mock('@/stores/alert.store', () => ({
  useAlertStore: vi.fn(() => ({
    confirmAction: vi.fn((message, callback) => {
      callback();
    }),
  })),
}));

// Mock do HTMLDialogElement
HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();

describe('SmaeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentRoute = { query: {} };
  });

  const TituloDaPaginaStub = {
    template: '<div data-test="titulo-da-pagina"><slot /></div>',
  };

  const montarComponente = (props = {}, options = {}) => mount(SmaeDialog, {
    props: {
      id: 'teste',
      ...props,
    },
    global: {
      stubs: {
        Teleport: true,
        TituloDaPagina: TituloDaPaginaStub,
      },
      ...options.global,
    },
    ...options,
  });

  describe('renderização', () => {
    it('não renderiza o diálogo quando query.dialogo não corresponde ao id', () => {
      mockCurrentRoute.query = { dialogo: 'outro' };

      const wrapper = montarComponente();

      expect(wrapper.find('dialog').exists()).toBe(false);
    });

    it('renderiza o diálogo quando query.dialogo corresponde ao id', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente();

      expect(wrapper.find('dialog').exists()).toBe(true);
    });

    it('renderiza o título corretamente', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({ titulo: 'Meu Título' });
      const tituloDaPagina = wrapper.find('[data-test="titulo-da-pagina"]');

      expect(tituloDaPagina.text()).toContain('Meu Título');
    });

    it('renderiza o subtítulo quando fornecido', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({ subtitulo: 'Meu Subtítulo' });

      expect(wrapper.text()).toContain('Meu Subtítulo');
    });

    it('gera o id correto no elemento dialog', () => {
      mockCurrentRoute.query = { dialogo: 'meu-dialogo' };

      const wrapper = montarComponente({ id: 'meu-dialogo' });

      expect(wrapper.find('dialog').attributes('id')).toBe('smae-dialog-meu-dialogo');
    });

    it('aplica classe tamanhoAjustavel quando prop é true', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({ tamanhoAjustavel: true });

      expect(wrapper.find('dialog').classes()).toContain('editModal--tamanho-ajustavel');
    });

    it('renderiza o backdrop quando diálogo está aberto', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente();

      expect(wrapper.find('.smae-dialog-backdrop').exists()).toBe(true);
    });

    it('possui atributo closedby="any"', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente();

      expect(wrapper.find('dialog').attributes('closedby')).toBe('any');
    });
  });

  describe('fechamento', () => {
    it('emite evento dialogo-fechado ao clicar no botão fechar', async () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente();
      const botaoFechar = wrapper.find('[aria-label="Fechar diálogo"]');

      await botaoFechar.trigger('click');

      expect(wrapper.emitted('dialogo-fechado')).toBeTruthy();
    });

    it('emite evento dialogo-fechado ao clicar no backdrop', async () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente();
      const backdrop = wrapper.find('.smae-dialog-backdrop');

      await backdrop.trigger('click');

      expect(wrapper.emitted('dialogo-fechado')).toBeTruthy();
    });

    it('remove query parameter dialogo ao fechar', async () => {
      mockCurrentRoute.query = { dialogo: 'teste', outroParam: 'valor' };

      const wrapper = montarComponente();
      const botaoFechar = wrapper.find('[aria-label="Fechar diálogo"]');

      await botaoFechar.trigger('click');

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.not.objectContaining({
            dialogo: expect.anything(),
          }),
        }),
      );
    });

    it('remove parâmetros associados ao fechar', async () => {
      mockCurrentRoute.query = {
        dialogo: 'teste',
        itemId: '123',
        modo: 'edicao',
        outroParam: 'manter',
      };

      const wrapper = montarComponente({
        parametrosAssociados: ['itemId', 'modo'],
      });
      const botaoFechar = wrapper.find('[aria-label="Fechar diálogo"]');

      await botaoFechar.trigger('click');

      const chamada = mockRouterPush.mock.calls[0][0];
      expect(chamada.query.dialogo).toBeUndefined();
      expect(chamada.query.itemId).toBeUndefined();
      expect(chamada.query.modo).toBeUndefined();
      expect(chamada.query.outroParam).toBe('manter');
    });

    it('chama confirmAction quando confirmarFechamento é true', async () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const mockConfirmAction = vi.fn((message, callback) => {
        callback();
      });

      vi.mocked(await import('@/stores/alert.store')).useAlertStore.mockReturnValue({
        confirmAction: mockConfirmAction,
      });

      const wrapper = montarComponente({ confirmarFechamento: true });
      const botaoFechar = wrapper.find('[aria-label="Fechar diálogo"]');

      await botaoFechar.trigger('click');

      expect(mockConfirmAction).toHaveBeenCalledWith(
        'Deseja sair sem salvar as alterações?',
        expect.any(Function),
      );
    });
  });

  describe('slots', () => {
    it('renderiza conteúdo no slot default', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({}, {
        slots: {
          default: '<p data-test="conteudo">Conteúdo do diálogo</p>',
        },
      });

      expect(wrapper.find('[data-test="conteudo"]').exists()).toBe(true);
      expect(wrapper.text()).toContain('Conteúdo do diálogo');
    });

    it('expõe função fecharDialogo no scoped slot', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({}, {
        slots: {
          default: `
            <template #default="{ fecharDialogo }">
              <button data-test="fechar-custom" @click="fecharDialogo">Fechar</button>
            </template>
          `,
        },
      });

      expect(wrapper.find('[data-test="fechar-custom"]').exists()).toBe(true);
    });

    it('renderiza slot de título personalizado', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({}, {
        slots: {
          titulo: '<h2 data-test="titulo-custom">Título Personalizado</h2>',
        },
      });

      expect(wrapper.find('[data-test="titulo-custom"]').exists()).toBe(true);
    });

    it('renderiza slot de subtítulo personalizado', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({}, {
        slots: {
          subtitulo: '<span data-test="subtitulo-custom">Subtítulo Personalizado</span>',
        },
      });

      expect(wrapper.find('[data-test="subtitulo-custom"]').exists()).toBe(true);
    });
  });

  describe('acessibilidade', () => {
    it('botão de fechar tem aria-label', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente();
      const botaoFechar = wrapper.find('button.botao-fechar-dialogo');

      expect(botaoFechar.attributes('aria-label')).toBe('Fechar diálogo');
    });

    it('subtítulo tem role="doc-subtitle"', () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente({ subtitulo: 'Meu Subtítulo' });
      const subtitulo = wrapper.find('[role="doc-subtitle"]');

      expect(subtitulo.exists()).toBe(true);
    });
  });

  describe('ciclo de vida', () => {
    it('chama showModal ao montar quando diálogo está aberto', async () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      montarComponente();

      await vi.waitFor(() => {
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
      });
    });

    it('chama close ao fechar o diálogo', async () => {
      mockCurrentRoute.query = { dialogo: 'teste' };

      const wrapper = montarComponente();
      const botaoFechar = wrapper.find('[aria-label="Fechar diálogo"]');

      await botaoFechar.trigger('click');

      expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });
  });
});
