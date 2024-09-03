import consolidarDiretorios from '@/helpers/consolidarDiretorios';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useTransferenciasVoluntariasStore = defineStore(
  'transferenciasVoluntarias',
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

      paginação: {
        temMais: false,
        tokenDaPróximaPágina: '',
      },
    }),
    actions: {
      async buscarItem(id = 0, params = {}) {
        this.chamadasPendentes.emFoco = true;
        this.erro = null;

        try {
          const resposta = await this.requestS.get(
            `${baseUrl}/transferencia/${id}`,
            params,
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
          const {
            linhas,
            tem_mais: temMais,
            token_proxima_pagina: tokenDaPróximaPágina,
          } = await this.requestS.get(
            `${baseUrl}/transferencia`,
            params,
          );
          if (Array.isArray(linhas)) {
            this.lista = params.token_proxima_pagina
              ? this.lista.concat(linhas)
              : linhas;

            this.paginação.temMais = temMais || false;
            this.paginação.tokenDaPróximaPágina = tokenDaPróximaPágina || '';
          }
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

      async salvarItem(params = {}, id = 0, éSegundoFormulário = false) {
        this.chamadasPendentes.emFoco = true;
        this.erro = null;
        let resposta;

        try {
          if (id) {
            if (éSegundoFormulário) {
              resposta = await this.requestS.patch(`${baseUrl}/transferencia/${id}/completar-registro`, params);
            } else {
              resposta = await this.requestS.patch(`${baseUrl}/transferencia/${id}`, params);
            }
          } else {
            resposta = await this.requestS.post(`${baseUrl}/transferencia`, params);
          }

          this.chamadasPendentes.emFoco = false;
          return resposta;
        } catch (erro) {
          this.erro = erro;
          this.chamadasPendentes.emFoco = false;
          throw erro;
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
            params,
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
            }/anexo/${id}`,
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
              params,
            );
          } else {
            resposta = await this.requestS.post(
              `${baseUrl}/transferencia/${
                idDaTransferencia || this.route.params.transferenciaId
              }/anexo`,
              params,
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
      // Obsoleta
      async buscarDiretórios(idDaTransferencia = 0) {
        this.chamadasPendentes.diretórios = true;
        this.erro = null;

        try {
          const { linhas } = await this.requestS.get(`${baseUrl}/diretorio`, {
            transferencia_id: idDaTransferencia || this.route.params.transferenciaId,
          });

          this.diretórios = linhas;
        } catch (erro) {
          this.erro = erro;
        }

        this.chamadasPendentes.diretórios = false;
      },
    },

    getters: {
      arquivosPorId: ({ arquivos }) => arquivos
        .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),

      diretóriosConsolidados: ({ arquivos, diretórios }) => consolidarDiretorios(
        arquivos,
        diretórios,
      ),

      itemParaEdicao: ({ emFoco }) => ({
        ...emFoco,
        clausula_suspensiva_vencimento: dateTimeToDate(emFoco?.clausula_suspensiva_vencimento),
        orgao_concedente_id: emFoco?.orgao_concedente?.id || null,
        parlamentar_id: emFoco?.parlamentar?.id || null,
        partido_id: emFoco?.partido?.id || null,
        tipo_id: emFoco?.tipo?.id || null,
      }),
    },
  },
);
