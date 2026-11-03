import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { defineComponent, h } from 'vue';

import FiltroPorOrgaoEUnidade from '@/components/orcamento/FiltroPorOrgaoEUnidade.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

import OrcamentosLista from './OrcamentosLista.vue';

const mockCurrentRoute = {
  meta: {
    rotaParaEdição: 'TransferenciaOrcamentoRealizadoPorId',
    rotasParaAdição: [
      { texto: 'Dotação', nome: 'TransferenciaOrcamentoRealizadoPorDotacao' },
      { texto: 'Processo', nome: 'TransferenciaOrcamentoRealizadoPorProcesso' },
    ],
  },
};

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockCurrentRoute),
}));

const anoCorrente = new Date().getUTCFullYear();

// renderiza as ações, para garantir que a lista não injete nada nelas
const CabecalhoStub = defineComponent({
  setup(_, { slots }) {
    return () => h('header', { 'data-test': 'cabecalho' }, slots.acoes?.());
  },
});

const registros = [
  {
    id: 1,
    ano_referencia: anoCorrente - 1,
    dotacao: '16.10.12.361.3010.2.873.33903900.00',
    soma_valor_empenho: '100',
    soma_valor_liquidado: '50',
    itens: [],
    pode_editar: true,
  },
  {
    id: 2,
    ano_referencia: anoCorrente,
    dotacao: '16.10.12.361.3010.2.873.33903900.00',
    processo: '6016.2024/0000001-1',
    soma_valor_empenho: '200',
    soma_valor_liquidado: '0',
    itens: [],
    pode_editar: false,
    distribuicao_recurso: { id: 7, nome: 'Reforma da UBS' },
  },
];

// o SmaeTable não aceita atributos por linha; os grupos são marcados por classe
const linhasDaTabela = (wrapper) => wrapper.findAll('tbody tr.smae-table__linha');
const ehLinhaDeGrupo = (linha) => linha.classes('linha-de-grupo');
const linhasDeRegistro = (wrapper) => linhasDaTabela(wrapper).filter((x) => !ehLinhaDeGrupo(x));
const anoDaLinha = (linha) => Number(linha.findAll('td')[0].text());

// cada registro pertence à linha de grupo que o antecede
function registrosPorGrupo(wrapper) {
  const grupos = new Map();
  let rotuloAtual;

  linhasDaTabela(wrapper).forEach((linha) => {
    if (ehLinhaDeGrupo(linha)) {
      rotuloAtual = linha.findAll('td')[1].text();
      grupos.set(rotuloAtual, { linha, registros: [] });
    } else {
      grupos.get(rotuloAtual).registros.push(linha);
    }
  });

  return grupos;
}

function montar({
  podeEditar = true,
  porAno = {
    [anoCorrente - 1]: [registros[0]],
    [anoCorrente]: [registros[1]],
  },
} = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn });

  const orcamentosStore = useOrcamentosStore();
  orcamentosStore.buscarTodosOsOrcamentosRealizados.mockImplementation(async () => {
    orcamentosStore.OrcamentoRealizado = porAno;
  });

  return mount(OrcamentosLista, {
    props: { podeEditar },
    global: {
      plugins: [pinia],
      stubs: {
        SmaeLink: RouterLinkStub,
        CabecalhoDePagina: CabecalhoStub,
        LoadingComponent: true,
        ErrorComponent: true,
      },
    },
  });
}

describe('OrcamentosLista de transferências', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('busca a execução sem filtrar por ano', async () => {
    montar();
    await flushPromises();

    expect(useOrcamentosStore().buscarTodosOsOrcamentosRealizados)
      .toHaveBeenCalledWith();
  });

  it('lista registros de todos os anos, do mais recente ao mais antigo', async () => {
    const wrapper = montar({
      porAno: {
        [anoCorrente - 1]: [registros[0]],
        [anoCorrente]: [{ ...registros[1], id: 9, distribuicao_recurso: null }],
      },
    });
    await flushPromises();

    expect(linhasDeRegistro(wrapper).map(anoDaLinha)).toEqual([anoCorrente, anoCorrente - 1]);
  });

  describe('hierarquia', () => {
    const daUbs = { id: 7, nome: 'Reforma da UBS', objeto: null };
    const daEscola = { id: 8, nome: null, objeto: 'Ampliação da escola' };

    function montarComDistribuicoes() {
      return montar({
        porAno: {
          [anoCorrente - 1]: [
            registros[0],
            {
              ...registros[0], id: 11, soma_valor_empenho: '10', distribuicao_recurso: daUbs,
            },
          ],
          [anoCorrente]: [
            { ...registros[1], id: 12, distribuicao_recurso: daUbs },
            { ...registros[1], id: 13, distribuicao_recurso: daEscola },
          ],
        },
      });
    }

    it('mostra a transferência primeiro e depois as distribuições, em ordem alfabética', async () => {
      const wrapper = montarComDistribuicoes();
      await flushPromises();

      expect([...registrosPorGrupo(wrapper).keys()])
        .toEqual(['Transferência', 'Ampliação da escola', 'Reforma da UBS']);
    });

    it('agrupa os registros sob sua distribuição, do mais recente ao mais antigo', async () => {
      const wrapper = montarComDistribuicoes();
      await flushPromises();

      const grupos = registrosPorGrupo(wrapper);

      expect(grupos.get('Reforma da UBS').registros.map(anoDaLinha))
        .toEqual([anoCorrente, anoCorrente - 1]);
      expect(grupos.get('Transferência').registros).toHaveLength(1);
    });

    it('soma cada grupo separadamente', async () => {
      const wrapper = montarComDistribuicoes();
      await flushPromises();

      const grupos = registrosPorGrupo(wrapper);

      // registros[1] empenha 200; o registro 11, 10
      expect(grupos.get('Reforma da UBS').linha.text()).toContain('210');
      expect(grupos.get('Transferência').linha.text()).toContain('100');
    });

    it('alinha os valores como números, nos registros, nos grupos e no cabeçalho', async () => {
      const wrapper = montarComDistribuicoes();
      await flushPromises();

      const [linhaDoGrupo] = linhasDaTabela(wrapper);
      const [registro] = linhasDeRegistro(wrapper);
      const cabecalhos = wrapper.findAll('thead th');

      [linhaDoGrupo, registro].forEach((linha) => {
        const celulas = linha.findAll('td');
        expect(celulas[2].classes()).toContain('cell--number');
        expect(celulas[3].classes()).toContain('cell--number');
        expect(celulas[1].classes()).not.toContain('cell--number');
      });
      expect(cabecalhos[2].classes()).toContain('cell--number');
      expect(cabecalhos[3].classes()).toContain('cell--number');
    });

    it('linhas de grupo não têm ano nem ações', async () => {
      const wrapper = montarComDistribuicoes();
      await flushPromises();

      const linhaDoGrupo = registrosPorGrupo(wrapper).get('Reforma da UBS').linha;

      expect(linhaDoGrupo.findAll('td')[0].text()).toBe('');
      expect(linhaDoGrupo.findAll('td')[4].text()).toBe('');
      expect(linhaDoGrupo.find('[data-test^="editar-"]').exists()).toBe(false);
      expect(linhaDoGrupo.find('[data-test^="excluir-"]').exists()).toBe(false);
    });

    it('omite o grupo da transferência quando todos os registros são de distribuições', async () => {
      const wrapper = montar({
        porAno: { [anoCorrente]: [{ ...registros[1], distribuicao_recurso: daUbs }] },
      });
      await flushPromises();

      expect([...registrosPorGrupo(wrapper).keys()]).toEqual(['Reforma da UBS']);
    });
  });

  it('só oferece edição para registros editáveis', async () => {
    const wrapper = montar();
    await flushPromises();

    expect(wrapper.find('[data-test="editar-2"]').exists()).toBe(false);
    expect(wrapper.findComponent('[data-test="editar-1"]').props('to')).toEqual({
      name: 'TransferenciaOrcamentoRealizadoPorId',
      params: { id: 1 },
    });
  });

  it('não oferece filtro por ano', async () => {
    const wrapper = montar();
    await flushPromises();

    // o único seletor da lista é o filtro por dotação
    expect(wrapper.findAll('select').map((x) => x.attributes('id'))).toEqual(['prefixo-escolhido']);
  });

  it('põe a inclusão depois do cabeçalho, não dentro dele', async () => {
    const wrapper = montar();
    await flushPromises();

    expect(wrapper.find('[data-test="cabecalho"] [data-test="incluir-Dotação"]').exists())
      .toBe(false);
    expect(wrapper.find('[data-test="incluir-Dotação"]').exists()).toBe(true);
  });

  it('leva à inclusão sem ano na rota', async () => {
    const wrapper = montar();
    await flushPromises();

    expect(wrapper.findComponent('[data-test="incluir-Processo"]').props('to')).toEqual({
      name: 'TransferenciaOrcamentoRealizadoPorProcesso',
    });
  });

  it('sem permissão de edição, não oferece inclusão nem edição', async () => {
    const wrapper = montar({ podeEditar: false });
    await flushPromises();

    expect(wrapper.find('[data-test="incluir-Dotação"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="editar-1"]').exists()).toBe(false);
  });

  describe('exclusão', () => {
    it('só aparece em registros editáveis', async () => {
      const wrapper = montar();
      await flushPromises();

      expect(wrapper.find('[data-test="excluir-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="excluir-2"]').exists()).toBe(false);
    });

    it('não aparece sem permissão de edição', async () => {
      const wrapper = montar({ podeEditar: false });
      await flushPromises();

      expect(wrapper.find('[data-test="excluir-1"]').exists()).toBe(false);
    });

    it('pede confirmação, remove e recarrega a lista', async () => {
      const wrapper = montar();
      await flushPromises();

      const alertStore = useAlertStore();
      const orcamentosStore = useOrcamentosStore();
      orcamentosStore.deleteOrcamentoRealizado.mockResolvedValue(true);

      await wrapper.find('[data-test="excluir-1"]').trigger('click');

      expect(orcamentosStore.deleteOrcamentoRealizado).not.toHaveBeenCalled();
      expect(alertStore.confirmAction.mock.calls[0][0]).toBe('Deseja mesmo remover esse item?');

      const confirmar = alertStore.confirmAction.mock.calls[0][1];
      await confirmar();
      await flushPromises();

      expect(orcamentosStore.deleteOrcamentoRealizado).toHaveBeenCalledWith(1);
      expect(orcamentosStore.buscarTodosOsOrcamentosRealizados).toHaveBeenCalledTimes(2);
      expect(alertStore.success).toHaveBeenCalledWith('Item removido');
    });

    it('avisa quando o registro tem vínculos', async () => {
      const wrapper = montar({
        porAno: { [anoCorrente]: [{ ...registros[0], possui_vinculos: true }] },
      });
      await flushPromises();

      await wrapper.find('[data-test="excluir-1"]').trigger('click');

      expect(useAlertStore().confirmAction.mock.calls[0][0]).toMatch(/possui vínculos/);
    });
  });

  describe('filtro por dotação', () => {
    const outraDotacao = {
      id: 3,
      ano_referencia: anoCorrente - 2,
      dotacao: '84.22.10.304.3003.2.522.33903900.00',
      soma_valor_empenho: '700',
      soma_valor_liquidado: '1',
      itens: [],
      pode_editar: true,
    };

    function montarComTresDotacoes() {
      return montar({
        porAno: {
          [anoCorrente - 2]: [outraDotacao],
          [anoCorrente - 1]: [registros[0]],
          [anoCorrente]: [registros[1]],
        },
      });
    }

    it('reúne órgão e unidade de todos os anos', async () => {
      const wrapper = montarComTresDotacoes();
      await flushPromises();

      const filtro = wrapper.findComponent(FiltroPorOrgaoEUnidade);

      expect(filtro.props('lista')).toHaveLength(3);
      expect(filtro.props('ano')).toBe(anoCorrente);
    });

    it('filtra linhas e totais pelo prefixo escolhido', async () => {
      const wrapper = montarComTresDotacoes();
      await flushPromises();

      await wrapper.findComponent(FiltroPorOrgaoEUnidade).vm.$emit('update:modelValue', '84.22');

      const linhas = linhasDeRegistro(wrapper);
      expect(linhas).toHaveLength(1);
      expect(linhas[0].text()).toContain('84.22.10.304');
      const totais = wrapper.findComponent(SmaeDescriptionList).text();
      expect(totais).toContain('700');
      expect(totais).not.toContain('1.000');
    });

    it('não aparece com um único registro', async () => {
      const wrapper = montar({ porAno: { [anoCorrente]: [registros[1]] } });
      await flushPromises();

      expect(wrapper.findComponent(FiltroPorOrgaoEUnidade).exists()).toBe(false);
    });
  });

  it('exibe os totais de todos os anos', async () => {
    const wrapper = montar();
    await flushPromises();

    const listaDeTotais = wrapper.findComponent(SmaeDescriptionList);

    expect(listaDeTotais.props('lista')).toEqual([
      expect.objectContaining({ chave: 'empenho', titulo: 'Empenho:' }),
      expect.objectContaining({ chave: 'liquidacao', titulo: 'Liquidação:' }),
    ]);
    // termo e valor na mesma linha, sem as classes padrão do componente
    expect(listaDeTotais.find('[aria-field="empenho"]').classes()).toContain('flex');
    expect(listaDeTotais.find('[aria-field="empenho"] dt').classes())
      .toEqual(['description-list__term', 't12', 'w700', 'tc300']);
    expect(listaDeTotais.find('[aria-field="empenho"] dd').classes())
      .toEqual(['description-list__description', 't12', 'w700']);
    expect(listaDeTotais.find('[aria-field="empenho"]').text()).toContain('300');
    expect(listaDeTotais.find('[aria-field="liquidacao"]').text()).toContain('50');
  });
});
