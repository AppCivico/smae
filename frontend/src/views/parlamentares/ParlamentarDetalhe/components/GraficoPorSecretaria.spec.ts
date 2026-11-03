import type { PainelParlamentarPorSecretariaDto } from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import GraficoPorSecretaria from './GraficoPorSecretaria.vue';

const itens = [
  {
    orgao: { id: 10, sigla: 'SEME', descricao: 'Secretaria de Esportes' },
    rotulo: 'SEME',
    valor: 800000,
    outros: false,
  },
  {
    orgao: null,
    rotulo: 'Outros',
    valor: 200000,
    outros: true,
  },
] as unknown as PainelParlamentarPorSecretariaDto[];

describe('GraficoPorSecretaria', () => {
  it('associa cada secretaria ao seu valor, mesmo sem estilos', () => {
    const envelope = mount(GraficoPorSecretaria, { props: { itens } });

    const pares = envelope.findAll('dl > div').map((par) => [
      par.find('dt').text(),
      par.find('dd').text(),
    ]);

    expect(pares).toEqual([
      ['SEME', '800.000,00'],
      ['Outros', '200.000,00'],
    ]);
  });

  it('oferece o nome completo da secretaria ao lado da sigla', () => {
    const envelope = mount(GraficoPorSecretaria, { props: { itens } });

    expect(envelope.find('dt').attributes('title')).toBe('Secretaria de Esportes');
  });
});
