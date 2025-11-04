import type { PortfolioTagDto } from '@back/pp/portfolio-tag/entities/portfolio-tag.entity';
import type { ListPortfolioTagDto } from '@back/pp/portfolio-tag/dto/list-portfolio-tag.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPortfolioTagDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  excluir: boolean;
  salvar: boolean;
}

interface Erros {
  lista: null | unknown;
  emFoco: null | unknown;
  excluir: null | unknown;
  salvar: null | unknown;
}

interface Estado {
  lista: Lista;
  emFoco: PortfolioTagDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: Erros;
}

export const useProjetoEtiquetasStore = defineStore('projetoEtiquetasStore', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
      excluir: false,
      salvar: false,
    },
    erro: {
      lista: null,
      emFoco: null,
      excluir: null,
      salvar: null,
    },
  }),
  actions: {
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erro.emFoco = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/portfolio-tag/${id}`, params);
        this.emFoco = resposta as PortfolioTagDto;
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },

    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro.lista = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/portfolio-tag`, params) as ListPortfolioTagDto;
        this.lista = resposta.linhas;
      } catch (erro: unknown) {
        this.erro.lista = erro;
      } finally {
        this.chamadasPendentes.lista = false;
      }
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.excluir = true;
      this.erro.excluir = null;

      try {
        await this.requestS.delete(`${baseUrl}/portfolio-tag/${id}`);
        return true;
      } catch (erro: unknown) {
        this.erro.excluir = erro;
        return false;
      } finally {
        this.chamadasPendentes.excluir = false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.salvar = true;
      this.erro.salvar = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/portfolio-tag/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/portfolio-tag`, params);
        }

        return true;
      } catch (erro: unknown) {
        this.erro.salvar = erro;
        return false;
      } finally {
        this.chamadasPendentes.salvar = false;
      }
    },
  },
  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      portfolio_id: emFoco?.portfolio?.id || null,
    }),
  },
});
