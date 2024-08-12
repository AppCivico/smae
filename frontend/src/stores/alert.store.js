import { defineStore } from 'pinia';

export const useAlertStore = defineStore({
  id: 'alert',
  state: () => ({
    alertas: [],
  }),
  actions: {
    success(message) {
      this.alertas.push({ message, type: 'alert-success' });
    },
    error(message) {
      this.alertas.push({ message, type: 'alert-danger' });
    },
    confirm(message, url) {
      this.alertas.push({ message, url, type: 'confirm' });
    },
    confirmAction(message, callback, label, fallback) {
      this.alertas.push({
        message, callback, type: 'confirmAction', label: label ?? 'OK', fallback: fallback ?? false,
      });
    },
    clear() { // TODO: remover função desnecessária. Pode-se usar `.$reset();`
      this.alertas.splice(0);
    },
  },
});
