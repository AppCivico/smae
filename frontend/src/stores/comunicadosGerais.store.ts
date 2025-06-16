import type {
  FilterNotaComunicadoDto,
  NotaComunicadoItemDto,
} from '@back/bloco-nota/nota/dto/comunicados.dto';
import type { PaginatedDto } from '@back/common/dto/paginated.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}/nota-comunicados`;

type FiltroDadosGerais = FilterNotaComunicadoDto & {
  token_paginacao?: string;
  pagina?: string;
  buscandoMais?: boolean;
};
interface Estado {
  dados: NotaComunicadoItemDto[];
  temMais: boolean;
  tokenProximaPagina: string | null;
  erro: null | unknown;
}

type Paginacao = {
  paginas: number;
  totalRegistros: number;
  tokenProximaPagina?: string;
  temMais: boolean;
};

export const useComunicadosGeraisStore = defineStore('comunicadosGerais', {
  state: (): Estado => ({
    erro: null,
    temMais: false,
    dados: [],
    tokenProximaPagina: null,
  }),
  actions: {
    async getComunicadosGerais({
      data_inicio,
      data_fim,
      palavra_chave,
      lido,
      tipo,
      pagina,
      token_paginacao,
      buscandoMais,
    }: FiltroDadosGerais) {
      try {
        const params = {
          data_inicio,
          data_fim,
          palavra_chave,
          lido,
          tipo,
          token_proxima_pagina: token_paginacao,
        };
        const valoresQuery = Object.keys(params).reduce<any>((amount, item) => {
          if (params[item] !== undefined) {
            // eslint-disable-next-line no-param-reassign
            amount[item] = params[item];
          }

          return amount;
        }, {});

        const resposta: PaginatedDto<NotaComunicadoItemDto> = await this.requestS.get(`${baseUrl}`, valoresQuery);

        if (!buscandoMais) {
          this.dados = resposta.linhas;
        } else {
          this.dados = [...this.dados, ...resposta.linhas];
        }

        this.temMais = resposta.tem_mais;
        this.tokenProximaPagina = resposta.token_proxima_pagina;
      } catch (err) {
        console.error('Erro ao tentar buscar docuumentos gerais', err);
      }
    },
    async mudarLido(id: number, lido: boolean) {
      await this.requestS.patch(`${baseUrl}/${id}/lido`, {
        lido,
      });
    },
  },
  getters: {
    comunicadosGerais(state): NotaComunicadoItemDto[] {
      return state.dados;
    },
    paginacao(state): Paginacao {
      return {
        paginas: 2,
        totalRegistros: 300,
        tokenProximaPagina: state.tokenProximaPagina || undefined,
        temMais: state.temMais,
      };
    },
  },
});
