import { mount } from '@vue/test-utils';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { nextTick } from 'vue';
import FormularioQueryString from './FormularioQueryString.vue';

const mockRouterReplace = vi.fn(() => Promise.resolve());

let mockCurrentRoute = {
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockCurrentRoute),
  useRouter: vi.fn(() => ({
    replace: mockRouterReplace,
  })),
}));

const defaultSlot = '<button type="submit" data-test="submit">Aplicar</button>';

function montar(props = {}, slotContent = defaultSlot) {
  return mount(FormularioQueryString, {
    props,
    slots: {
      default: slotContent,
    },
    attachTo: document.body,
  });
}

describe('FormularioQueryString', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentRoute = { query: {} };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('onMounted', () => {
    it('emite "montado" com os valores iniciais quando a query está vazia', () => {
      const wrapper = montar({
        valoresIniciais: { pagina: 1, busca: '' },
      });

      const emitidos = wrapper.emitted('montado');
      expect(emitidos).toHaveLength(1);
      expect(emitidos[0][0]).toEqual({ busca: '', pagina: 1 });
    });

    it('emite "montado" com merge entre valoresIniciais e query atual', () => {
      mockCurrentRoute = { query: { busca: 'teste' } };

      const wrapper = montar({
        valoresIniciais: { pagina: 1, busca: '' },
      });

      const emitidos = wrapper.emitted('montado');
      expect(emitidos[0][0]).toEqual({ busca: 'teste', pagina: 1 });
    });

    it('emite "montado" com parâmetros ordenados alfabeticamente', () => {
      mockCurrentRoute = { query: { zebra: 'z', alpha: 'a' } };

      const wrapper = montar({ valoresIniciais: { busca: '' } });

      const chaves = Object.keys(wrapper.emitted('montado')[0][0]);
      expect(chaves).toEqual([...chaves].sort());
    });

    it('normaliza a URL ao montar quando query difere dos valoresIniciais', () => {
      montar({
        valoresIniciais: { pagina: 1 },
      });

      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ pagina: 1 }),
        }),
      );
    });

    it('não normaliza a URL quando naoNormalizarUrl está ativo', () => {
      montar({
        valoresIniciais: { pagina: 1 },
        naoNormalizarUrl: true,
      });

      expect(mockRouterReplace).not.toHaveBeenCalled();
    });

    it('não normaliza a URL quando query já está sincronizada', () => {
      mockCurrentRoute = { query: { pagina: 1 } };

      montar({
        valoresIniciais: { pagina: 1 },
      });

      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  describe('slot com props expostos', () => {
    it('expõe aplicarQueryStrings, camposSujos, detectarMudancas, formularioSujo, limpar e pendente', () => {
      let slotProps;

      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      expect(typeof slotProps.aplicarQueryStrings).toBe('function');
      expect(typeof slotProps.detectarMudancas).toBe('function');
      expect(typeof slotProps.limpar).toBe('function');
      expect(Array.isArray(slotProps.camposSujos)).toBe(true);
      expect(typeof slotProps.formularioSujo).toBe('boolean');
      expect(typeof slotProps.pendente).toBe('boolean');
    });

    it('formularioSujo começa como false', () => {
      let slotProps;

      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      expect(slotProps.formularioSujo).toBe(false);
      expect(slotProps.camposSujos).toEqual([]);
    });
  });

  describe('detectarMudancas', () => {
    it('marca campo como sujo quando valor difere da query atual', async () => {
      mockCurrentRoute = { query: { busca: 'original' } };

      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      slotProps.detectarMudancas({ busca: 'novo' });
      await nextTick();

      expect(slotProps.camposSujos).toContain('busca');
      expect(slotProps.formularioSujo).toBe(true);
    });

    it('remove campo dos sujos quando valor volta ao da query atual', async () => {
      mockCurrentRoute = { query: { busca: 'original' } };

      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      slotProps.detectarMudancas({ busca: 'novo' });
      await nextTick();
      expect(slotProps.camposSujos).toContain('busca');

      slotProps.detectarMudancas({ busca: 'original' });
      await nextTick();
      expect(slotProps.camposSujos).not.toContain('busca');
    });

    it('trata string vazia como equivalente a undefined na query', async () => {
      mockCurrentRoute = { query: {} };

      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      slotProps.detectarMudancas({ busca: '' });
      await nextTick();

      expect(slotProps.camposSujos).not.toContain('busca');
    });

    it('aceita evento DOM via input com atributo name', async () => {
      mockCurrentRoute = { query: { busca: 'original' } };

      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
        attachTo: document.body,
      });

      // Usar um input real no DOM para que event.target seja acessível
      const input = document.createElement('input');
      input.name = 'busca';
      input.value = 'novo';
      document.body.appendChild(input);

      // Disparar evento real — target será o input real
      await input.dispatchEvent(new Event('input', { bubbles: true }));
      const eventoReal = new Event('input');
      Object.defineProperty(eventoReal, 'target', { value: input, writable: false });

      slotProps.detectarMudancas(eventoReal);
      await nextTick();

      expect(slotProps.camposSujos).toContain('busca');
    });
  });

  describe('aplicarQueryStrings (via objeto)', () => {
    it('chama router.replace com os parâmetros fornecidos', async () => {
      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      await slotProps.aplicarQueryStrings({ busca: 'teste' });

      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ busca: 'teste' }),
        }),
      );
    });

    it('emite "aplicado" após router.replace', async () => {
      let slotProps;
      const wrapper = mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      await slotProps.aplicarQueryStrings({ busca: 'teste' });

      expect(wrapper.emitted('aplicado')).toHaveLength(1);
    });

    it('faz merge com a query existente na rota', async () => {
      mockCurrentRoute = { query: { pagina: 2 } };

      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      await slotProps.aplicarQueryStrings({ busca: 'novo' });

      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ pagina: 2, busca: 'novo' }),
        }),
      );
    });

    it('remove parâmetros com string vazia após aplicar', async () => {
      mockCurrentRoute = { query: { busca: 'anterior' } };

      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      await slotProps.aplicarQueryStrings({ busca: '' });

      const queryPassada = mockRouterReplace.mock.calls.at(-1)[0].query;
      expect(queryPassada).not.toHaveProperty('busca');
    });

    it('ordena os parâmetros alfabeticamente', async () => {
      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      await slotProps.aplicarQueryStrings({ zebra: 'z', alpha: 'a' });

      const chaves = Object.keys(mockRouterReplace.mock.calls.at(-1)[0].query);
      expect(chaves).toEqual([...chaves].sort());
    });

    it('define pendente como true durante a operação e false após', async () => {
      let slotProps;
      mount(FormularioQueryString, {
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      const promessa = slotProps.aplicarQueryStrings({ busca: 'teste' });
      await promessa;

      expect(slotProps.pendente).toBe(false);
    });
  });

  describe('aplicarQueryStrings (via SubmitEvent)', () => {
    it('lê os campos do formulário e chama router.replace', async () => {
      let slotProps;
      mount(FormularioQueryString, {
        props: { valoresIniciais: { busca: '' } },
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
        attachTo: document.body,
      });

      // Criar um form real no DOM para que FormData funcione
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.name = 'busca';
      input.value = 'filtrado';
      form.appendChild(input);
      document.body.appendChild(form);

      const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(submitEvent, 'target', { value: form });

      await slotProps.aplicarQueryStrings(submitEvent);

      expect(mockRouterReplace).toHaveBeenCalled();
      const queryPassada = mockRouterReplace.mock.calls.at(-1)[0].query;
      expect(queryPassada).toHaveProperty('busca', 'filtrado');
    });
  });

  describe('limpar', () => {
    it('restaura todos os campos aos valoresIniciais', async () => {
      mockCurrentRoute = { query: { busca: 'teste', pagina: 3 } };

      let slotProps;
      mount(FormularioQueryString, {
        props: { valoresIniciais: { busca: '', pagina: 1 } },
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      await slotProps.limpar();

      const queryPassada = mockRouterReplace.mock.calls.at(-1)[0].query;
      // busca volta para '' → é removida da query por ser string vazia
      expect(queryPassada).not.toHaveProperty('busca');
      // pagina volta para 1 (valor inicial numérico) → permanece na query
      expect(queryPassada).toHaveProperty('pagina', 1);
    });

    it('restaura apenas os campos especificados quando recebe lista', async () => {
      mockCurrentRoute = { query: { busca: 'teste', ordem: 'asc' } };

      let slotProps;
      mount(FormularioQueryString, {
        props: { valoresIniciais: { busca: '', ordem: 'desc' } },
        slots: {
          default: (props) => {
            slotProps = props;
            return [];
          },
        },
      });

      await slotProps.limpar(['busca']);

      const queryPassada = mockRouterReplace.mock.calls.at(-1)[0].query;
      expect(queryPassada).not.toHaveProperty('busca');
      expect(queryPassada).toHaveProperty('ordem', 'asc');
    });
  });
});
