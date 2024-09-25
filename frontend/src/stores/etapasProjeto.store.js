import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta) {
  if (
    rotaMeta.prefixoParaFilhas === 'TransferenciasVoluntarias'
    || rotaMeta.entidadeMãe === 'TransferenciasVoluntarias'
  ) {
    return 'workflow-etapa';
  }

  if (
    rotaMeta.prefixoParaFilhas === 'projeto'
    || rotaMeta.entidadeMãe === 'projeto'
  ) {
    return 'projeto-etapa';
  }

  if (
    rotaMeta.entidadeMãe === 'obras'
  ) {
    return 'projeto-etapa-mdo';
  }

  throw new Error('Você precisa estar em algum módulo para executar essa ação.');
}

export const useEtapasProjetosStore = (prefixo) => defineStore(prefixo ? `${prefixo}.etapasProjetos` : 'etapasProjetos', {
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
        const { linhas } = await this.requestS.get(
          `${baseUrl}/${caminhoParaApi(this.route.meta)}`,
          params,
        );
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
        await this.requestS.delete(
          `${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`,
        );
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
          await this.requestS.patch(
            `${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`,
            params,
          );
        } else {
          await this.requestS.post(
            `${baseUrl}/${caminhoParaApi(this.route.meta)}`,
            params,
          );
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
    etapasPorId() {
      return this.lista.reduce((acc, cur) => {
        acc[cur.id] = cur;
        return acc;
      }, {});
    },
  },
})();
