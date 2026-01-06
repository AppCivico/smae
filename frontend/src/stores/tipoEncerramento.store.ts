import { defineStore } from 'pinia';
import { useAuthStore } from './auth.store';

interface TipoEncerramentoDto {
  id: number;
  descricao: string;
  habilitar_info_adicional: boolean;
  [key: string]: unknown;
}

interface ListTipoEncerramentoDto {
  linhas: TipoEncerramentoDto[];
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
  lista: TipoEncerramentoDto[];
  emFoco: TipoEncerramentoDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: Erro;
}

function obterRota() {
  const { sistemaEscolhido } = useAuthStore();

  switch (sistemaEscolhido) {
    case 'Projetos':
      return `${import.meta.env.VITE_API_URL}/projeto-tipo-encerramento`;

    case 'Obras':
      return `${import.meta.env.VITE_API_URL}/obra-tipo-encerramento`;

    default:
      throw new Error('Módulo não habilitado');
  }
}

export const useTipoEncerramentoStore = defineStore('tipoEncerramento', {
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
    async buscarItem(tipoEncerramentoId: number): Promise<void> {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        if (this.lista.length === 0) {
          await this.buscarTudo();
        }

        const item = this.lista.find((x) => x.id === tipoEncerramentoId);
        this.emFoco = item || null;
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

        const resposta = await this.requestS.get(`${obterRota()}`, params) as ListTipoEncerramentoDto;
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

        await this.requestS.delete(`${obterRota()}/${id}`);
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
          await this.requestS.patch(`${obterRota()}/${id}`, params);
        } else {
          await this.requestS.post(`${obterRota()}`, params);
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
