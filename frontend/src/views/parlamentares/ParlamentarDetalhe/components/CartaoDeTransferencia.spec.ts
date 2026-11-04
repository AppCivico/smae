import type { PainelParlamentarTransferenciaDto } from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CartaoDeTransferencia from './CartaoDeTransferencia.vue';

const transferencia = {
  id: 7,
  identificador: '7/2024',
  objeto: 'Computadores para creches',
  valor_repasse: 1000000,
  valor_distribuido: 750000,
  valor_parlamentar: 900000,
  valor_parlamentar_distribuido: 300000,
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
    {
      id: 71,
      nome: null,
      objeto: 'Tablets',
      orgao: { id: 11, sigla: 'SME', descricao: 'Secretaria de Educação' },
      situacao: 'Cancelada',
      contabilizada: false,
      valor: 150000,
      valor_parlamentar: 0,
      pct_parlamentar: 120,
    },
  ],
} as unknown as PainelParlamentarTransferenciaDto;

const montar = (dados = transferencia) => mount(CartaoDeTransferencia, {
  props: { transferencia: dados },
  global: { stubs: { SmaeLink: RouterLinkStub } },
});

describe('CartaoDeTransferencia', () => {
  it('exibe os dados de cada distribuição, nesta ordem de colunas', () => {
    const [primeira] = montar().findAll('tbody tr');
    const celulas = primeira.findAll('th, td').map((celula) => celula.text());

    expect(celulas.slice(0, 3)).toEqual(['Distribuição para creches', 'SETRI', 'Em andamento']);
    expect(celulas[3]).toContain('600.000,00');
    expect(celulas[4]).toContain('300.000,00');
  });

  it('identifica a linha pelo objeto quando a distribuição não tem nome', () => {
    const cabecalhos = montar().findAll('tbody th[scope="row"]').map((celula) => celula.text());

    expect(cabecalhos).toEqual(['Distribuição para creches', 'Tablets']);
  });

  it('oferece o nome completo do órgão ao lado da sigla', () => {
    const [primeira] = montar().findAll('tbody tr');

    expect(primeira.find('[title="Secretaria de Relações"]').text()).toBe('SETRI');
  });

  it('destaca apenas as distribuições não contabilizadas', () => {
    const linhas = montar().findAll('tbody tr');
    const classe = 'cartao-de-transferencia__linha--nao-contabilizada';

    expect(linhas[0].classes()).not.toContain(classe);
    expect(linhas[1].classes()).toContain(classe);
  });

  it('representa o percentual do parlamentar na barra, limitado a 100%', () => {
    const barras = montar().findAll('.cartao-de-transferencia__barra');

    expect(barras[0].attributes('aria-label')).toBe('50% da distribuição');
    expect(barras[0].find('.cartao-de-transferencia__barra-parlamentar').attributes('style'))
      .toContain('width: 50%');
    expect(barras[1].find('.cartao-de-transferencia__barra-parlamentar').attributes('style'))
      .toContain('width: 100%');
  });

  it('totaliza os valores e explica a legenda no rodapé', () => {
    const rodape = montar().find('tfoot').text();

    expect(rodape).toContain('750.000,00');
    expect(rodape).toContain('300.000,00');
    expect(rodape).toContain('valor da distribuição');
    expect(rodape).toContain('valor do parlamentar');
  });

  it('totaliza no rodapé o valor do parlamentar nas distribuições, e não o da emenda', () => {
    const rodape = montar().find('tfoot').text();

    expect(rodape).toContain('300.000,00');
    expect(rodape).not.toContain('900.000,00');
  });

  it('mantém o valor da emenda visível no cabeçalho do cartão', () => {
    const cabecalho = montar().find('header').text();

    expect(cabecalho).toContain('Valor da emenda');
    expect(cabecalho).toContain('900.000,00');
  });

  it('usa travessão quando a distribuição não tem situação', () => {
    const distribuicoes = [{ ...transferencia.distribuicoes[0], situacao: null }];
    const [linha] = montar({ ...transferencia, distribuicoes }).findAll('tbody tr');

    expect(linha.findAll('td')[1].text()).toBe('—');
  });

  it('avisa quando não há distribuições', () => {
    const linhas = montar({ ...transferencia, distribuicoes: [] }).findAll('tbody tr');

    expect(linhas).toHaveLength(1);
    expect(linhas[0].text()).toBe('Nenhuma distribuição registrada.');
    expect(linhas[0].find('td').attributes('colspan')).toBe('6');
  });
});
