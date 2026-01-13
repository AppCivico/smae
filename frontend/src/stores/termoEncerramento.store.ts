import { defineStore } from 'pinia';

// eslint-disable-next-line import/extensions
import { TermoEncerramentoDetalheDto } from '@back/pp/termo-encerramento/dto/termo-encerramento.dto.ts';

import { ModuloSistema } from '@/consts/modulosDoSistema';

interface ChamadasPendentes {
  emFoco: boolean;
}

interface Erros {
  emFoco: unknown;
}

interface Estado {
  emFoco: TermoEncerramentoDetalheDto | null;
  chamadasPendentes: ChamadasPendentes;
  erro: Erros;
}

function obterRota(
  sistemaEscolhido: ModuloSistema.MDO | ModuloSistema.Projetos,
) {
  switch (sistemaEscolhido) {
    case ModuloSistema.Projetos:
      return `${import.meta.env.VITE_API_URL}/projeto`;

    case ModuloSistema.MDO:
      return `${import.meta.env.VITE_API_URL}/projeto`;

    default:
      throw new Error('Módulo não habilitado');
  }
}

export const useTermoEncerramentoStore = (sistemaEscolhido: ModuloSistema.MDO | ModuloSistema.Projetos) => defineStore(`${sistemaEscolhido}.termoEncerramento`, {
  state: (): Estado => ({
    emFoco: null,
    chamadasPendentes: {
      emFoco: false,
    },
    erro: {
      emFoco: null,
    },
  }),
  actions: {
    async buscarItem(termoEncerramentoId: number): Promise<void> {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        const resposta = (await this.requestS.get(
          `${obterRota(
            sistemaEscolhido,
          )}/${termoEncerramentoId}/termo-encerramento`,
        )) as TermoEncerramentoDetalheDto;

        this.emFoco = resposta;
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },

    async excluirItem(id: number) {
      await this.requestS.delete(`${obterRota(sistemaEscolhido)}/${id}/termo-encerramento`);
    },

    async salvarItem(params: any = {}, id = 0) {
      try {
        this.chamadasPendentes.emFoco = true;
        this.erro.emFoco = null;

        const requestParams = { ...params };

        if (requestParams.icone) {
          requestParams.sobrescrever_icone = true;
          requestParams.icone_upload_token = requestParams.icone || undefined;

          delete requestParams.icone;
        }

        await this.requestS.patch(`${obterRota(sistemaEscolhido)}/${id}/termo-encerramento`, requestParams);
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },

    async uploadIcone(file: File): Promise<string> {
      try {
        const formData = new FormData();
        formData.append('tipo', 'ICONE_PORTFOLIO');
        formData.append('arquivo', file);

        const resposta = (await this.requestS.upload(
          `${import.meta.env.VITE_API_URL}/upload`,
          formData,
        )) as { upload_token: string };

        return resposta.upload_token;
      } catch (erro: unknown) {
        this.erro.emFoco = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.emFoco = false;
      }
    },
  },
  getters: {
    itemParaEdicao({ emFoco }) {
      return {
        ...emFoco,
        icone: emFoco?.icone && `${import.meta.env.VITE_API_URL}/download/${emFoco.icone.download_token}`,
      };
    },
  },
})();
