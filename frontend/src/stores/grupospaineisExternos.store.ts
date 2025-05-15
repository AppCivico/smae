import type {
  GruposPaineisExternosItemDto,
  ListGruposPaineisExternosDto,
} from '@back/pp/grupo-paineis-externos/entities/grupo-painel-externo.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: ListGruposPaineisExternosDto['linhas'];
  emFoco: GruposPaineisExternosItemDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

export const useGruposPaineisExternos = defineStore('GruposPaineisExternos', {
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
        const resposta = await this.requestS.get(`${baseUrl}/grupo-painel-externo/`, { id, ...params });
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
        const { linhas } = await this.requestS.get(`${baseUrl}/grupo-painel-externo/`, params);
        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/grupo-painel-externo/${id}`);

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
          await this.requestS.patch(`${baseUrl}/grupo-painel-externo/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/grupo-painel-externo`, params);
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
      participantes: emFoco?.participantes && Array.isArray(emFoco.participantes)
        ? emFoco.participantes.map((x) => x.id)
        : [],
    }),
  },
});
