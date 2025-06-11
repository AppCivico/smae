import type {
  ListVariavelCategoricaDto,
  VariavelCategoricaItem,
} from '@back/variavel-categorica/dto/variavel-categorica.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListVariavelCategoricaDto['linhas'];

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
  emFoco: VariavelCategoricaItem;
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

export const useVariaveisCategoricasStore = defineStore('variareisCategoricas', {
  state: (): Estado => ({
    lista: [],
    emFoco: {},

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
        } = await this.requestS.get(`${baseUrl}/variavel-categorica`, params);

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
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/variavel-categorica/`, { id, ...params });
        const [grupo] = resposta.linhas;
        this.emFoco = grupo;
      } catch (erro: unknown) {
        this.erros.emFoco = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(variavelCategoricaId: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/variavel-categorica/${variavelCategoricaId || this.route.params.variavelCategoricaId}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erros.emFoco = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, variavelCategoricaId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (variavelCategoricaId) {
          resposta = await this.requestS.patch(`${baseUrl}/variavel-categorica/${variavelCategoricaId || this.route.params.variavelCategoricaId}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/variavel-categorica`, params);
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
    variaveisPositivas: ({ lista }: Estado) => lista.filter((variavel) => variavel.id > 0),
    variaveisPorId: ({ lista }: Estado) => lista
      .reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
    itemParaEdicao({ emFoco }: { emFoco: Record<string, unknown> }): Record<string, unknown> { // está feio pq n usei os tipos do backend
      return {
        ...emFoco,
        valores: Array.isArray(emFoco.valores) ? emFoco.valores : [
          {
            titulo: '',
            descricao: '',
            valor_variavel: null,
            ordem: null,
          },
        ],
      };
    },
    obterValoresVariavelCategoricaPorId: ({ lista }: Estado) => (id: number) => {
      const variavelCategorica = lista.find((item) => item.id === Number(id));
      if (!variavelCategorica) {
        console.error(
          `Não foi possível obter variavel categórica pelo ID: ${id}`,
        );

        return [];
      }

      return variavelCategorica.valores;
    },
  },

});
