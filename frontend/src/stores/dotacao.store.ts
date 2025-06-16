import type { SofEntidadeDto } from '@back/sof-entidade/entities/sof-entidade.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Dados = SofEntidadeDto['dados'] & { atualizado_em: string };

interface ChamadasPendentes {
  segmentos: boolean;
}

interface Estado {
  DotaçãoSegmentos: { [k: number | string]: Dados };
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

interface ExtraParams {
  pdm_id?: number;
  portfolio_id?: number;
}

export const useDotaçãoStore = defineStore('dotação', {
  state: (): Estado => ({
    DotaçãoSegmentos: {},

    chamadasPendentes: {
      segmentos: false,
    },
    erro: null,
  }),
  actions: {
    async getDotaçãoSegmentos(ano: number) {
      try {
        if (
          this.DotaçãoSegmentos?.[ano]?.atualizado_em !== new Date()
            .toISOString().substring(0, 10)
        ) {
          this.chamadasPendentes.segmentos = true;
        }

        const r = await this.requestS.get(`${baseUrl}/sof-entidade/${ano}`);
        if (r.dados) {
          this.DotaçãoSegmentos[ano] = r.dados;
          this.DotaçãoSegmentos[ano].atualizado_em = r.atualizado_em;
        }
      } catch (error) {
        this.erro = error;
      }

      this.chamadasPendentes.segmentos = false;
    },
    async getDotaçãoPlanejado(dotacao: string, ano: number, extraParams: ExtraParams) {
      if (!extraParams.pdm_id && !extraParams.portfolio_id) {
        throw new Error('`pdm_id` ou `portfolio_id` são obrigatórios');
      }

      try {
        const r = await this.requestS.patch(`${baseUrl}/dotacao/valor-planejado`, { dotacao, ano: Number(ano), ...extraParams });
        return r;
      } catch (error) {
        return { error };
      }
    },
    async getDotaçãoRealizado(dotacao: string, ano: number, extraParams: ExtraParams) {
      if (!extraParams.pdm_id && !extraParams.portfolio_id) {
        throw new Error('`pdm_id` ou `portfolio_id` são obrigatórios');
      }

      try {
        const r = await this.requestS.patch(`${baseUrl}/dotacao/valor-realizado`, { dotacao, ano: Number(ano), ...extraParams });
        return r.linhas.length ? r.linhas[0] : {};
      } catch (error) {
        return { error };
      }
    },
    async getDotaçãoRealizadoNota(nota_empenho: string, ano: number, extraParams: ExtraParams) {
      if (!extraParams.pdm_id && !extraParams.portfolio_id) {
        throw new Error('`pdm_id` ou `portfolio_id` são obrigatórios');
      }

      try {
        const r = await this.requestS.patch(`${baseUrl}/dotacao/valor-realizado-nota-empenho`, { nota_empenho, ano: Number(ano), ...extraParams });
        return r.linhas.length ? r.linhas[0] : {};
      } catch (error) {
        return { error };
      }
    },
    async getDotaçãoRealizadoProcesso(processo: string, ano: number, extraParams: ExtraParams) {
      if (!extraParams.pdm_id && !extraParams.portfolio_id) {
        throw new Error('`pdm_id` ou `portfolio_id` são obrigatórios');
      }

      try {
        const r = await this.requestS.patch(`${baseUrl}/dotacao/valor-realizado-processo`, { processo, ano: Number(ano), ...extraParams });
        return r.linhas;
      } catch (error) {
        return { error };
      }
    },
  },
  getters: {
    FontesDeRecursosPorAnoPorCódigo({ DotaçãoSegmentos }) {
      return Object.keys(DotaçãoSegmentos).reduce((acc: any, cur) => {
        acc[cur] = DotaçãoSegmentos[cur]
          .fonte_recursos?.reduce((acc2, cur2) => ({ ...acc2, [cur2.codigo]: cur2 }), {});
        return acc;
      }, {});
    },
    ÓrgãosPorAnoPorCódigo({ DotaçãoSegmentos }) {
      return Object.keys(DotaçãoSegmentos).reduce((acc: any, cur) => {
        acc[cur] = DotaçãoSegmentos[cur]
          .orgaos?.reduce((acc2, cur2) => ({ ...acc2, [cur2.codigo]: cur2 }), {});
        return acc;
      }, {});
    },
    UnidadesPorAnoPorCódigoComposto({ DotaçãoSegmentos }) {
      return Object.keys(DotaçãoSegmentos).reduce((acc: any, cur) => {
        acc[cur] = DotaçãoSegmentos[cur]
          .unidades?.reduce((acc2, cur2) => ({ ...acc2, [`${cur2.cod_orgao}.${cur2.codigo}`]: cur2 }), {});
        return acc;
      }, {});
    },
  },
});
