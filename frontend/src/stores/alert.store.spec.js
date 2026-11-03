import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach, describe, expect, it,
} from 'vitest';

import { useAlertStore } from './alert.store';

describe('alertStore.error', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('exibe o texto de um `Error`, sem o prefixo "Error: "', () => {
    const alertStore = useAlertStore();

    alertStore.error(new Error('Já existe um registro'));

    expect(alertStore.alertas).toHaveLength(1);
    expect(alertStore.alertas[0].message).toBe('Já existe um registro');
  });

  it('não duplica o alerta do `requestS` quando a tela repassa o `Error` rejeitado', () => {
    const alertStore = useAlertStore();

    alertStore.error('Já existe um registro');
    alertStore.error(new Error('Já existe um registro'));

    expect(alertStore.alertas).toHaveLength(1);
  });

  it('permite duplicar quando pedido', () => {
    const alertStore = useAlertStore();

    alertStore.error('Falhou');
    alertStore.error(new Error('Falhou'), false);

    expect(alertStore.alertas).toHaveLength(2);
  });
});
