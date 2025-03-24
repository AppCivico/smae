/* eslint-disable import/no-extraneous-dependencies */
import { defineStore } from 'pinia';

import type {
  VariavelGlobalCicloDto,
  FilterVariavelGlobalCicloDto,
  VariavelAnaliseQualitativaResponseDto,
} from '@/../../backend/src/variavel/dto/variavel.ciclo.dto';

import type { PaginatedDto } from '@/../../backend/src/common/dto/paginated.dto';

import { useFileStore } from './file.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type FiltroDadosGerais = Omit<FilterVariavelGlobalCicloDto, 'referencia'> & {
  referencia?: string;
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
  carregando: boolean;
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
    descricao: string | null;
  }[];
  valores: {
    variavel_id: number;
    valor_realizado: string | null;
    valor_realizado_acumulado: string | null;
  } [];
  aprovar: boolean;
  pedido_complementacao?: string;
};

const fileStore = useFileStore();

export const useCicloAtualizacaoStore = (prefixo = '') => defineStore(prefixo ? `${prefixo}.cicloAtualizacao` : 'cicloAtualizacao', {
  state: (): Estado => ({
    erro: null,
    temMais: false,
    dados: [],
    tokenProximaPagina: null,
    emFoco: null,
    carregando: false,
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
      this.emFoco = null;
      this.carregando = true;

      try {
        const resposta: VariavelAnaliseQualitativaResponseDto = await this.requestS.get(`${baseUrl}/variavel-analise-qualitativa`, {
          variavel_id: id,
          data_referencia: dataReferencia,
        });

        this.emFoco = resposta;
      } finally {
        this.carregando = false;
      }
    },
    async enviarDados(dados: DadosASeremEnviados) {
      try {
        const dadosASeremEnviados = {
          ...dados,
          uploads: dados.uploads.map((item) => ({
            upload_token: item.download_token,
            descricao: item.descricao,
          })),
        };
        this.carregando = true;

        await this.requestS.patch(
          `${baseUrl}/plano-setorial-variavel-ciclo`,
          dadosASeremEnviados,
        );
      } finally {
        this.carregando = false;
      }
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
    temCategorica(state): boolean {
      return !!state.emFoco?.variavel.variavel_categorica_id;
    },
    bloqueado(state): boolean {
      return state.carregando || fileStore.carregando;
    },
  },
})();
