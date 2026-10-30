import type {
  FilterPainelParlamentarDto,
  FilterPainelParlamentarTransferenciasDto,
} from '@back/casa-civil/painel-parlamentar/dto/filter-painel-parlamentar.dto';
import type {
  PainelParlamentarDto,
  PainelParlamentarTransferenciaDto,
} from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import type { PaginatedWithPagesDto } from '@back/common/dto/paginated.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}/painel-parlamentar`;

type Paginacao = {
  tokenPaginacao: string | null;
  paginas: number;
  paginaCorrente: number;
  temMais: boolean;
  totalRegistros: number;
};

interface Estado {
  painel: PainelParlamentarDto | null;
  transferencias: PainelParlamentarTransferenciaDto[];
  paginacao: Paginacao;
  chamadasPendentes: {
    painel: boolean;
    transferencias: boolean;
  };
  erros: {
    painel: unknown;
    transferencias: unknown;
  };
}

export const usePainelParlamentarStore = defineStore('painelParlamentar', {
  state: (): Estado => ({
    painel: null,
    transferencias: [],
    paginacao: {
      tokenPaginacao: null,
      paginas: 0,
      paginaCorrente: 0,
      temMais: false,
      totalRegistros: 0,
    },
    chamadasPendentes: {
      painel: false,
      transferencias: false,
    },
    erros: {
      painel: null,
      transferencias: null,
    },
  }),
  actions: {
    async buscarPainel(parlamentarId: number, params: FilterPainelParlamentarDto = {}) {
      this.chamadasPendentes.painel = true;
      this.erros.painel = null;

      try {
        this.painel = await this.requestS.get(`${baseUrl}/${parlamentarId}`, params) as PainelParlamentarDto;
      } catch (erro) {
        this.erros.painel = erro;
      }

      this.chamadasPendentes.painel = false;
    },

    async buscarTransferencias(
      parlamentarId: number,
      params: FilterPainelParlamentarTransferenciasDto = {},
    ) {
      this.chamadasPendentes.transferencias = true;
      this.erros.transferencias = null;

      try {
        const {
          linhas,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.get(
          `${baseUrl}/${parlamentarId}/transferencias`,
          params,
        ) as PaginatedWithPagesDto<PainelParlamentarTransferenciaDto>;

        this.transferencias = linhas;
        this.paginacao = {
          tokenPaginacao,
          paginas,
          paginaCorrente,
          temMais,
          totalRegistros,
        };
      } catch (erro) {
        this.erros.transferencias = erro;
      }

      this.chamadasPendentes.transferencias = false;
    },
  },
});
