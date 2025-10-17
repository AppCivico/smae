import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface TipoVinculoDto {
  id: number;
  nome: string;
}

interface ListTipoVinculoDto {
  linhas: TipoVinculoDto[];
}

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  excluir: boolean;
}

interface Erro {
  lista: null | unknown;
  emFoco: null | unknown;
  excluir: null | unknown;
}

interface Estado {
  lista: TipoVinculoDto[];
  emFoco: TipoVinculoDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: Erro;
}

export const useTipoDeVinculoStore = defineStore('tipoDeVinculo', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    chamadasPendentes: {
      lista: false,
      emFoco: false,
      excluir: false,
    },
    erro: {
      lista: null,
      emFoco: null,
      excluir: null,
    },
  }),
  actions: {
    async buscarItem(tipoVinculoId: number): Promise<void> {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        const item = await this.requestS.get(`${baseUrl}/tipo-vinculo/${tipoVinculoId}`) as TipoVinculoDto;
        this.emFoco = item;
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
    async buscarTudo(params = {}): Promise<void> {
      try {
        this.chamadasPendentes.lista = true;
        this.erro.lista = null;

        const resposta = await this.requestS.get(`${baseUrl}/tipo-vinculo`, params) as ListTipoVinculoDto;
        this.lista = resposta.linhas;
      } catch (erro: unknown) {
        this.erro.lista = erro;
      } finally {
        this.chamadasPendentes.lista = false;
      }
    },
    async excluirItem(id: number) {
      try {
        this.chamadasPendentes.excluir = true;
        this.erro.excluir = null;

        await this.requestS.delete(`${baseUrl}/tipo-vinculo/${id}`);
      } catch (erro: unknown) {
        this.erro.excluir = erro;
      } finally {
        this.chamadasPendentes.excluir = false;
      }
    },
    async salvarItem(params = {}, id = 0) {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        if (id) {
          await this.requestS.patch(`${baseUrl}/tipo-vinculo/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/tipo-vinculo`, params);
        }
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
  },
});
