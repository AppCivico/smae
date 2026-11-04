import type { PainelParlamentarPorPartidoDto } from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import dinheiro from '@/helpers/dinheiro';

import GraficoPorPartido from './GraficoPorPartido.vue';

const partido = (id: number, sigla: string, valor: number) => ({
  partido: { id, sigla, nome: sigla },
  rotulo: sigla,
  outros: false,
  valor,
  pct: 0,
}) as PainelParlamentarPorPartidoDto;

const itens = [
  partido(1, 'PROS', 500),
  partido(2, 'PDT', 400),
  partido(3, 'PSOL', 300),
  partido(4, 'REDE', 200),
  partido(5, 'PV', 100),
  {
    partido: null, rotulo: 'Outros', outros: true, valor: 50, pct: 0,
  } as PainelParlamentarPorPartidoDto,
];

describe('GraficoPorPartido', () => {
  it('dá a cada fatia uma cor diferente das demais', () => {
    const cores = mount(GraficoPorPartido, { props: { itens } })
      .findAll('circle')
      .map((fatia) => fatia.attributes('stroke'));

    expect(new Set(cores).size).toBe(itens.length);
  });

  it('identifica na legenda a cor de cada partido, junto do rótulo e do valor', () => {
    const envelope = mount(GraficoPorPartido, { props: { itens } });
    const cores = envelope.findAll('circle').map((fatia) => fatia.attributes('stroke'));
    const legenda = envelope.findAll('li');

    expect(legenda).toHaveLength(itens.length);

    legenda.forEach((item, indice) => {
      expect(item.find(`[style*="${cores[indice]}"]`).exists()).toBe(true);
      expect(item.text()).toContain(itens[indice].rotulo);
      expect(item.text()).toContain(dinheiro(itens[indice].valor));
    });
  });
});
