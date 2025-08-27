import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useParlamentaresStore = defineStore('parlamentaresStore', {
  state: () => ({
    lista: [],
    emFoco: null,
    eleições: [],
    listaDeDisponíveisParaSuplência: [],

    chamadasPendentes: {
      lista: false,
      emFoco: false,
      equipe: false,
      suplente: false,
      mandato: false,
      eleições: false,
      representatividade: false,
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
        const resposta = await this.requestS.get(`${baseUrl}/parlamentar/${id}`, params);
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
        } = await this.requestS.get(`${baseUrl}/parlamentar`, params);

        if (params.disponivel_para_suplente_parlamentar_id) {
          this.listaDeDisponíveisParaSuplência = linhas;
        } else if (Array.isArray(linhas)) {
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

    async buscarEleições(params = {}) {
      this.chamadasPendentes.eleições = true;
      this.erro = null;

      this.requestS.get(`${baseUrl}/eleicao`, params).then((resposta) => {
        console.log('eleicao', resposta);

        if (Array.isArray(resposta)) {
          this.eleições = resposta;
        } else {
          throw new Error('Falha na carga da lista de eleições');
        }
      }).catch((erro) => {
        this.erro = erro;
      });

      this.chamadasPendentes.eleições = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/parlamentar/${id}`);
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
          await this.requestS.patch(`${baseUrl}/parlamentar/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/parlamentar`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async salvarPessoaNaEquipe(
      params = {},
      pessoaId = this.route.params.pessoaId,
      parlamentarId = this.route.params.parlamentarId,
    ) {
      this.chamadasPendentes.equipe = true;
      this.erro = null;

      if (!parlamentarId) {
        throw new Error('id da parlamentar ausente');
      }

      try {
        if (pessoaId) {
          await this.requestS.patch(`${baseUrl}/parlamentar/${parlamentarId}/equipe/${pessoaId}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/parlamentar/${parlamentarId}/equipe`, params);
        }

        this.chamadasPendentes.equipe = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.equipe = false;
        return false;
      }
    },

    async excluirPessoa(pessoaId, parlamentarId = this.route.params.parlamentarId) {
      this.chamadasPendentes.equipe = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/parlamentar/${parlamentarId}/equipe/${pessoaId}`);
        this.chamadasPendentes.equipe = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.equipe = false;
        return false;
      }
    },

    async salvarSuplente(params = {}, {
      parlamentarId, mandatoId, suplencia, parlamentarSuplenteId,
    } = {}) {
      this.chamadasPendentes.suplente = true;
      this.erro = null;
      console.log('salvarSuplente: ', parlamentarId, mandatoId, suplencia, parlamentarSuplenteId);
      if (!parlamentarId) {
        throw new Error('ID do parlamentar ausente');
      }

      try {
        await this.requestS.post(
          `${baseUrl}/parlamentar/${parlamentarId}/suplente/`,
          {
            suplencia,
            mandato_id: mandatoId,
            parlamentar_suplente_id: parlamentarSuplenteId,
          },
        );

        this.chamadasPendentes.suplente = false;
        return true;
      } catch (error) {
        this.erro = error;
        this.chamadasPendentes.suplente = false;
        return false;
      }
    },

    async excluirSuplente(suplenteId, parlamentarId = this.route.params.parlamentarId) {
      this.chamadasPendentes.suplente = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/parlamentar/${parlamentarId}/suplente/${suplenteId}`);
        this.chamadasPendentes.suplente = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.suplente = false;
        return false;
      }
    },

    async salvarMandato(
      params = {},
      mandatoId = this.route.params.mandatoId,
      parlamentarId = this.route.params.parlamentarId,
    ) {
      this.chamadasPendentes.mandato = true;
      this.erro = null;

      if (!parlamentarId) {
        throw new Error('id da parlamentar ausente');
      }

      try {
        if (mandatoId) {
          await this.requestS.patch(`${baseUrl}/parlamentar/${parlamentarId}/mandato/${mandatoId}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/parlamentar/${parlamentarId}/mandato`, params);
        }

        this.chamadasPendentes.mandato = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.mandato = false;
        return false;
      }
    },

    async excluirMandato(mandatoId, parlamentarId = this.route.params.parlamentarId) {
      this.chamadasPendentes.mandato = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/parlamentar/${parlamentarId}/mandato/${mandatoId}`);
        this.chamadasPendentes.mandato = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.mandato = false;
        return false;
      }
    },

    async salvarRepresentatividade(
      params = {},
      representatividadeId = this.route.params.representatividadeId,
      parlamentarId = this.route.params.parlamentarId,
    ) {
      this.chamadasPendentes.representatividade = true;
      this.erro = null;

      if (!parlamentarId) {
        throw new Error('id da parlamentar ausente');
      }

      try {
        if (representatividadeId) {
          await this.requestS.patch(`${baseUrl}/parlamentar/${parlamentarId}/representatividade/${representatividadeId}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/parlamentar/${parlamentarId}/representatividade`, params);
        }

        return true;
      } catch (erro) {
        this.erro = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.representatividade = false;
      }
    },

    async excluirRepresentatividade(
      representatividadeId,
      parlamentarId = this.route.params.parlamentarId,
    ) {
      this.chamadasPendentes.representatividade = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/parlamentar/${parlamentarId}/representatividade/${representatividadeId}`);
        this.chamadasPendentes.representatividade = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.representatividade = false;
        return false;
      }
    },
    async buscarComparecimento(mandatoId) {
      try {
        const resposta = await this.requestS.get(`${baseUrl}/parlamentar/eleicao-comparecimento`, {
          mandato_id: mandatoId,
        });

        return resposta;
      } catch (erro) {
        this.erro = erro;

        throw new Error(erro);
      }
    },
  },

  getters: {
    itemParaEdicao({ emFoco }) {
      return {
        ...emFoco,
      };
    },
    idsDasEleiçõesQueParlamentarConcorreu: (({ emFoco }) => emFoco?.mandatos
      ?.map((x) => x.eleicao.id) || []),

    pessoaParaEdição({ emFoco }) {
      const { pessoaId } = this.route.params;

      return pessoaId && Array.isArray(emFoco?.equipe)
        ? { ...emFoco.equipe.find((x) => Number(pessoaId) === x.id) }
        : {};
    },
    representatividadeParaEdicao({ emFoco }) {
      const { representatividadeId } = this.route.params;

      let representatividade;

      if (Array.isArray(emFoco?.mandatos)) {
        for (let i = 0; i < emFoco.mandatos.length; i += 1) {
          if (Array.isArray(emFoco.mandatos[i]?.representatividade)) {
            const mandato = emFoco.mandatos[i];

            representatividade = mandato.representatividade
              .find((y) => Number(representatividadeId) === y.id);
            if (representatividade) {
              representatividade.mandato_id = mandato.id || 0;
              representatividade.mandato = {
                tipo: mandato.eleicao?.tipo,
                ano: mandato.eleicao?.ano,
                id: mandato.id,
              };

              break;
            }
          }
        }
      }

      if (!representatividade) {
        return null;
      }

      return {
        ...representatividade,
        regiao_id: representatividade?.regiao?.id,
      };
    },
    parlamentaresPorId: (({ lista }) => lista.reduce((acc, cur) => {
      acc[cur.id] = cur;
      return acc;
    }, {})),
    // TODO: fazer edição
    suplenteParaEdição({ emFoco }) {
      console.log('suplenteParaEdição: ', emFoco);
    },
  },
});
