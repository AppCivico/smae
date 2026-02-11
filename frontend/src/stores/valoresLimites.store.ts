import type { CreateDemandaConfigDto } from '@back/casa-civil/demanda-config/dto/create-demanda-config.dto';
import type { DemandaConfigDto, ListDemandaConfigDto } from '@back/casa-civil/demanda-config/entities/demanda-config.entity';
import { defineStore } from 'pinia';

interface RecordWithId {
  id: number;
}

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListDemandaConfigDto['linhas'];

interface Estado {
  lista: Lista;
  emFoco: DemandaConfigDto | null;
  ativo: DemandaConfigDto | null;
  chamadasPendentes: ChamadasPendentes & { ativo: boolean };
  erro: Erros & { ativo: unknown };
}

export const useValoresLimitesStore = defineStore('valoresLimites', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    ativo: null,
    chamadasPendentes: {
      lista: false,
      emFoco: false,
      ativo: false,
    },
    erro: {
      lista: null,
      emFoco: null,
      ativo: null,
    },
  }),

  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;

      try {
        const { linhas } = await this.requestS.get(
          `${baseUrl}/demanda-config`,
          params,
        ) as ListDemandaConfigDto;

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
      } finally {
        this.chamadasPendentes.lista = false;
      }
    },

    async buscarItem(id: number): Promise<void> {
      this.chamadasPendentes.emFoco = true;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/demanda-config/${id}`,
        ) as DemandaConfigDto;

        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },

    async buscarAtivo(): Promise<void> {
      this.chamadasPendentes.ativo = true;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/demanda-config/ativo`,
        ) as DemandaConfigDto;

        this.ativo = resposta;
      } catch (erro: unknown) {
        this.erro.ativo = erro;
      } finally {
        this.chamadasPendentes.ativo = false;
      }
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/demanda-config/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro.lista = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(
      params: Partial<CreateDemandaConfigDto>,
      id = 0,
    ): Promise<RecordWithId | boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(
            `${baseUrl}/demanda-config/${id}`,
            params,
          ) as RecordWithId;
        } else {
          resposta = await this.requestS.post(
            `${baseUrl}/demanda-config`,
            params,
          ) as RecordWithId;
        }

        this.chamadasPendentes.emFoco = false;
        this.erro.emFoco = null;
        return resposta;
      } catch (erro) {
        this.erro.emFoco = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },

  getters: {
    itemPorId: ({ lista }) => lista.reduce((acc, item) => {
      if (item.id) {
        acc[item.id] = item;
      }
      return acc;
    }, {} as Record<number, DemandaConfigDto>),
  },
});
