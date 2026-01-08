import { defineStore } from 'pinia';

// eslint-disable-next-line import/extensions
import { ListTipoEncerramentoDto, TipoEncerramentoDto } from '@back/projeto-tipo-encerramento/dto/tipo-encerramento.dto';

import { useAuthStore } from './auth.store';

interface Estado {
  lista: TipoEncerramentoDto[];
  emFoco: TipoEncerramentoDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: Erros;
}

function obterRota() {
  const { sistemaEscolhido } = useAuthStore();

  switch (sistemaEscolhido) {
    case 'Projetos':
      return `${import.meta.env.VITE_API_URL}/projeto-tipo-encerramento`;

    case 'MDO':
      return `${import.meta.env.VITE_API_URL}/obra-tipo-encerramento`;

    default:
      throw new Error('Módulo não habilitado');
  }
}

export const useTipoEncerramentoStore = (sistemaEscolhido: string) => defineStore(`${sistemaEscolhido}.tipoEncerramento`, {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: {
      lista: null,
      emFoco: null,
    },
  }),
  actions: {
    async buscarItem(tipoEncerramentoId: number): Promise<void> {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        const resposta = (await this.requestS.get(
          `${obterRota()}/${tipoEncerramentoId}`,
        )) as TipoEncerramentoDto;

        this.emFoco = resposta;
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

        const resposta = (await this.requestS.get(
          obterRota(),
          params,
        )) as ListTipoEncerramentoDto;
        this.lista = resposta.linhas;
      } catch (erro: unknown) {
        this.erro.lista = erro;
      } finally {
        this.chamadasPendentes.lista = false;
      }
    },

    async excluirItem(id: number) {
      await this.requestS.delete(`${obterRota()}/${id}`);
    },

    async salvarItem(params = {}, id = 0) {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        if (id) {
          await this.requestS.patch(`${obterRota()}/${id}`, params);
        } else {
          await this.requestS.post(obterRota(), params);
        }
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
  },
})();
