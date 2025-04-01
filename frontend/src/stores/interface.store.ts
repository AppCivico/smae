import { defineStore } from 'pinia';

/**
 * Gerenciador de estado genérico para questões de interface
 *
 * @param prefixo - Prefixo opcional para o nome da store
 * @returns Uma instância da store definida pelo Pinia.
 */
export const useContratosStore = (prefixo: string) => defineStore(prefixo ? `${prefixo}.interface` : 'interface', {
  state: () => ({
    ultimoIdExibido: 0,
    idsSelecionados: [] as number[],
  }),
  actions: {
    limparSelecionados() {
      this.idsSelecionados.splice(0);
    },
  },
});
