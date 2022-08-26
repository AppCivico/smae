import { defineStore } from 'pinia';

export const useAlertStore = defineStore({
    id: 'alert',
    state: () => ({
        alert: null
    }),
    actions: {
        success(message) {
            this.alert = { message, type: 'alert-success' };
        },
        error(message) {
            this.alert = { message, type: 'alert-danger' };
        },
        confirm(message, url) {
            this.alert = { message, url: url, type: 'confirm' };
        },
        clear() {
            this.alert = null;
        }
    }
});
