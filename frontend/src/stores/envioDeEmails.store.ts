import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface EmailItem {
  id: number;
  sigra: string;
  descricao: string;
}

interface Estado {
  lista: EmailItem[];
  paginacao: Paginacao;
  chamadasPendentes: {
    lista: boolean;
    disparar: boolean;
  };
  erro: {
    lista: unknown;
    disparar: unknown;
  };
}

export const useEnvioDeEmailsStore = defineStore('envioDeEmails', {
  state: (): Estado => ({
    lista: [],
    paginacao: {
      tokenPaginacao: '',
      paginas: 0,
      paginaCorrente: 0,
      temMais: false,
      totalRegistros: 0,
    },
    chamadasPendentes: {
      lista: false,
      disparar: false,
    },
    erro: {
      lista: null,
      disparar: null,
    },
  }),

  actions: {
    async buscarTudo(params: any): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro.lista = null;

      try {
        const {
          linhas,
          pagina_corrente: paginaCorrente,
          paginas,
          tem_mais: temMais,
          token_paginacao: tokenPaginacao,
          total_registros: totalRegistros,
        } = (await this.requestS.get(
          `${baseUrl}/demanda/emails-parlamentares`,
          params,
        )) as {
          linhas: EmailItem[];
          pagina_corrente: number;
          paginas: number;
          tem_mais: boolean;
          token_paginacao: string;
          total_registros: number;
        };

        this.lista = linhas;
        this.paginacao.paginaCorrente = paginaCorrente;
        this.paginacao.paginas = paginas;
        this.paginacao.temMais = temMais;
        this.paginacao.tokenPaginacao = tokenPaginacao || '';
        this.paginacao.totalRegistros = totalRegistros;
      } catch (erro: unknown) {
        this.erro.lista = erro;
      } finally {
        this.chamadasPendentes.lista = false;
      }
    },

    async dispararEmail(): Promise<boolean> {
      this.chamadasPendentes.disparar = true;
      this.erro.disparar = null;

      try {
        await this.requestS.post(`${baseUrl}/demanda/enviar-email-parlamentares`, {});
        return true;
      } catch (erro: unknown) {
        this.erro.disparar = erro;
        return false;
      } finally {
        this.chamadasPendentes.disparar = false;
      }
    },
  },
});
