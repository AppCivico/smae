import dateToField from '@/helpers/dateToField';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useVariaveisStore = defineStore({
  id: 'Variaveis',
  state: () => ({
    // atentar que propriedades aninhadas não são reativas.
    // A sua criação é, mas a alteração não!
    Variaveis: {},
    variáveisCompostas: {},
    variáveisEmUso: {},
    singleVariaveis: {},
    variáveisPorCódigo: {},
    operaçõesParaVariávelComposta: {},
    Valores: {},
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
        const r = await this.requestS.get(`${baseUrl}/indicador-variavel?remover_desativados=true&indicador_id=${indicador_id}`);
        this.Variaveis[indicador_id] = r.linhas.map((x) => {
          x.orgao_id = x.orgao?.id ?? null;
          x.regiao_id = x.regiao?.id ?? null;
          x.unidade_medida_id = x.unidade_medida?.id ?? null;
          x.acumulativa = x.acumulativa ? '1' : false;
          x.inicio_medicao = dateToField(x.inicio_medicao).slice(3, 10);
          x.fim_medicao = dateToField(x.fim_medicao).slice(3, 10);
          return x;
        }).sort((a, b) => { return a.codigo.localeCompare(b.codigo) });
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
        this.variáveisCompostas[indicadorId] = r.rows;
      } catch (error) {
        this.variáveisCompostas[indicadorId] = { error };
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
    async insert(params) {
      const r = await this.requestS.post(`${baseUrl}/indicador-variavel`, params);
      if (r.id) return r.id;
      return false;
    },
    async update(id, params) {
      if (await this.requestS.patch(`${baseUrl}/indicador-variavel/${id}`, params)) return true;
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
    async getValores(id) {
      try {
        if (!id) throw 'Variável inválida';
        this.Valores[id] = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/indicador-variavel/${id}/serie`);
        this.Valores[id] = r;
      } catch (error) {
        this.Valores[id] = { error };
      }
    },
    async updateValores(params) {
      if (await this.requestS.patch(`${baseUrl}/indicador-variavel-serie`, params)) return true;
      return false;
    },
  },
  getters: {
    valoresEmFoco({ Valores }) {
      const { var_id: varId } = this.route.params;
      return Valores[varId]?.linhas || [];
    },

    variaveisEmUso() {
      const indicadorId = this.route.params.indicador_id

      let variaveisSimples   = this.$state.Variaveis[indicadorId];
      let variaveisCompostas = this.$state.variáveisCompostas[indicadorId];

      variaveisSimples = Array.isArray(variaveisSimples) ? variaveisSimples.filter(v => {
        return v.indicador_variavel.some( iv => !iv.desativado)
      }) : [];
      
      variaveisCompostas = Array.isArray(variaveisCompostas) ?
      variaveisCompostas
        .map( (row) => row.formula_variaveis )
        .reduce((unique, item) => {
          return unique.some(obj => obj.variavel_id === item.variavel_id) ? unique : [...unique, item];
        }, [])
        .map( (row) => {
          return this.$state.Variaveis[indicadorId].find((v) => v.id == row[0].variavel_id)
        })
      : [];

      const variaveisEmUso = [...new Set([...variaveisSimples, ...variaveisCompostas])];
      variaveisEmUso.sort((a, b) => { return a.codigo.localeCompare(b.codigo) });

      return variaveisEmUso
    },

    variáveisCompostasPorReferência: ({ variáveisCompostas }) => Object.keys(variáveisCompostas)
      .reduce((acc, cur) => {
        if (Array.isArray(variáveisCompostas[cur])) {
          variáveisCompostas[cur].forEach((x) => {
            if (!acc[x.id]) {
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
