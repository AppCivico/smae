import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { GrupoPortfolioItemDto, ListGrupoPortfolioDto } from '@/../../backend/src/pp/grupo-portfolio/entities/grupo-portfolio.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

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

export const useObservadoresStore = defineStore('observadores', {
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
    async buscarItem(id:number, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/grupo-portfolio/`, { id, ...params });
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
        const { linhas } = await this.requestS.get(`${baseUrl}/grupo-portfolio/`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/grupo-portfolio/${id}`);

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
          await this.requestS.patch(`${baseUrl}/grupo-portfolio/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/grupo-portfolio`, params);
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
    itemParaEdição: ({ emFoco }) => ({
      ...emFoco,
      participantes: emFoco?.participantes && Array.isArray(emFoco.participantes)
        ? emFoco.participantes.map((x) => x.id)
        : [],
    }),
  },
});
