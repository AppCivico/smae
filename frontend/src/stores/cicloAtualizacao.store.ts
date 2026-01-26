import type { PaginatedDto } from '@back/common/dto/paginated.dto';
import type {
  FilterVariavelGlobalCicloDto,
  VariavelAnaliseQualitativaResponseDto,
  VariavelCicloFaseCountDto,
  VariavelGlobalCicloDto,
} from '@back/variavel/dto/variavel.ciclo.dto';
import { defineStore } from 'pinia';
import type { ParametrosDeRequisicao } from '@/helpers/requestS';
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
  contagemDeVariaveis: VariavelCicloFaseCountDto | null;
  temMais: boolean;
  tokenProximaPagina: string | null;
  erro: null | unknown;
  emFoco: VariavelAnaliseQualitativaResponseDto | null;
  // Obsoleto. Trocar pelo `chamadasPendentes`
  carregando: boolean;
  chamadasPendentes: {
    contagemDeVariaveis: boolean;
    emFoco: boolean;
  };
  erros: {
    contagemDeVariaveis: null | unknown;
    emFoco: null | unknown;
  };
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
  }[];
  aprovar: boolean;
  pedido_complementacao?: string;
};

const fileStore = useFileStore();

export const useCicloAtualizacaoStore = (prefixo = '') => defineStore(prefixo ? `${prefixo}.cicloAtualizacao` : 'cicloAtualizacao', {
  state: (): Estado => ({
    erro: null,
    temMais: false,
    dados: [],
    contagemDeVariaveis: null,
    tokenProximaPagina: null,
    emFoco: null,
    // Obsoleto. Trocar pelo `chamadasPendentes`
    carregando: false,
    chamadasPendentes: {
      contagemDeVariaveis: false,
      emFoco: false,
    },
    erros: {
      contagemDeVariaveis: null,
      emFoco: null,
    },
  }),
  actions: {
    async getCiclosAtualizacao({
      token_paginacao,
      buscandoMais,
      ...params
    }: FiltroDadosGerais = {}): Promise<void> {
      try {
        const resposta = await this.requestS.get(`${baseUrl}/plano-setorial-variavel-ciclo`, {
          ...params,
          token_proxima_pagina: token_paginacao,
        }) as PaginatedDto<VariavelGlobalCicloDto>;

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
      // Obsoleto. Trocar pelo `chamadasPendentes`
      this.carregando = true;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/variavel-analise-qualitativa`, {
          variavel_id: id,
          data_referencia: dataReferencia,
        }) as VariavelAnaliseQualitativaResponseDto;

        this.emFoco = resposta;
      } finally {
        // Obsoleto. Trocar pelo `chamadasPendentes`
        this.carregando = false;
      }
    },
    async obterContagemDeVariaveisPorFase(
      params: ParametrosDeRequisicao | undefined,
    ): Promise<void> {
      this.chamadasPendentes.contagemDeVariaveis = true;
      this.erros.contagemDeVariaveis = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/plano-setorial-variavel-ciclo/total`,
          params,
        ) as VariavelCicloFaseCountDto;

        this.contagemDeVariaveis = resposta;
      } catch (err) {
        this.erros.contagemDeVariaveis = err;
      } finally {
        this.chamadasPendentes.contagemDeVariaveis = false;
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
        // Obsoleto. Trocar pelo `chamadasPendentes`
        this.carregando = true;

        await this.requestS.patch(
          `${baseUrl}/plano-setorial-variavel-ciclo`,
          dadosASeremEnviados,
        );
      } finally {
        // Obsoleto. Trocar pelo `chamadasPendentes`
        this.carregando = false;
      }
    },
  },
  getters: {
    ciclosAtualizacao(state): VariavelGlobalCicloDto[] {
      return state.dados;
    },
    contagemDeVariaveisPorFase: ({ contagemDeVariaveis }) => contagemDeVariaveis?.linhas
      .reduce((acc, item) => {
        acc[item.fase] = item.quantidade;
        return acc;
      }, {} as Record<string, number>) || {},
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
      // Obsoleto. Trocar pelo `chamadasPendentes`
      return state.carregando || fileStore.carregando;
    },
  },
})();
