import type {
  PainelParlamentarDto,
  PainelParlamentarTransferenciaDto,
} from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { shallowReactive } from 'vue';

import ParlamentarDetalhePainel from './ParlamentarDetalhePainel.vue';

const painel = {
  parlamentar: { id: 2 },
  transferencias: { total: 20, em_andamento: 12 },
  recurso: {
    valor_disponibilizado: 55080000,
    valor_utilizado: 39657600,
    pct_utilizado: 72,
  },
  participacao_municipio: { valor_parlamentar: 37, valor_total: 100, pct: 37 },
  por_secretaria: [
    {
      orgao: { id: 10, sigla: 'SEME', descricao: 'Secretaria de Esportes' },
      rotulo: 'SEME',
      outros: false,
      valor: 800000,
      pct: 80,
    },
    {
      orgao: null, rotulo: 'Outros', outros: true, valor: 1000, pct: 1,
    },
  ],
  por_partido: [
    {
      partido: { id: 3, sigla: 'PSOL', nome: 'Partido Socialismo e Liberdade' },
      rotulo: 'PSOL',
      outros: false,
      valor: 900000,
      pct: 90,
    },
  ],
} as unknown as PainelParlamentarDto;

const transferencia = {
  id: 7,
  identificador: '7/2024',
  objeto: 'Computadores para creches',
  valor_repasse: 1000000,
  valor_distribuido: 600000,
  valor_parlamentar: 300000,
  etapa: null,
  fase: null,
  fase_status: null,
  distribuicoes: [
    {
      id: 70,
      nome: 'Distribuição para creches',
      objeto: 'Computadores',
      orgao: { id: 10, sigla: 'SETRI', descricao: 'Secretaria de Relações' },
      situacao: 'Em andamento',
      contabilizada: true,
      valor: 600000,
      valor_parlamentar: 300000,
      pct_parlamentar: 50,
    },
  ],
} as unknown as PainelParlamentarTransferenciaDto;

const mockRoute = shallowReactive({
  name: 'parlamentarDetalhe',
  params: { parlamentarId: '2' },
  query: {} as Record<string, string | undefined>,
});

const navegar = vi.fn(async ({ query }) => {
  mockRoute.query = query;
});

const mockRouter = {
  push: navegar,
  replace: navegar,
};

vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue-router')>(),
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => mockRouter),
}));

const mockRequestS = {
  get: vi.fn(async (url: string) => {
    if (url.endsWith('/painel-parlamentar/2/transferencias')) {
      return {
        linhas: [transferencia],
        token_paginacao: 'token',
        paginas: 1,
        pagina_corrente: 1,
        tem_mais: false,
        total_registros: 1,
      };
    }

    return painel;
  }),
};

const montar = () => mount(ParlamentarDetalhePainel, {
  props: { parlamentarId: 2 },
  global: {
    plugins: [createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      plugins: [() => ({ requestS: mockRequestS })],
    })],
    mocks: { $route: mockRoute },
    stubs: {
      SmaeLink: RouterLinkStub,
      MenuPaginacao: true,
    },
  },
});

const parametrosDaUltimaChamada = (sufixo: string) => {
  const parametros = mockRequestS.get.mock.calls
    .filter(([url]) => url.endsWith(sufixo))
    .at(-1)?.[1] as Record<string, unknown> | undefined;

  return Object.fromEntries(Object.entries(parametros || {})
    .filter(([, valor]) => valor !== undefined)
    .map(([chave, valor]) => [chave, String(valor)]));
};

describe('ParlamentarDetalhePainel', () => {
  afterEach(() => {
    mockRoute.query = {};
    vi.clearAllMocks();
  });

  it('exibe os indicadores do parlamentar', async () => {
    const envelope = montar();
    await flushPromises();

    const texto = envelope.text();

    expect(texto).toContain('12/20');
    expect(texto).toContain('55.080.000,00');
    expect(texto).toContain('39.657.600,00');
    expect(texto).toContain('72%');
    expect(texto).toContain('37%');
    expect(texto).toContain('SEME');
    expect(texto).toContain('800.000,00');
    expect(texto.toLowerCase()).toContain('outros');
    expect(texto).toContain('PSOL');
    expect(texto).toContain('900.000,00');
  });

  it('busca os dados do período presente na URL', async () => {
    mockRoute.query = { ano_inicio: '2022', ano_fim: '2024' };

    montar();
    await flushPromises();

    expect(parametrosDaUltimaChamada('/painel-parlamentar/2'))
      .toEqual(expect.objectContaining({ ano_inicio: '2022', ano_fim: '2024' }));
    expect(parametrosDaUltimaChamada('/painel-parlamentar/2/transferencias'))
      .toEqual(expect.objectContaining({ ano_inicio: '2022', ano_fim: '2024' }));
  });

  it('leva o período escolhido para a URL ao filtrar', async () => {
    const envelope = montar();
    await flushPromises();

    await envelope.find('select[name="ano_inicio"]').setValue('2021');
    await envelope.find('select[name="ano_fim"]').setValue('2023');
    await envelope.find('[data-test="filtrar"]').trigger('click');
    await flushPromises();

    expect(mockRoute.query).toEqual(expect.objectContaining({
      ano_inicio: '2021',
      ano_fim: '2023',
    }));
    expect(parametrosDaUltimaChamada('/painel-parlamentar/2'))
      .toEqual(expect.objectContaining({ ano_inicio: '2021', ano_fim: '2023' }));
  });

  it('ordena as transferências por secretaria e valor a partir da primeira página', async () => {
    mockRoute.query = { pagina: '3', token_paginacao: 'antigo' };

    const envelope = montar();
    await flushPromises();

    await envelope.find('select[name="ordem_orgao_id"]').setValue('10');
    await envelope.find('select[name="ordem_valor"]').setValue('asc');
    await envelope.find('[data-test="ordenar"]').trigger('click');
    await flushPromises();

    const parametros = parametrosDaUltimaChamada('/painel-parlamentar/2/transferencias');

    expect(parametros).toEqual(expect.objectContaining({
      ordem_orgao_id: '10',
      ordem_valor: 'asc',
    }));
    expect(parametros).not.toHaveProperty('pagina');
    expect(parametros).not.toHaveProperty('token_paginacao');
    expect(mockRoute.query.pagina).toBeUndefined();
    expect(mockRoute.query.token_paginacao).toBeUndefined();
  });

  it('lista as transferências com link para o resumo de cada uma', async () => {
    const envelope = montar();
    await flushPromises();

    expect(envelope.text()).toContain('Computadores para creches');
    expect(envelope.text()).toContain('Distribuição para creches');

    const destinos = envelope.findAllComponents(RouterLinkStub).map((link) => link.props('to'));

    expect(destinos).toContainEqual(expect.objectContaining({
      name: 'TransferenciasVoluntariasDetalhes',
      params: { transferenciaId: 7 },
    }));
  });
});
