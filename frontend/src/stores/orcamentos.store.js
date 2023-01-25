import { requestS } from '@/helpers';
import toFloat from '@/helpers/toFloat';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useOrcamentosStore = defineStore({
  id: 'Orcamentos',
  state: () => ({
    OrcamentoCusteio: {},
    OrcamentoPlanejado: {},
    OrcamentoRealizado: {},
    DotacaoSegmentos: {},
  }),
  actions: {
    clear() {
      this.OrcamentoCusteio = {};
      this.OrcamentoPlanejado = {};
      this.OrcamentoRealizado = {};
    },
    async getById(id, ano) {
      this.getOrcamentoCusteioById(id, ano);
      this.getOrcamentoPlanejadoById(id, ano);
      this.getOrcamentoRealizadoById(id, ano);
    },
    async getOrcamentoCusteioById(id, ano) {
      try {
        this.OrcamentoCusteio[ano] = { loading: true };
        const r = await requestS.get(`${baseUrl}/meta-orcamento/?meta_id=${id}&ano_referencia=${ano}`);
        this.OrcamentoCusteio[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoCusteio[ano] = { error };
      }
    },
    async getOrcamentoPlanejadoById(id, ano) {
      try {
        this.OrcamentoPlanejado[ano] = { loading: true };
        const r = await requestS.get(`${baseUrl}/orcamento-planejado/?meta_id=${id}&ano_referencia=${ano}`);
        this.OrcamentoPlanejado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoPlanejado[ano] = { error };
      }
    },
    async getOrcamentoRealizadoById(id, ano) {
      try {
        this.OrcamentoRealizado[ano] = { loading: true };
        const r = await requestS.get(`${baseUrl}/orcamento-realizado/?meta_id=${id}&ano_referencia=${ano}`);
        this.OrcamentoRealizado[ano] = r.linhas ? r.linhas : r;
      } catch (error) {
        this.OrcamentoRealizado[ano] = { error };
      }
    },

    async updateOrcamentoCusteio(id, params) {
      if (await requestS.patch(`${baseUrl}/meta-orcamento/${id}`, params)) return true;
      return false;
    },
    async insertOrcamentoCusteio(params) {
      if (await requestS.post(`${baseUrl}/meta-orcamento/`, params)) return true;
      return false;
    },
    async deleteOrcamentoCusteio(id) {
      if (await requestS.delete(`${baseUrl}/meta-orcamento/${id}`)) return true;
      return false;
    },

    // Planejado
    async updateOrcamentoPlanejado(id, params) {
      if (await requestS.patch(`${baseUrl}/orcamento-planejado/${id}`, params)) return true;
      return false;
    },
    async insertOrcamentoPlanejado(params) {
      if (await requestS.post(`${baseUrl}/orcamento-planejado/`, params)) return true;
      return false;
    },
    async deleteOrcamentoPlanejado(id) {
      if (await requestS.delete(`${baseUrl}/orcamento-planejado/${id}`)) return true;
      return false;
    },

    // Realizado
    async updateOrcamentoRealizado(id, params) {
      if (await requestS.patch(`${baseUrl}/orcamento-realizado/${id}`, params)) return true;
      return false;
    },
    async insertOrcamentoRealizado(params) {
      if (await requestS.post(`${baseUrl}/orcamento-realizado/`, params)) return true;
      return false;
    },
    async deleteOrcamentoRealizado(id) {
      if (await requestS.delete(`${baseUrl}/orcamento-realizado/${id}`)) return true;
      return false;
    },

    // Dotacoes
    async getDotacaoSegmentos(ano) {
      try {
        if (!this.DotacaoSegmentos[ano]
          || this.DotacaoSegmentos[ano]?.atualizado_em != new Date().toISOString().substring(0, 10)
        ) {
          this.DotacaoSegmentos[ano] = { loading: true };
        }

        const r = await requestS.get(`${baseUrl}/sof-entidade/${ano}`);
        if (r.dados) {
          this.DotacaoSegmentos[ano] = r.dados;
          this.DotacaoSegmentos[ano].atualizado_em = r.atualizado_em;
        }
      } catch (error) {
        this.DotacaoSegmentos[ano] = { error };
      }
    },
    async getDotacaoPlanejado(dotacao, ano) {
      try {
        const r = await requestS.patch(`${baseUrl}/dotacao/valor-planejado`, { dotacao, ano: Number(ano) });
        return r;
      } catch (error) {
        return { error };
      }
    },
    async getDotacaoRealizado(dotacao, ano) {
      try {
        const r = await requestS.patch(`${baseUrl}/dotacao/valor-realizado`, { dotacao, ano: Number(ano) });
        return r.linhas.length ? r.linhas[0] : {};
      } catch (error) {
        return { error };
      }
    },
    async getDotacaoRealizadoNota(nota_empenho, ano) {
      try {
        const r = await requestS.patch(`${baseUrl}/dotacao/valor-realizado-nota-empenho`, { nota_empenho, ano: Number(ano) });
        return r.linhas.length ? r.linhas[0] : {};
      } catch (error) {
        return { error };
      }
    },
    async getDotacaoRealizadoProcesso(processo, ano) {
      try {
        const r = await requestS.patch(`${baseUrl}/dotacao/valor-realizado-processo`, { processo, ano: Number(ano) });
        return r.linhas;
      } catch (error) {
        return { error };
      }
    },
  },

  getters: {
    orcamentoEmFoco({ OrcamentoRealizado }) {
      const { ano, id } = this.route.params;
      const anoEmFoco = OrcamentoRealizado[ano] || [];

      return anoEmFoco.find((x) => x.id == id);
    },

    totaisDosItens() {
      const { itens = [], smae_soma_valor_empenho = '0', smae_soma_valor_liquidado = '0' } = this.orcamentoEmFoco || {};

      const empenho = toFloat(smae_soma_valor_empenho)
        + itens.reduce((r, x) => r + toFloat(x.valor_empenho), 0)
        ?? 0;
      const liquidacao = toFloat(smae_soma_valor_liquidado)
        + itens.reduce((r, x) => r + toFloat(x.valor_liquidado), 0)
        ?? 0;

      return {
        empenho,
        liquidacao,
      };
    },

    maioresDosItens() {
      const { itens = [] } = this.orcamentoEmFoco || {};

      const itensComValoresConvertidosEmNúmeros = itens.map((x) => ({
        ...x,
        valor_empenho: x.valor_empenho !== null && typeof x.valor_empenho !== 'undefined'
          ? toFloat(x.valor_empenho) : null,
        valor_liquidado: x.valor_liquidado !== null && typeof x.valor_liquidado !== 'undefined'
          ? toFloat(x.valor_liquidado) : null,
      }));

      return {
        empenho: itensComValoresConvertidosEmNúmeros
          .filter((x) => x.valor_empenho !== null)
          .sort((a, b) => b.mes - a.mes)?.[0]?.valor_empenho || 0,
        liquidacao: itensComValoresConvertidosEmNúmeros
          .filter((x) => x.valor_liquidado !== null)
          .sort((a, b) => b.mes - a.mes)?.[0]?.valor_liquidado || 0,
      };
    },

    totaisQueSuperamSOF() {
      const { orcamentoEmFoco = {}, maioresDosItens = {} } = this;
      const { empenho_liquido = '0', valor_liquidado = '0' } = orcamentoEmFoco;
      const { empenho = 0, liquidacao = 0 } = maioresDosItens;

      const resp = [];

      if (empenho > toFloat(empenho_liquido)) {
        resp.push('empenho');
      }

      if (liquidacao > toFloat(valor_liquidado)) {
        resp.push('liquidacao');
      }

      return resp;
    },
  },
});
