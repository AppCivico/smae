import type {
  ListPortfolioDto,
  PortfolioDto,
  PortfolioOneDto,
} from '@back/pp/portfolio/entities/portfolio.entity';
import { range } from 'lodash';
import { defineStore } from 'pinia';
import dateTimeToDate from '@/helpers/dateTimeToDate';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPortfolioDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: PortfolioOneDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

export const usePortfolioStore = defineStore('portfolios', {
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
    async buscarItem(id = 0, params = {}): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/portfolio/${id}`,
          params,
        );
        this.emFoco = {
          ...resposta,
        };
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, paraProjetos = true): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      // TO-DO: Revisar o uso desse chaveamento. Parece que salvar em duas listas
      // diferentes seria mais seguro.
      const rotaNaApi = paraProjetos
        ? '/portfolio/para-projetos'
        : '/portfolio';

      try {
        const { linhas } = await this.requestS.get(
          `${baseUrl}${rotaNaApi}`,
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
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/portfolio/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params: Record<string, unknown> = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const requestParams = { ...params };

        if (requestParams.icone_impressao || requestParams.icone_impressao === null) {
          requestParams.icone_upload_token = requestParams.icone_impressao;
          delete requestParams.icone_impressao;
        }

        if (id) {
          await this.requestS.patch(`${baseUrl}/portfolio/${id}`, requestParams);
        } else {
          await this.requestS.post(`${baseUrl}/portfolio`, requestParams);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async uploadIcone(file: File): Promise<string> {
      try {
        this.chamadasPendentes.emFoco = true;

        const formData = new FormData();
        formData.append('tipo', 'ICONE_PORTFOLIO');
        formData.append('arquivo', file);

        const resposta = (await this.requestS.upload(
          `${baseUrl}/upload`,
          formData,
        )) as { upload_token: string };

        return resposta.upload_token;
      } catch (erro: unknown) {
        this.erro = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
  },

  getters: {
    itemParaEdicao: ({ emFoco }) => ({
      ...emFoco,
      nivel_maximo_tarefa: emFoco?.nivel_maximo_tarefa || 5,
      nivel_regionalizacao: emFoco?.nivel_regionalizacao || 1,
      data_criacao: emFoco?.data_criacao
        ? dateTimeToDate(emFoco?.data_criacao)
        : null,
      orcamento_execucao_disponivel_meses:
        emFoco?.orcamento_execucao_disponivel_meses
        && Array.isArray(emFoco.orcamento_execucao_disponivel_meses)
          ? emFoco.orcamento_execucao_disponivel_meses
          : range(1, 13),
      icone_impressao: emFoco?.icone_impressao
        ? `${baseUrl}/download/${emFoco.icone_impressao.download_token}`
        : null,
    }),

    portfoliosPorId: ({
      lista,
    }: Estado): { [k: number | string]: PortfolioDto } => lista.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}),
  },
});
