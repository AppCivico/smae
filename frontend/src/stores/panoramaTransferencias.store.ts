import type { MfDashTransferenciasDto } from '@back/casa-civil/dash/dto/transferencia.dto';
import type { PaginatedWithPagesDto } from '@back/common/dto/paginated.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const usePanoramaTransferenciasStore = defineStore(
  'panoramaTransferencias',
  {
    state: () => ({
      lista: [] as MfDashTransferenciasDto[],
      emFoco: null as MfDashTransferenciasDto | null,

      chamadasPendentes: {
        lista: false,
        emFoco: false,
      } as ChamadasPendentes,
      erro: null as unknown,

      paginacao: {
        tokenPaginacao: '',
        paginas: 0,
        paginaCorrente: 0,
        temMais: true,
        totalRegistros: 0,
      } as Paginacao,
    }),
    actions: {
      async buscarTudo(params = {}): Promise<void> {
        this.chamadasPendentes.lista = true;
        this.erro = null;

        try {
          const {
            linhas,
            token_paginacao: tokenPaginacao,
            paginas,
            pagina_corrente: paginaCorrente,
            tem_mais: temMais,
            total_registros: totalRegistros,
          } = (await this.requestS.get(
            `${baseUrl}/panorama/transferencias-workflow`,
            params,
          )) as PaginatedWithPagesDto<MfDashTransferenciasDto>;

          this.lista = linhas;

          this.paginacao.tokenPaginacao = tokenPaginacao;
          this.paginacao.paginas = paginas;
          this.paginacao.paginaCorrente = paginaCorrente;
          this.paginacao.temMais = temMais;
          this.paginacao.totalRegistros = totalRegistros;
        } catch (error_: unknown) {
          this.erro = error_;
        }
        this.chamadasPendentes.lista = false;
      },
    },

    getters: {},
  },
);
