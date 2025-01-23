import dateToField from '@/helpers/dateToField';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

function caminhoParaApi(rotaMeta, segmentoOriginal) {
  switch (rotaMeta.entidadeMãe) {
    case 'pdm':
      return segmentoOriginal;
    case 'planoSetorial':
    case 'programaDeMetas':
      return `plano-setorial-${segmentoOriginal}`;
    default:
      throw new Error('Você precisa estar em algum módulo para executar essa ação.');
  }
}

export const useVariaveisStore = defineStore({
  id: 'Variaveis',
  state: () => ({
    // atentar que propriedades aninhadas não são reativas.
    // A sua criação é, mas a alteração não!
    Variaveis: {},
    variáveisCompostas: {},
    variáveisCompostasEmUso: {},
    singleVariaveis: {},
    variáveisPorCódigo: {},
    operaçõesParaVariávelComposta: {},
    Valores: {},
    PeríodosAbrangidosPorVariável: {},
    sériesDaVariávelComposta: {},
  }),
  actions: {
    clear() {
      this.Variaveis = {};
      this.Valores = {};
      this.singleVariaveis = {};
    },
    clearEdit() {
      this.singleVariaveis = {};
    },
    async getAll(indicador_id) {
      try {
        if (!indicador_id) throw 'Indicador inválido';
        if (!this.Variaveis[indicador_id]?.length) {
          this.Variaveis[indicador_id] = { loading: true };
        }
        const r = await this.requestS.get(`${baseUrl}/${caminhoParaApi(this.route.meta, 'indicador-variavel')}?remover_desativados=true&indicador_id=${indicador_id}`);
        this.Variaveis[indicador_id] = r.linhas.map((x) => {
          x.orgao_id = x.orgao?.id ?? null;
          x.regiao_id = x.regiao?.id ?? null;
          x.unidade_medida_id = x.unidade_medida?.id ?? null;
          x.acumulativa = x.acumulativa ? '1' : false;
          x.inicio_medicao = dateToField(x.inicio_medicao).slice(3, 10);
          x.fim_medicao = dateToField(x.fim_medicao).slice(3, 10);
          return x;
        }).sort((a, b) => a.codigo.localeCompare(b.codigo));
      } catch (error) {
        this.Variaveis[indicador_id] = { error };
      }
    },

    async getAllCompound(indicadorId) {
      try {
        if (!indicadorId) {
          throw new Error('Indicador inválido');
        }
        if (!this.variáveisCompostas[indicadorId]?.length) {
          this.variáveisCompostas[indicadorId] = { loading: true };
        }
        const r = await this.requestS.get(`${baseUrl}/indicador/${indicadorId}/formula-composta`);
        this.variáveisCompostas[indicadorId] = r.linhas;
      } catch (error) {
        this.variáveisCompostas[indicadorId] = { error };
      }
    },

    async getAllCompoundInUse(indicadorId) {
      try {
        if (!indicadorId) {
          throw new Error('Indicador inválido');
        }
        if (!this.variáveisCompostasEmUso[indicadorId]?.length) {
          this.variáveisCompostasEmUso[indicadorId] = { loading: true };
        }
        const r = await this.requestS.get(`${baseUrl}/indicador/${indicadorId}/formula-composta-em-uso`);
        this.variáveisCompostasEmUso[indicadorId] = r.linhas;
      } catch (error) {
        this.variáveisCompostasEmUso[indicadorId] = { error };
      }
    },

    async getAuxiliares(código, indicadorId) {
      try {
        if (!código) {
          throw new Error('Código inválido');
        }

        if (!this.variáveisPorCódigo[código]?.length) {
          this.variáveisPorCódigo[código] = { loading: true };
        }

        if (!this.operaçõesParaVariávelComposta?.length) {
          this.operaçõesParaVariávelComposta = { loading: true };
        }

        const { operacoes, variaveis } = await this.requestS.get(`${baseUrl}/indicador/${indicadorId || this.route.params.indicador_id}/auxiliar-formula-composta/variavel`, { codigo: código });

        if (Array.isArray(operacoes)) {
          this.operaçõesParaVariávelComposta = operacoes;
        }

        if (Array.isArray(variaveis)) {
          this.variáveisPorCódigo[código] = variaveis;
        }
      } catch (error) {
        this.variáveisCompostas[indicadorId] = { error };
      }
    },

    async getById(indicador_id, var_id) {
      try {
        if (!indicador_id) throw 'Indicador inválido';
        if (!var_id) throw 'Variável inválida';
        this.singleVariaveis = { loading: true };
        if (!this.Variaveis[indicador_id]?.length) {
          await this.getAll(indicador_id);
        }
        this.singleVariaveis = this.Variaveis[indicador_id].length
          ? this.Variaveis[indicador_id].find((u) => u.id == var_id)
          : {};
        return true;
      } catch (error) {
        this.singleVariaveis = { error };
      }
    },
    async gerar(params) {
      if (await this.requestS.post(`${baseUrl}/indicador-variavel/gerador-regionalizado`, params)) return true;
      return false;
    },
    async gerarCompostas(params, indicadorId) {
      if (await this.requestS.post(`${baseUrl}/indicador/${indicadorId || this.route.params.indicador_id}/gerador-formula-composta`, params)) return true;
      return false;
    },
    async insert(params) {
      const r = await this.requestS.post(`${baseUrl}/${caminhoParaApi(this.route.meta, 'indicador-variavel')}`, params);
      if (r.id) return r.id;
      return false;
    },
    async update(id, params) {
      if (await this.requestS.patch(`${baseUrl}/${caminhoParaApi(this.route.meta, 'indicador-variavel')}/${id}`, params)) return true;
      return false;
    },
    async delete(id) {
      if (await this.requestS.delete(`${baseUrl}/indicador-variavel/${id}`)) return true;
      return false;
    },
    async deleteCompound(indicador_id, formula_composta_id) {
      if (await this.requestS.delete(`${baseUrl}/indicador/${indicador_id}/formula-composta/${formula_composta_id}`)) return true;
      return false;
    },
    async getValores(id, { leitura = false } = {}) {
      try {
        if (!id) throw new Error('Variável inválida');
        this.Valores[id] = { loading: true };
        const r = await this.requestS.get(
          `${baseUrl}/${caminhoParaApi(this.route.meta, 'indicador-variavel')}/${id}/serie`,
          leitura ? {
            uso: 'leitura',
            incluir_auxiliares: true,
          } : undefined,
        );

        this.Valores[id] = r;
      } catch (error) {
        this.Valores[id] = { error };
      }
    },
    async updateValores(params) {
      let segmento;

      switch (this.route.meta.entidadeMãe) {
        case 'pdm':
          segmento = 'indicador-variavel-serie';
          break;
        case 'planoSetorial':
        case 'programaDeMetas':
          segmento = 'variavel-serie';
          break;
        default:
          throw new Error('Módulo não pôde ser reconhecido.');
      }

      if (await this.requestS.patch(`${baseUrl}/${segmento}`, params)) return true;
      return false;
    },

    async salvarVariávelComposta(params = {}, id = 0, indicadorId = 0) {
      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/indicador/${indicadorId || this.route.params.indicador_id}/formula-composta/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/indicador/${indicadorId || this.route.params.indicador_id}/formula-composta`, params);
        }

        return true;
      } catch (erro) {
        return false;
      }
    },

    async buscarPeríodosDeVariávelDeFórmula(id = this.route.params.var_id) {
      try {
        this.PeríodosAbrangidosPorVariável = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/formula-variavel/${id}/periodos`);

        if (Array.isArray(r.linhas)) {
          this.PeríodosAbrangidosPorVariável = r.linhas;
        }
      } catch (error) {
        this.PeríodosAbrangidosPorVariável = { error };
      }
    },

    async buscarSériesDeVariávelDeFórmula(período, id = this.route.params.var_id) {
      try {
        this.sériesDaVariávelComposta = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/formula-variavel/${id}/series`, { periodo: período });

        this.sériesDaVariávelComposta = r;
      } catch (error) {
        this.sériesDaVariávelComposta = { error };
      }
    },
  },
  getters: {
    valoresEmFoco({ Valores }) {
      const { var_id: varId } = this.route.params;
      return Valores[varId]?.linhas || [];
    },

    sériesDeCompostaParaEdição: (({ sériesDaVariávelComposta }) => {
      const base = {
        Previsto: [],
        PrevistoAcumulado: [],
        Realizado: [],
        RealizadoAcumulado: [],
        DiferençaPrevisto: [],
        DiferençaRealizado: [],
      };
      return Array.isArray(sériesDaVariávelComposta.linhas)
        ? sériesDaVariávelComposta.linhas.reduce((acc, cur, i) => {
          cur.series.forEach((x, j) => {
            const valorNominal = Number.parseFloat(x.valor_nominal);

            acc[sériesDaVariávelComposta.ordem_series[j]].push({
              referencia: x.referencia,
              valor: Number.isNaN(valorNominal)
                ? ''
                : valorNominal,
            });
          });

          acc.DiferençaPrevisto.push(acc.PrevistoAcumulado[i].valor - acc.Previsto[i].valor);
          acc.DiferençaRealizado.push(acc.RealizadoAcumulado[i].valor - acc.Realizado[i].valor);

          return acc;
        }, { ...base })
        : base;
    }),

    variáveisPorId: ({ Variaveis }) => Object.keys(Variaveis)
      .reduce((acc, cur) => {
        if (Array.isArray(Variaveis[cur])) {
          Variaveis[cur].forEach((x) => {
            if (!acc[x.id]) {
              acc[x.id] = x;
            }
          });
        }

        return acc;
      }, {}),

    variáveisCompostasPorReferência: ({ variáveisCompostas }) => Object.keys(variáveisCompostas)
      .reduce((acc, cur) => {
        if (Array.isArray(variáveisCompostas[cur])) {
          variáveisCompostas[cur].forEach((x) => {
            if (!acc[`@_${x.id}`]) {
              acc[`@_${x.id}`] = x;
            }
          });
        }

        return acc;
      }, {}),

    regiõesNasVariáveisPorCódigo: ({ variáveisPorCódigo }) => Object.keys(variáveisPorCódigo)
      .reduce((acc, cur) => {
        if (Array.isArray(variáveisPorCódigo[cur])) {
          if (!acc[cur]) {
            acc[cur] = [];
          }
          variáveisPorCódigo[cur].forEach((x) => {
            if (x.regiao && x.regiao.id) {
              acc[cur].push(x.regiao.id);
            }
          });
        }

        return acc;
      }, {}),
  },
});
