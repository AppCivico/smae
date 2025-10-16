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
}

interface Estado {
  lista: TipoVinculoDto[];
  emFoco: TipoVinculoDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
}

export const useTipoDeVinculoStore = defineStore('tipoDeVinculo', {
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
    async buscarItem(tipoVinculoId: number): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;
      try {
        const item = await this.requestS.get(`${baseUrl}/tipo-vinculo/${tipoVinculoId}`) as TipoVinculoDto;
        this.emFoco = item;
      } catch (erro: unknown) {
        this.erro = erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        const resposta = await this.requestS.get(`${baseUrl}/tipo-vinculo`, params) as ListTipoVinculoDto;
        this.lista = resposta.linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erro = null;
      try {
        await this.requestS.delete(`${baseUrl}/tipo-vinculo/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro: unknown) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;
      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/tipo-vinculo/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/tipo-vinculo`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro: unknown) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
});
