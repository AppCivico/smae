import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PainelCartao from './PainelCartao.vue';

describe('PainelCartao', () => {
  it('apresenta o rodapé recebido em um footer', () => {
    const envelope = mount(PainelCartao, {
      props: { titulo: 'Transferências', rodape: 'Em andamento/total' },
    });

    expect(envelope.find('footer').text()).toBe('Em andamento/total');
  });

  it('não cria rodapé quando não há texto para ele', () => {
    const envelope = mount(PainelCartao, { props: { titulo: 'Transferências' } });

    expect(envelope.find('footer').exists()).toBe(false);
  });
});
