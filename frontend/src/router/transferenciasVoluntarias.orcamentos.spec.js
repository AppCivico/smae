import { createTestingPinia } from '@pinia/testing';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

import rotaDeOrcamentos from './transferenciasVoluntarias.orcamentos';

// as telas importam stores que importam o roteador; sem elas, o ciclo some
vi.mock('@/views/orcamento/AddRealizado.vue', () => ({ default: {} }));
vi.mock('@/views/orcamento/AddRealizadoNota.vue', () => ({ default: {} }));
vi.mock('@/views/orcamento/AddRealizadoProcesso.vue', () => ({ default: {} }));
vi.mock('@/views/orcamento/EditRealizado.vue', () => ({ default: {} }));
vi.mock('@/views/transferenciasVoluntarias.orcamentos/OrcamentosLista.vue', () => ({ default: {} }));
vi.mock('@/views/transferenciasVoluntarias.orcamentos/OrcamentosRaiz.vue', () => ({ default: {} }));

describe('título da execução orçamentária da transferência', () => {
  beforeEach(() => {
    createTestingPinia({ createSpy: vi.fn });
  });

  it('inclui o identificador da transferência em foco', () => {
    useTransferenciasVoluntariasStore().emFoco = { id: 317, identificador: '12/2024' };

    expect(rotaDeOrcamentos.meta.título())
      .toBe('Execução orçamentária da transferência 12/2024');
  });

  it.each([
    ['sem transferência em foco', null],
    ['sem identificador', { id: 317, identificador: '' }],
  ])('%s, usa o título genérico', (_, emFoco) => {
    useTransferenciasVoluntariasStore().emFoco = emFoco;

    expect(rotaDeOrcamentos.meta.título()).toBe('Execução orçamentária');
  });

  it('acompanha a troca da transferência em foco', () => {
    const store = useTransferenciasVoluntariasStore();

    store.emFoco = { id: 317, identificador: '12/2024' };
    expect(rotaDeOrcamentos.meta.título()).toContain('12/2024');

    store.emFoco = { id: 320, identificador: '15/2025' };
    expect(rotaDeOrcamentos.meta.título()).toContain('15/2025');
  });
});
