import toFloat from '@/helpers/toFloat';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOrcamentosStore = defineStore({
  id: 'Orcamentos',
  state: () => ({
    OrcamentoCusteio: {},
    OrcamentoPlanejado: {},
    OrcamentoRealizado: {},
    OrcamentoRealizadoConclusão: {},
    OrcamentoRealizadoPermissões: {},

    previstoEhZero: {},
    previstoEhZeroCriadoPor: {},
    previstoEhZeroCriadoEm: {},
  }),
  actions: {
    clear() {
      this.OrcamentoCusteio = {};
      this.OrcamentoPlanejado = {};
      this.OrcamentoRealizado = {};
    },

    // metas
    async getById(id, ano) {
      this.getOrcamentoCusteioById(id, ano);
      this.getOrcamentoPlanejadoById(id, ano);
      this.getOrcamentoRealizadoById(id, ano);
    },
    async getOrcamentoCusteioById(id, ano) {
      try {
        this.OrcamentoCusteio[ano] = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/meta-orcamento/?meta_id=${id}&ano_referencia=${ano}`);
        this.OrcamentoCusteio[ano] = r.linhas ? r.linhas : r;

        if (typeof r.previsto_eh_zero === 'boolean') {
          this.previstoEhZero[ano] = r.previsto_eh_zero;
        }
        if (r.previsto_eh_zero_criado_por?.nome_exibicao) {
          this.previstoEhZeroCriadoPor[ano] = r.previsto_eh_zero_criado_por;
        }
        if (r.previsto_eh_zero_criado_em) {
          this.previstoEhZeroCriadoEm[ano] = r.previsto_eh_zero_criado_em;
        }
      } catch (error) {
        this.OrcamentoCusteio[ano] = { error };
      }
    },
    async getOrcamentoPlanejadoById(idOrParams, ano) {
      const params = typeof idOrParams === 'object'
        ? idOrParams
        : {
          meta_id: idOrParams,
          ano_referencia: ano,
        };

      if (ano) {
        params.ano_referencia = ano;
      }

      try {
        this.OrcamentoPlanejado[ano] = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/orcamento-planejado/`, params);
        this.OrcamentoPlanejado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoPlanejado[ano] = { error };
      }
    },
    async getOrcamentoRealizadoById(idOrParams, ano) {
      const params = typeof idOrParams === 'object'
        ? idOrParams
        : {
          meta_id: idOrParams,
          ano_referencia: ano,
        };

      if (ano) {
        params.ano_referencia = ano;
      }

      try {
        this.OrcamentoRealizado[ano] = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/orcamento-realizado/`, params);
        this.OrcamentoRealizado[ano] = r.linhas ? r.linhas : r;

        if (r.concluido) {
          this.OrcamentoRealizadoConclusão[ano] = r.concluido;
        }
        if (r.permissoes) {
          this.OrcamentoRealizadoPermissões[ano] = r.permissoes;
        }
      } catch (error) {
        this.OrcamentoRealizado[ano] = { error };
      }
    },

    // projetos
    // eslint-disable-next-line max-len, default-param-last
    async buscarOrçamentosPrevistosParaProjeto(ano = this.route.params.ano, projetoId = this.route.params.projetoId, extraParams) {
      try {
        this.OrcamentoCusteio[ano] = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/projeto/${projetoId}/orcamento-previsto`, { ...extraParams, ano_referencia: ano });

        this.OrcamentoCusteio[ano] = r.linhas ? r.linhas : r;

        if (typeof r.previsto_eh_zero === 'boolean') {
          this.previstoEhZero[ano] = r.previsto_eh_zero;
        }
        if (r.previsto_eh_zero_criado_por?.nome_exibicao) {
          this.previstoEhZeroCriadoPor[ano] = r.previsto_eh_zero_criado_por;
        }
        if (r.previsto_eh_zero_criado_em) {
          this.previstoEhZeroCriadoEm[ano] = r.previsto_eh_zero_criado_em;
        }
      } catch (error) {
        this.OrcamentoCusteio[ano] = { error };
      }
    },

    // eslint-disable-next-line max-len, default-param-last
    async buscarOrçamentosPlanejadosParaProjeto(ano = this.route.params.ano, projetoId = this.route.params.projetoId, extraParams) {
      try {
        this.OrcamentoPlanejado[ano] = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/projeto/${projetoId}/orcamento-planejado`, { ...extraParams, ano_referencia: ano });

        this.OrcamentoPlanejado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoPlanejado[ano] = { error };
      }
    },

    // eslint-disable-next-line max-len, default-param-last
    async buscarOrçamentosRealizadosParaProjeto(ano = this.route.params.ano, projetoId = this.route.params.projetoId, extraParams) {
      try {
        this.OrcamentoRealizado[ano] = { loading: true };

        const r = await this.requestS.get(`${baseUrl}/projeto/${projetoId}/orcamento-realizado`, { ...extraParams, ano_referencia: ano });

        this.OrcamentoRealizado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoRealizado[ano] = { error };
      }
    },

    // METAS & PROJETOS
    async restringirPrevistoAZero(ano, params) {
      const parâmetrosCompletos = {
        considerar_zero: true,
        ano_referencia: ano,
        ...params,
      };

      if (this.route.params.meta_id && !parâmetrosCompletos.meta_id) {
        parâmetrosCompletos.meta_id = Number(this.route.params.meta_id);
      } else if (this.route.params.projetoId && !parâmetrosCompletos.projeto_id) {
        parâmetrosCompletos.projeto_id = Number(this.route.params.projetoId);
      }
      const segmento1 = parâmetrosCompletos.meta_id
        ? 'meta-orcamento'
        : `projeto/${parâmetrosCompletos.projeto_id}/orcamento-previsto`;
      try {
        if (await this.requestS.patch(`${baseUrl}/${segmento1}/zerado/`, parâmetrosCompletos)) {
          if (parâmetrosCompletos.meta_id) {
            this.getOrcamentoCusteioById(parâmetrosCompletos.meta_id, ano);
          } else if (parâmetrosCompletos.projeto_id) {
            this.buscarOrçamentosPrevistosParaProjeto(ano, parâmetrosCompletos.projeto_id);
          }
        }

        return true;
      } catch (error) {
        return false;
      }
    },

    // Custeio
    async updateOrcamentoCusteio(id, params) {
      const segmento1 = params.projeto_id
        ? `projeto/${params.projeto_id}/orcamento-previsto`
        : 'meta-orcamento';

      if (await this.requestS.patch(`${baseUrl}/${segmento1}/${id}`, params)) return true;
      return false;
    },
    async insertOrcamentoCusteio(params) {
      const segmento1 = params.projeto_id
        ? `projeto/${params.projeto_id}/orcamento-previsto`
        : 'meta-orcamento';

      if (await this.requestS.post(`${baseUrl}/${segmento1}/`, params)) return true;
      return false;
    },
    async deleteOrcamentoCusteio(id, projetoId = 0) {
      const segmento1 = projetoId
        ? `projeto/${projetoId}/orcamento-previsto`
        : 'meta-orcamento';

      if (await this.requestS.delete(`${baseUrl}/${segmento1}/${id}`)) return true;
      return false;
    },

    // Planejado
    async updateOrcamentoPlanejado(id, params) {
      const segmento1 = params.projeto_id
        ? `projeto/${params.projeto_id}/orcamento-planejado`
        : 'orcamento-planejado';

      if (await this.requestS.patch(`${baseUrl}/${segmento1}/${id}`, params)) return true;
      return false;
    },
    async insertOrcamentoPlanejado(params) {
      const segmento1 = params.projeto_id
        ? `projeto/${params.projeto_id}/orcamento-planejado`
        : 'orcamento-planejado';

      if (await this.requestS.post(`${baseUrl}/${segmento1}/`, params)) return true;
      return false;
    },
    async deleteOrcamentoPlanejado(id, projetoId) {
      const segmento1 = projetoId
        ? `projeto/${projetoId}/orcamento-planejado`
        : 'orcamento-planejado';

      if (await this.requestS.delete(`${baseUrl}/${segmento1}/${id}`)) return true;
      return false;
    },

    // Realizado
    async updateOrcamentoRealizado(id, params) {
      const segmento1 = params.projeto_id
        ? `projeto/${params.projeto_id}/orcamento-realizado`
        : 'orcamento-realizado';

      if (await this.requestS.patch(`${baseUrl}/${segmento1}/${id}`, params)) return true;
      return false;
    },
    async closeOrcamentoRealizado(params) {
      if (await this.requestS.patch(`${baseUrl}/orcamento-realizado/orcamento-concluido`, params)) return true;
      return false;
    },
    async insertOrcamentoRealizado(params) {
      const segmento1 = params.projeto_id
        ? `projeto/${params.projeto_id}/orcamento-realizado`
        : 'orcamento-realizado';

      if (await this.requestS.post(`${baseUrl}/${segmento1}/`, params)) return true;
      return false;
    },
    async deleteOrcamentoRealizado(id, projetoId = 0) {
      const segmento1 = projetoId
        ? `projeto/${projetoId}/orcamento-realizado`
        : 'orcamento-realizado';

      if (await this.requestS.delete(`${baseUrl}/${segmento1}/${id}`)) return true;
      return false;
    },
    async deleteOrcamentosRealizadosEmLote(ids, projetoId = 0) {
      const segmento1 = projetoId
        ? `projeto/${projetoId}/orcamento-realizado/em-lote`
        : 'orcamento-realizado/em-lote';

      if (await this.requestS.delete(`${baseUrl}/${segmento1}/`, ids)) return true;
      return false;
    },
  },

  getters: {
    // sem uso
    orçamentoEmFoco({ OrcamentoRealizado }) {
      const { ano, id } = this.route.params;
      const anoEmFoco = Array.isArray(OrcamentoRealizado?.[ano])
        ? OrcamentoRealizado[ano]
        : [];

      return anoEmFoco.find((x) => x.id == id);
    },
  },
});
