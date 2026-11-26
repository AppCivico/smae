import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { createApp, markRaw } from 'vue';

import { useTiposDeDocumentosStore } from './tiposDeDocumentos.store';

const get = vi.fn();

describe('useTiposDeDocumentosStore.buscarTudo', () => {
  beforeEach(() => {
    const pinia = createPinia();
    pinia.use(() => ({ requestS: markRaw({ get }) }));
    // o Pinia só aplica plugins depois de instalado num app
    createApp({}).use(pinia);
    setActivePinia(pinia);
    get.mockReset();
  });

  it('guarda a falha em `erro`', async () => {
    const falha = new Error('Erro de comunicação do servidor.');
    get.mockRejectedValueOnce(falha);
    const store = useTiposDeDocumentosStore();

    await store.buscarTudo();

    expect(store.erro).toBe(falha);
    expect(store.lista).toEqual([]);
    expect(store.chamadasPendentes.lista).toBe(false);
  });

  it('limpa a falha anterior quando uma nova busca dá certo', async () => {
    get
      .mockRejectedValueOnce(new Error('Erro de comunicação do servidor.'))
      .mockResolvedValueOnce({ linhas: [{ id: 1, titulo: 'Ata', extensoes: 'pdf' }] });
    const store = useTiposDeDocumentosStore();

    await store.buscarTudo();
    await store.buscarTudo();

    expect(store.erro).toBeNull();
    expect(store.lista).toHaveLength(1);
  });
});
