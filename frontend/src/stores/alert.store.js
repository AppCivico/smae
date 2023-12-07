import { defineStore } from 'pinia';

export const useAlertStore = defineStore({
  id: 'alert',
  state: () => ({
    alert: null,
  }),
  actions: {
    success(message) {
      this.alert = { message, type: 'alert-success' };
    },
    error(message) {
      this.alert = { message, type: 'alert-danger' };
    },
    confirm(message, url) {
      this.alert = { message, url, type: 'confirm' };
    },
    confirmAction(message, callback, label, fallback) {
      this.alert = {
        message, callback, type: 'confirmAction', label: label ?? 'OK', fallback: fallback ?? false,
      };
    },
    clear() { // TODO: remover função desnecessária. Pode-se usar `.$reset();`
      this.alert = null;
    },
  },
});
