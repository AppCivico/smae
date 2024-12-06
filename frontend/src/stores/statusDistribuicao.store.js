import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useStatusDistribuicaoStore = defineStore('statusDistribuicaoStore', {
  state: () => ({
    emFoco: null,

    chamadasPendentes: {
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async salvarItem(params = {}, idDistribuicao = 0, idStatus = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;
      try {
        if (idStatus) {
          await this.requestS.patch(`${baseUrl}/distribuicao-recurso/${idDistribuicao}/status/${idStatus}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/distribuicao-recurso/${idDistribuicao}/status/`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
});
