import { defineStore } from 'pinia';

export const useCounterStore = (entidadeMãe) => defineStore(entidadeMãe ? `${entidadeMãe}.counter` : 'counter', {
  state: () => ({
    count: 0,
  }),
  actions: {
    increment() {
      this.count += 1;
    },
  },
})();
