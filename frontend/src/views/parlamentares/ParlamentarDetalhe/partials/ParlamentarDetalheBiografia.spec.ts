import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import ParlamentarDetalheBiografia from './ParlamentarDetalheBiografia.vue';

const mockRoute = { name: 'parlamentarDetalhe', params: { parlamentarId: '2' }, query: {} };

vi.mock('vue-router', async (importOriginal) => ({
  ...await importOriginal<typeof import('vue-router')>(),
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));

const parlamentar = {
  id: 2,
  nome: 'Francisco Everardo Oliveira Silva',
  nome_popular: 'Gilzinho',
  equipe: [
    {
      id: 1, nome: 'Gil Júnior', tipo: 'Assessor', telefone: '(21) 998693492', email: 'giljunior@camara.leg.br',
    },
    {
      id: 2, nome: 'Marilda Borges', tipo: 'Contato', telefone: '(21) 995593481', email: 'marilda.borges@camara.leg.br',
    },
  ],
  ultimo_mandato: {
    id: 9,
    cargo: 'DeputadoFederal',
    uf: 'SP',
    eleito: true,
    suplencia: null,
    atuacao: '<p>Educação como prioridade</p>',
    biografia: '<p>Nasceu em Itapipoca</p>',
    votos_estado: 456900,
    votos_capital: 345000,
    votos_interior: 111000,
    eleicao: { ano: 2020 },
    partido_atual: { sigla: 'PTdoB' },
    partido_candidatura: { sigla: 'PTdoB' },
    suplentes: [
      {
        id: 5,
        suplencia: 'PrimeiroSuplente',
        parlamentar: {
          id: 20, nome: 'Francisco da Silva Sauro', telefone: null, email: null,
        },
      },
    ],
  },
  mandatos: [],
};

const montar = (emFoco: unknown = parlamentar) => mount(ParlamentarDetalheBiografia, {
  global: {
    plugins: [createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      initialState: {
        parlamentaresStore: { emFoco },
      },
    })],
    mocks: { $route: mockRoute },
    stubs: {
      RouterLink: RouterLinkStub,
      SmaeLink: RouterLinkStub,
    },
  },
});

const secao = (envelope: ReturnType<typeof montar>, titulo: string) => envelope
  .findAll('section')
  .find((elemento) => elemento.find('h2, h3').exists()
    && elemento.find('h2, h3').text() === titulo);

describe('ParlamentarDetalheBiografia', () => {
  it('exibe área de atuação, biografia e o resumo da eleição', async () => {
    const envelope = montar();
    await flushPromises();

    const texto = envelope.text();

    expect(texto).toContain('Educação como prioridade');
    expect(texto).toContain('Nasceu em Itapipoca');
    expect(texto).toContain('Eleição 2020');
    expect(texto).toContain('456.900');
    expect(texto).toContain('345.000');
    expect(texto).toContain('111.000');
  });

  it('separa assessores de contatos', async () => {
    const envelope = montar();
    await flushPromises();

    const assessores = secao(envelope, 'Assessores');
    const contatos = secao(envelope, 'Contatos');

    expect(assessores).toBeDefined();
    expect(contatos).toBeDefined();
    expect(assessores?.text()).toContain('Gil Júnior');
    expect(assessores?.text()).not.toContain('Marilda Borges');
    expect(contatos?.text()).toContain('Marilda Borges');
    expect(contatos?.text()).not.toContain('Gil Júnior');
  });

  it('exibe nome, telefone e email de cada pessoa da equipe', async () => {
    const envelope = montar();
    await flushPromises();

    const assessores = secao(envelope, 'Assessores');
    const cabecalhos = assessores?.findAll('thead th').map((celula) => celula.text());
    const celulas = assessores?.findAll('tbody td').map((celula) => celula.text());

    expect(cabecalhos).toEqual(['Nome', 'Telefone', 'Email']);
    expect(celulas).toEqual(['Gil Júnior', '(21) 998693492', 'giljunior@camara.leg.br']);
  });

  it('usa travessão para telefone e email ausentes', async () => {
    const envelope = montar({
      ...parlamentar,
      equipe: [{
        id: 3, nome: 'Ana Lima', tipo: 'Assessor', telefone: null, email: null,
      }],
    });
    await flushPromises();

    const celulas = secao(envelope, 'Assessores')?.findAll('tbody td').map((celula) => celula.text());

    expect(celulas).toEqual(['Ana Lima', '—', '—']);
  });

  it('avisa quando o grupo não tem pessoas', async () => {
    const envelope = montar({ ...parlamentar, equipe: [parlamentar.equipe[0]] });
    await flushPromises();

    const linhas = secao(envelope, 'Contatos')?.findAll('tbody tr');

    expect(linhas).toHaveLength(1);
    expect(linhas?.[0].text()).toBe('Nenhum registro encontrado.');
    expect(linhas?.[0].find('td').attributes('colspan')).toBe('3');
  });

  it('lista os suplentes do mandato corrente', async () => {
    const envelope = montar();
    await flushPromises();

    expect(envelope.text()).toContain('Francisco da Silva Sauro');
  });
});
