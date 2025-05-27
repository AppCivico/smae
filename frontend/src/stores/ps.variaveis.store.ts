import type { ListVariavelDto } from '@back/variavel/dto/list-variavel.dto';
import type { VariavelItemDto } from '@back/variavel/entities/variavel.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListVariavelDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Erros {
  lista: unknown;
  emFoco: unknown;
}

interface Estado {
  lista: Lista;
  emFoco: VariavelItemDto | null;

  chamadasPendentes: ChamadasPendentes;
  erros: Erros;

  paginacao: {
    tokenPaginacao: string;
    paginas: number;
    paginaCorrente: number;
    temMais: boolean;
    totalRegistros: number;
  };
}

export const useVariaveisGlobaisStore = defineStore('variareis', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

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
      temMais: true,
      totalRegistros: 0,
    },
  }),
  actions: {
    async buscarItem(variavelId: number, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const {
          linhas,
          token_paginacao: tokenPaginacao,
          paginas,
          pagina_corrente: paginaCorrente,
          tem_mais: temMais,
          total_registros: totalRegistros,
        } = await this.requestS.get(`${baseUrl}/variavel`, params);

        this.lista = linhas;

        this.paginacao.tokenPaginacao = tokenPaginacao;
        this.paginacao.paginas = paginas;
        this.paginacao.paginaCorrente = paginaCorrente;
        this.paginacao.temMais = temMais;
        this.paginacao.totalRegistros = totalRegistros;
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(variavelId: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, variavelId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (variavelId) {
          resposta = await this.requestS.patch(`${baseUrl}/variavel/${variavelId || this.route.params.variavelId}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/variavel`, params);
        }

        this.chamadasPendentes.emFoco = false;
        this.erros.emFoco = null;
        return resposta;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
    }),

    variaveisPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
