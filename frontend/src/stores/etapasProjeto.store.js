import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rota){
  
  if(rota === 'projeto'){
    return 'projeto-etapa'
  }
  
  if( rota === 'TransferenciasVoluntarias'){
     // alterar quando tiver endpoint
    return 'projeto-etapa'
  }
}

export const useEtapasProjetosStore = defineStore('paineisExternos', {
  state: () => ({
    lista: [],
    chamadasPendentes: {
      lista: false,
    },
    erro: null,
  }),
  actions: {
    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta.prefixoParaFilhas)}`, params);
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/${caminhoParaApi(this.route.meta.prefixoParaFilhas)}/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta.prefixoParaFilhas)}/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta.prefixoParaFilhas)}`, params);
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

  getters: {
    itemParaEdição() {
      this.lista
    },
    tiposPorId() {
      return this.lista.reduce((acc, cur) => {
        acc[cur.id] = cur;
        return acc;
      }, {});
    }
  },
});
