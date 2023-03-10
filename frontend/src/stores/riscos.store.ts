/* eslint-disable import/no-extraneous-dependencies */
import { ListProjetoRiscoDto, ProjetoRiscoDetailDto } from '@/../../backend/src/pp/risco/entities/risco.entity';
import filtrarObjetos from '@/helpers/filtrarObjetos';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListProjetoRiscoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: ProjetoRiscoDetailDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

export const useRiscosStore = defineStore('riscos', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: true,
      emFoco: true,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(id = 0, params = {}, projetoId = 0): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco/${id}`, params);
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
        const { linhas } = await this.requestS.get(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco`, params);

        this.lista = linhas.length
          ? linhas
          : [{
            id: 0,
            codigo: 0,
            numero: 0,
            criado_em: "2023-03-10T18:07:45.159Z",
            descricao: "string",
            causa: "string",
            consequencia: "string",
            probabilidade: 0,
            impacto: 0,
            nivel: 0,
            grau: 0,
            resposta: "string"
          }, {
            id: 1,
            codigo: 0,
            numero: 0,
            criado_em: "2023-03-10T18:07:45.159Z",
            descricao: "string",
            causa: "string",
            consequencia: "string",
            probabilidade: 0,
            impacto: 0,
            nivel: 0,
            grau: 2,
            resposta: "string"
          }];
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: Number, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0, projetoId = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco/${id}`, params);
        } else {
          resposta = await this.requestS.post(`${baseUrl}/projeto/${projetoId || this.route.params.projetoId}/risco`, params);
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
    itemParaEdição: ({ emFoco, route }) => ({
      ...emFoco,
      projeto_id: emFoco?.projeto_id || route.params.projetoId,
    }),

    // eslint-disable-next-line max-len
    listaFiltradaPor: ({ lista }: Estado) => (termo: string | number) => filtrarObjetos(lista, termo),
  },
});
