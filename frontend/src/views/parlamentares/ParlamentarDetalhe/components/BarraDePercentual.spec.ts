import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BarraDePercentual from './BarraDePercentual.vue';

describe('BarraDePercentual', () => {
  it('expõe o percentual para tecnologias assistivas', () => {
    const barra = mount(BarraDePercentual, {
      props: { percentual: 72 },
      attrs: { 'aria-label': 'Participação no município' },
    }).find('[role="progressbar"]');

    expect(barra.attributes()).toMatchObject({
      'aria-label': 'Participação no município',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '72',
      'aria-valuetext': '72%',
    });
  });

  it('limita o valor da barra a 100%, mantendo o percentual real no texto', () => {
    const barra = mount(BarraDePercentual, { props: { percentual: 120 } })
      .find('[role="progressbar"]');

    expect(barra.attributes('aria-valuenow')).toBe('100');
    expect(barra.attributes('aria-valuetext')).toBe('120%');
  });

  it('mostra as casas decimais de um percentual fracionado', () => {
    const envelope = mount(BarraDePercentual, { props: { percentual: 0.77 } });

    expect(envelope.text()).toContain('0,77%');
    expect(envelope.find('[role="progressbar"]').attributes('aria-valuetext')).toBe('0,77%');
  });

  it('não acrescenta casas decimais a um percentual inteiro', () => {
    const envelope = mount(BarraDePercentual, { props: { percentual: 72 } });

    expect(envelope.find('[role="progressbar"]').attributes('aria-valuetext')).toBe('72%');
  });

  it('não pinta a barra quando o percentual é zero', () => {
    const envelope = mount(BarraDePercentual, { props: { percentual: 0 } });

    expect(envelope.find('[data-test="preenchimento"]').exists()).toBe(false);
  });

  it('inclui o rótulo no texto lido, já que o conteúdo da barra não é anunciado', () => {
    const barra = mount(BarraDePercentual, {
      props: { percentual: 72, rotulo: 'R$ 39.657.600,00' },
    }).find('[role="progressbar"]');

    expect(barra.attributes('aria-valuetext')).toBe('72% (R$ 39.657.600,00)');
  });
});
