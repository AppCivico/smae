import { defineStore } from "pinia";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useTransferenciasVoluntariasStore = defineStore(
  "transferenciasVoluntarias",
  {
    state: () => ({
      lista: [],
      emFoco: null,
      arquivos: [],
      diretórios: [],
      chamadasPendentes: {
        lista: false,
        emFoco: false,
        arquivos: false,
        diretórios: true,
      },
      erro: null,
    }),
    actions: {
      async buscarItem(id = 0, params = {}) {
        this.chamadasPendentes.emFoco = true;
        this.erro = null;

        try {
          const resposta = await this.requestS.get(
            `${baseUrl}/transferencia/${id}`,
            params
          );
          this.emFoco = {
            ...resposta,
          };
        } catch (erro) {
          this.erro = erro;
        }
        this.chamadasPendentes.emFoco = false;
      },

      async buscarTudo(params = {}) {
        this.chamadasPendentes.lista = true;
        this.erro = null;

        try {
          const { linhas } = await this.requestS.get(
            `${baseUrl}/transferencia`,
            params
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
          await this.requestS.delete(`${baseUrl}/transferencia/${id}`);
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
            await this.requestS.patch(`${baseUrl}/transferencia/${id}`, params);
          } else {
            await this.requestS.post(`${baseUrl}/transferencia`, params);
          }

          this.chamadasPendentes.emFoco = false;
          return true;
        } catch (erro) {
          this.erro = erro;
          this.chamadasPendentes.emFoco = false;
          return false;
        }
      },
      async buscarArquivos(id = 0, params = {}) {
        this.chamadasPendentes.arquivos = true;
        this.erro = null;
        try {
          const resposta = await this.requestS.get(
            `${baseUrl}/transferencia/${
              id || this.route.params.transferenciaId
            }/anexo`,
            params
          );
          if (Array.isArray(resposta.linhas)) {
            this.arquivos = resposta.linhas;
          }
        } catch (erro) {
          this.erro = erro;
        }
        this.chamadasPendentes.arquivos = false;
      },

      async excluirArquivo(id, idDaTransferencia = 0) {
        this.chamadasPendentes.arquivos = true;
        this.erro = null;

        try {
          await this.requestS.delete(
            `${baseUrl}/transferencia/${
              idDaTransferencia || this.route.params.transferenciaId
            }/anexo/${id}`
          );

          this.arquivos = this.arquivos.filter((x) => x.id !== id);
          this.chamadasPendentes.arquivos = false;

          return true;
        } catch (erro) {
          this.erro = erro;
          this.chamadasPendentes.arquivos = false;
          return false;
        }
      },

      async associarArquivo(params = {}, id = 0, idDaTransferencia = 0) {
        this.chamadasPendentes.arquivos = true;
        this.erro = null;

        try {
          let resposta;

          if (id) {
            resposta = await this.requestS.patch(
              `${baseUrl}/transferencia/${
                idDaTransferencia || this.route.params.transferenciaId
              }/anexo/${id}`,
              params
            );
          } else {
            resposta = await this.requestS.post(
              `${baseUrl}/transferencia/${
                idDoProjeto || this.route.params.transferenciaId
              }/anexo`,
              params
            );
          }

          this.chamadasPendentes.arquivos = false;
          return resposta;
        } catch (erro) {
          this.erro = erro;
          this.chamadasPendentes.arquivos = false;
          return false;
        }
      },
    },

    getters: {
      arquivosPorId: ({ arquivos }) =>
        arquivos.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

      diretóriosConsolidados: ({ diretórios, arquivos }) =>
        arquivos
          .reduce(
            (acc, cur) => {
              const caminho = cur.arquivo.diretorio_caminho || "/";
              return acc.indexOf(caminho) === -1 ? acc.concat([caminho]) : acc;
            },
            diretórios.map((x) => x.caminho)
          )
          .sort((a, b) => a.localeCompare(b)),

      itemParaEdição: ({ emFoco }) => ({
        ...emFoco,
        partido_id: emFoco?.partido?.id || null,
      }),
    },
  }
);
