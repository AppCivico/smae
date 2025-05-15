import dateTimeToDate from '@/helpers/dateTimeToDate';
import type { CreatePlanoAcaoDto } from '@back/pp/plano-de-acao/dto/create-plano-acao.dto';
import type { ListPlanoAcaoDto, PlanoAcao } from '@back/pp/plano-de-acao/entities/plano-acao.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListPlanoAcaoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: PlanoAcao | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

export const usePlanosDeAçãoStore = defineStore('planosDeAção', {
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
    async buscarItem(id = 0, params = {}, projetoId = 0): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/plano-de-acao/${id}`, params);
        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}, projetoId = 0): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/plano-de-acao`, params);

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: number, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/plano-de-acao/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params: CreatePlanoAcaoDto, id = 0, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      const parâmetrosNormalizados = { ...params };

      if (!params.projeto_risco_id) {
        parâmetrosNormalizados.projeto_risco_id = Number(this.route.params.projetoId);
      }

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/plano-de-acao/${id}`, parâmetrosNormalizados);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/plano-de-acao`, parâmetrosNormalizados);
        }

        this.chamadasPendentes.emFoco = false;
        this.erro = null;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    itemParaEdicao: ({ emFoco, route }) => ({
      ...emFoco,
      custo: emFoco?.custo || null,
      custo_percentual: emFoco?.custo_percentual || null,
      orgao_id: emFoco?.orgao?.id || 0,
      prazo_contramedida: emFoco?.prazo_contramedida
        ? dateTimeToDate(emFoco.prazo_contramedida)
        : null,
      data_termino: emFoco?.data_termino
        ? dateTimeToDate(emFoco.data_termino)
        : null,
      projeto_risco_id: Number(route?.params?.riscoId),
    }),
  },
});
