/* eslint-disable import/no-extraneous-dependencies */

import type {
  VariavelGlobalCicloDto,
  FilterVariavelGlobalCicloDto,
  VariavelAnaliseQualitativaResponseDto,
} from '@/../../backend/src/variavel/dto/variavel.ciclo.dto';

import type { PaginatedDto } from '@/../../backend/src/common/dto/paginated.dto';

import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type FiltroDadosGerais = FilterVariavelGlobalCicloDto & {
  token_paginacao?: string;
  pagina?: string;
  buscandoMais?: boolean;
};

export type VariavelCiclo = VariavelGlobalCicloDto;

interface Estado {
  dados: VariavelGlobalCicloDto[];
  temMais: boolean;
  tokenProximaPagina: string | null;
  erro: null | unknown;
  emFoco: VariavelAnaliseQualitativaResponseDto | null;
}

type Paginacao = {
  paginas: number;
  totalRegistros: number;
  tokenProximaPagina?: string;
  temMais: boolean;
};

type DadosASeremEnviados = {
  data_referencia: string;
  variavel_id: number;
  analise_qualitativa?: string;
  uploads: {
    nome_original: string;
    download_token: string;
  }[];
  valores: [
    {
      variavel_id: number;
      valor_realizado?: string | null;
      valor_realizado_acumulado?: string | null;
    },
  ];
  aprovar: boolean;
  pedido_complementacao?: string;
};

export const useCicloAtualizacaoStore = defineStore('cicloAtualizacao', {
  state: (): Estado => ({
    erro: null,
    temMais: false,
    dados: [],
    tokenProximaPagina: null,
    emFoco: null,
  }),
  actions: {
    async getCiclosAtualizacao({
      token_paginacao,
      buscandoMais,
      ...params
    }: FiltroDadosGerais): Promise<void> {
      try {
        const resposta: PaginatedDto<VariavelGlobalCicloDto> = await this.requestS.get(`${baseUrl}/plano-setorial-variavel-ciclo`, {
          ...params,
          token_proxima_pagina: token_paginacao,
        });

        if (!buscandoMais) {
          this.dados = resposta.linhas;
        } else {
          this.dados = [...this.dados, ...resposta.linhas];
        }

        this.temMais = resposta.tem_mais;
        this.tokenProximaPagina = resposta.token_proxima_pagina;
      } catch (err) {
        console.error('Erro ao tentar buscar ciclos de atualização', err);
      }
    },
    async obterCicloPorId(id: string, dataReferencia: string): Promise<void> {
      const resposta: VariavelAnaliseQualitativaResponseDto = await this.requestS.get(`${baseUrl}/variavel-analise-qualitativa`, {
        variavel_id: id,
        data_referencia: dataReferencia,
      });

      this.emFoco = resposta;
      console.log(this.emFoco);
    },
    async enviarDados(dados: DadosASeremEnviados) {
      const dadosASeremEnviados = {
        ...dados,
        // valores: dados.valores.map((item) => ({ ...item, variavel_id: dados.variavel_id })),
        uploads: dados.uploads.map((item) => item.download_token),
      };

      console.log(dadosASeremEnviados);

      // await this.requestS.patch(
      //   `${baseUrl}/plano-setorial-variavel-ciclo`,
      //   dadosASeremEnviados,
      // );
    },
  },
  getters: {
    ciclosAtualizacao(state): VariavelGlobalCicloDto[] {
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
