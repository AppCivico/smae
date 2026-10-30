import { mount } from '@vue/test-utils';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import FiltroDePeriodo from './FiltroDePeriodo.vue';

const montar = (props = {}) => mount(FiltroDePeriodo, { props });

const escolherPeriodo = async (
  envelope: ReturnType<typeof montar>,
  inicio: string,
  fim: string,
) => {
  await envelope.find('select[name="ano_inicio"]').setValue(inicio);
  await envelope.find('select[name="ano_fim"]').setValue(fim);
  await envelope.find('form').trigger('submit');
};

describe('FiltroDePeriodo', () => {
  it('preenche os campos com o período recebido', () => {
    const envelope = montar({ anoInicio: 2021, anoFim: 2023 });

    expect((envelope.find('select[name="ano_inicio"]').element as HTMLSelectElement).value)
      .toBe('2021');
    expect((envelope.find('select[name="ano_fim"]').element as HTMLSelectElement).value)
      .toBe('2023');
  });

  it('emite o período escolhido ao filtrar', async () => {
    const envelope = montar();

    await escolherPeriodo(envelope, '2021', '2023');

    await vi.waitFor(() => {
      expect(envelope.emitted('filtrar')).toEqual([[{ ano_inicio: 2021, ano_fim: 2023 }]]);
    });
  });

  it('aceita período sem começo ou sem fim', async () => {
    const envelope = montar();

    await escolherPeriodo(envelope, '', '2023');

    await vi.waitFor(() => {
      expect(envelope.emitted('filtrar')).toEqual([[{ ano_inicio: undefined, ano_fim: 2023 }]]);
    });
  });

  it('aceita começo e fim no mesmo ano', async () => {
    const envelope = montar();

    await escolherPeriodo(envelope, '2023', '2023');

    await vi.waitFor(() => {
      expect(envelope.emitted('filtrar')).toEqual([[{ ano_inicio: 2023, ano_fim: 2023 }]]);
    });
  });

  it('não filtra e avisa quando o fim é anterior ao começo', async () => {
    const envelope = montar();

    await escolherPeriodo(envelope, '2025', '2023');

    await vi.waitFor(() => {
      expect(envelope.find('.error-msg').text()).toContain('anterior ao início');
    });
    expect(envelope.emitted('filtrar')).toBeUndefined();
  });
});
