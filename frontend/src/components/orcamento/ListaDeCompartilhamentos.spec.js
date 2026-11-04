import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

import requestS from '@/helpers/requestS.ts';

import ListaDeCompartilhamentos from './ListaDeCompartilhamentos.vue';

const DOTACAO = '16.24.10.302.3003.2.873.33903900.00';

let mockCurrentRoute;

vi.mock('vue-router', () => ({
  useRoute: () => mockCurrentRoute,
}));

vi.mock('@/helpers/requestS.ts', () => ({
  default: { get: vi.fn() },
}));

const SmaeLinkStub = {
  props: { to: { type: [Object, String], default: '' } },
  template: '<a :data-rota="JSON.stringify(to)"><slot /></a>',
};

function montar(props = {}) {
  return mount(ListaDeCompartilhamentos, {
    props: { ano: 2026, dotação: DOTACAO, ...props },
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: {
        CheckClose: true,
        ErrorComponent: true,
        LoadingComponent: true,
        SmaeLink: SmaeLinkStub,
        SmallModal: { template: '<div class="modal"><slot /></div>' },
      },
    },
  });
}

describe('ListaDeCompartilhamentos', () => {
  beforeEach(() => {
    requestS.get.mockResolvedValue({ linhas: [] });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('em transferências', () => {
    beforeEach(() => {
      mockCurrentRoute = {
        meta: { entidadeMãe: 'TransferenciasVoluntarias' },
        params: { transferenciaId: 317 },
      };
    });

    it('busca pela transferência, sem exigir nem enviar o PdM', async () => {
      montar({ idDoItem: 12, processo: '6016.2026/0000001-1' });
      await flushPromises();

      expect(requestS.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/transferencia\/317\/orcamento-realizado\/compartilhados$/),
        {
          ano_referencia: 2026,
          dotacao: DOTACAO,
          not_id: 12,
          processo: '6016202600000011',
        },
      );
    });

    it('não busca sem uma dotação válida', async () => {
      montar({ dotação: '16.24' });
      await flushPromises();

      expect(requestS.get).not.toHaveBeenCalled();
    });

    it('identifica transferências e distribuições, com links para elas', async () => {
      requestS.get.mockResolvedValue({
        linhas: [
          {
            id: 1,
            transferencia_id: 40,
            transferencia: { id: 40, identificador: 'TR-40' },
            distribuicao_recurso: null,
            itens: [],
          },
          {
            id: 2,
            transferencia_id: 41,
            transferencia: { id: 41, identificador: 'TR-41' },
            distribuicao_recurso: { id: 7, nome: null, objeto: 'Compra de ônibus' },
            itens: [],
          },
        ],
      });

      const wrapper = montar();
      await flushPromises();

      expect(wrapper.text()).toContain('Essa dotação possui 2 compartilhamentos.');

      await wrapper.find('button').trigger('click');

      const links = wrapper.findAll('.modal a');

      expect(links.map((x) => x.text())).toEqual([
        'transferência - TR-40',
        'distribuição - TR-41 - Compra de ônibus',
      ]);
      // ambos levam à execução orçamentária da transferência de origem
      expect(JSON.parse(links[0].attributes('data-rota'))).toEqual({
        name: 'TransferenciaOrcamentoRealizado',
        params: { transferenciaId: 40 },
      });
      expect(JSON.parse(links[1].attributes('data-rota'))).toEqual({
        name: 'TransferenciaOrcamentoRealizado',
        params: { transferenciaId: 41 },
      });
    });
  });

  describe('no PdM', () => {
    beforeEach(() => {
      mockCurrentRoute = { meta: { entidadeMãe: 'pdm' }, params: {} };
    });

    it('continua enviando o PdM', async () => {
      montar({ pdm: 5 });
      await flushPromises();

      expect(requestS.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/orcamento-realizado\/compartilhados-no-pdm$/),
        { pdm_id: 5, ano_referencia: 2026, dotacao: DOTACAO },
      );
    });

    it('continua exigindo o PdM', async () => {
      montar();
      await flushPromises();

      expect(requestS.get).not.toHaveBeenCalled();
    });
  });
});
