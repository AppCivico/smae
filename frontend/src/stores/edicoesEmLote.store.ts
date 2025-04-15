import type {
  AtualizacaoEmLoteDetalheDto,
  AtualizacaoEmLoteResumoDto,
} from '@back/atualizacao-em-lote/dto/atualizacao-em-lote.dto';
import type { PaginatedWithPagesDto } from '@back/common/dto/paginated.dto';
import type { RecordWithId } from '@back/common/dto/record-with-id.dto';
import type { CreateRunUpdateDto } from '@back/task/run_update/dto/create-run-update.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Estado = {
  lista: AtualizacaoEmLoteResumoDto[];
  emFoco: AtualizacaoEmLoteDetalheDto | null;

  idsSelecionados: number[];

  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
  paginacao: Paginacao;
};

export const useEdicoesEmLoteStore = (prefixo = '') => defineStore(prefixo ? `${prefixo}.edicoesEmLote` : 'edicoesEmLote', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    idsSelecionados: [],

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erros: {
      lista: null,
      emFoco: null,
    },
    paginacao: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: false,
      totalRegistros: 0,
    },
  }),
  actions: {
    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        const {
          linhas,
          pagina_corrente: paginaCorrente,
          paginas,
          tem_mais: temMais,
          token_paginacao: tokenPaginacao,
          total_registros: totalRegistros,
        } = await this.requestS.get(`${baseUrl}/atualizacao-em-lote`, params) as PaginatedWithPagesDto<AtualizacaoEmLoteResumoDto>;

        this.lista = linhas;

        this.paginacao.paginaCorrente = paginaCorrente;
        this.paginacao.paginas = paginas;
        this.paginacao.temMais = temMais;
        this.paginacao.tokenPaginacao = tokenPaginacao || '';
        this.paginacao.totalRegistros = totalRegistros;
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async buscarItem(id = 0, params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;
      this.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/atualizacao-em-lote/${id}`, params) as AtualizacaoEmLoteDetalheDto;

        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async salvarItem(params:CreateRunUpdateDto): Promise<RecordWithId | boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/atualizacao-em-lote`, params as unknown as Record<string, unknown>) as RecordWithId;

        this.chamadasPendentes.emFoco = false;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    limparIdsSelecionados(): void {
      this.idsSelecionados.splice(0);
    },
  },
})();
