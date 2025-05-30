import gerarId from '@/helpers/texto/gerarId';
import { defineStore } from 'pinia';

export const useAlertStore = defineStore('alert', {
  state: () => ({
    alertas: [],
    estaCarregando: false,
  }),
  actions: {
    setLoading(value) {
      this.estaCarregando = value;
    },
    success(message) {
      this.alertas.push({
        id: gerarId(),
        message,
        type: 'alert-success',
      });
    },
    error(message, ignorarDuplicadas = true) {
      if (ignorarDuplicadas && this.alertas.some((v) => v.message === message && v.type === 'alert-danger')) return;
      this.alertas.push({
        id: gerarId(),
        message,
        type: 'alert-danger',
      });
    },
    confirm(message, url) {
      this.alertas.push({
        id: gerarId(),
        message,
        url,
        type: 'confirm',
      });
    },
    confirmAction(message, callback, label, fallback) {
      this.alertas.push({
        id: gerarId(),
        message,
        callback,
        type: 'confirmAction',
        label: label ?? 'OK',
        fallback: fallback ?? false,
      });
    },
    clear() { // TODO: remover função desnecessária. Pode-se usar `.$reset();`
      this.alertas.splice(0);
    },
  },
});
