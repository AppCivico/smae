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

import ParlamentarDetalheIndex from './ParlamentarDetalheIndex.vue';

const mockRoute = shallowReactive({
  name: 'parlamentarDetalhe',
  params: { parlamentarId: '2' },
  query: {} as Record<string, string>,
});

const navegar = vi.fn(async ({ query }) => {
  mockRoute.query = query;
});

vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue-router')>(),
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => ({ push: navegar, replace: navegar })),
}));

const mockRequestS = {
  get: vi.fn(async () => ({
    id: 2,
    nome: 'Francisco Everardo Oliveira Silva',
    nome_popular: 'Gilzinho',
    nascimento: '1965-03-12',
    ultimo_mandato: { cargo: 'DeputadoFederal' },
    equipe: [],
    mandatos: [],
  })),
};

const montar = (privilegios: string[]) => mount(ParlamentarDetalheIndex, {
  props: { parlamentarId: 2 },
  global: {
    plugins: [createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      initialState: {
        auth: {
          sistemaEscolhido: 'SMAE',
          privilegiosPorModulo: { SMAE: privilegios },
        },
      },
      plugins: [() => ({ requestS: mockRequestS })],
    })],
    mocks: { $route: mockRoute },
    stubs: {
      RouterLink: RouterLinkStub,
      SmaeLink: RouterLinkStub,
      TituloDePagina: { template: '<h1><slot /></h1>' },
      ParlamentarDetalhePainel: true,
      ParlamentarDetalheBiografia: true,
    },
  },
});

const rotulosDasAbas = (envelope: ReturnType<typeof montar>) => envelope
  .findAll('.abas__lista li:not([hidden])')
  .map((aba) => aba.text().toLowerCase());

describe('ParlamentarDetalheIndex', () => {
  afterEach(() => {
    mockRoute.query = {};
    vi.clearAllMocks();
  });

  it('exibe os dados do parlamentar no cabeçalho', async () => {
    const envelope = montar([]);
    await flushPromises();

    const texto = envelope.text();

    expect(texto).toContain('Gilzinho');
    expect(texto).toContain('Francisco Everardo Oliveira Silva');
    expect(texto).toContain('12/03');
    expect(texto).toContain('Deputado Federal');
  });

  it('oferece a aba de painel a quem pode ver o painel do parlamentar', async () => {
    const envelope = montar(['CadastroParlamentar.painel']);
    await flushPromises();

    expect(rotulosDasAbas(envelope)).toEqual(['painel', 'biografia']);
  });

  it('mostra só a biografia a quem não pode ver o painel do parlamentar', async () => {
    const envelope = montar(['CadastroParlamentar.listar']);
    await flushPromises();

    expect(rotulosDasAbas(envelope)).toEqual(['biografia']);
    expect(mockRoute.query.aba).toBe('biografia');
  });

  it('leva à biografia quem chega pelo endereço do painel sem poder vê-lo', async () => {
    mockRoute.query = { aba: 'painel' };

    montar(['CadastroParlamentar.listar']);
    await flushPromises();

    expect(mockRoute.query.aba).toBe('biografia');
  });
});
