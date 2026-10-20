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
  getters: {
    // "2026-10-08" -> "out/26"
    mesAnoDaVersao: ({ versao }): string => {
      if (!versao?.data) {
        return '';
      }

      const mes = new Date(`${versao.data}T12:00:00`)
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '');

      return `${mes}/${versao.data.slice(2, 4)}`;
    },
  },
});
