import { createTestingPinia } from '@pinia/testing';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

import { useOrcamentosStore } from './orcamentos.store';

describe('buscarTodosOsOrcamentosRealizados', () => {
  let store;
  let respostasPendentes;

  // cada chamada fica pendente até ser concluída pelo teste
  function concluir(transferenciaId, linhas) {
    respostasPendentes[transferenciaId]({ linhas });
  }

  beforeEach(() => {
    createTestingPinia({ createSpy: vi.fn, stubActions: false });
    store = useOrcamentosStore();
    respostasPendentes = {};

    // em `main.ts`, um plugin dá a rota corrente e o `requestS` às stores
    store.route = { params: {} };
    store.requestS = {
      get: vi.fn((url) => new Promise((resolve) => {
        const [, id] = url.match(/transferencia\/(\d+)\//);
        respostasPendentes[id] = resolve;
      })),
    };
  });

  it('agrupa por ano as linhas da busca', async () => {
    const busca = store.buscarTodosOsOrcamentosRealizados({ transferenciaId: 320 });
    concluir(320, [
      { id: 1, ano_referencia: 2024 },
      { id: 2, ano_referencia: 2025 },
      { id: 3, ano_referencia: 2024 },
    ]);
    await busca;

    expect(store.OrcamentoRealizado).toEqual({
      2024: [{ id: 1, ano_referencia: 2024 }, { id: 3, ano_referencia: 2024 }],
      2025: [{ id: 2, ano_referencia: 2025 }],
    });
  });

  it('descarta a resposta de uma busca substituída que chega depois', async () => {
    const anterior = store.buscarTodosOsOrcamentosRealizados({ transferenciaId: 320 });
    const corrente = store.buscarTodosOsOrcamentosRealizados({ transferenciaId: 317 });

    concluir(317, [{ id: 5, ano_referencia: 2025 }]);
    await corrente;
    concluir(320, [{ id: 1, ano_referencia: 2024 }]);
    await anterior;

    expect(store.OrcamentoRealizado).toEqual({ 2025: [{ id: 5, ano_referencia: 2025 }] });
  });

  it('descarta a resposta de uma busca substituída que chega antes', async () => {
    const anterior = store.buscarTodosOsOrcamentosRealizados({ transferenciaId: 320 });
    const corrente = store.buscarTodosOsOrcamentosRealizados({ transferenciaId: 317 });

    concluir(320, [{ id: 1, ano_referencia: 2024 }]);
    await anterior;

    expect(store.OrcamentoRealizado).toEqual({});

    concluir(317, [{ id: 5, ano_referencia: 2025 }]);
    await corrente;

    expect(store.OrcamentoRealizado).toEqual({ 2025: [{ id: 5, ano_referencia: 2025 }] });
  });
});
