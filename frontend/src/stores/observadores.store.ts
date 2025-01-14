import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { GrupoPortfolioItemDto, ListGrupoPortfolioDto } from '@/../../backend/src/pp/grupo-portfolio/entities/grupo-portfolio.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

// Define the type for the `meta` object:
type RouteMeta = {
  [key: string]: any;
};

function caminhoParaApi(rotaMeta:RouteMeta) {
  if (
    rotaMeta.entidadeMãe === 'projeto'
  ) {
    return 'grupo-portfolio';
  }
  if (
    rotaMeta.entidadeMãe === 'mdo'
  ) {
    return 'grupo-portfolio-mdo';
  }
  throw new Error('Você precisa estar em algum módulo para executar essa ação.');
}

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: ListGrupoPortfolioDto['linhas'];
  emFoco: GrupoPortfolioItemDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

type TiposEntidadeMae = 'obra' | 'projeto';

export const useObservadoresStore = (entidadeMae: TiposEntidadeMae = 'projeto') => defineStore(`${entidadeMae}.observadores`, {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id: number, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/${caminhoParaApi(this.route.meta)}/`,
          { id, ...params },
        );
        this.emFoco = Array.isArray(resposta.linhas) && resposta.linhas[0]
          ? resposta.linhas[0]
          : {
            ...resposta,
          };
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      try {
        const { linhas } = await this.requestS.get(
          `${baseUrl}/${caminhoParaApi(this.route.meta)}/`,
          params,
        );
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(
          `${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`,
        );

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        if (id) {
          await this.requestS.patch(
            `${baseUrl}/${caminhoParaApi(this.route.meta)}/${id}`,
            params,
          );
        } else {
          await this.requestS.post(
            `${baseUrl}/${caminhoParaApi(this.route.meta)}`,
            params,
          );
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },

  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      participantes:
          emFoco?.participantes && Array.isArray(emFoco.participantes)
            ? emFoco.participantes.map((x) => x.id)
            : [],
    }),
  },
})();
