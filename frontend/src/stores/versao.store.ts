import type { VersaoDto } from '@back/versao/dto/versao.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

interface Estado {
  versao: VersaoDto | null;
  chamadasPendentes: { versao: boolean };
  erro: null | unknown;
}

export const useVersaoStore = defineStore('versao', {
  state: (): Estado => ({
    versao: null,
    chamadasPendentes: { versao: false },
    erro: null,
  }),
  actions: {
    async buscar(): Promise<void> {
      if (this.versao || this.chamadasPendentes.versao) {
        return;
      }

      this.chamadasPendentes.versao = true;
      this.erro = null;
      try {
        this.versao = await this.requestS.get(`${baseUrl}/versao`) as VersaoDto;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.versao = false;
    },
  },
});
