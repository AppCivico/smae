/* eslint-disable import/no-extraneous-dependencies */
import type {
  FilterNotaComunicadoDto,
  NotaComunicadoItemDto,
} from '@/../../backend/src/bloco-nota/nota/dto/comunicados.dto';

import type { PaginatedDto } from '@/../../backend/src/common/dto/paginated.dto';

import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}/nota-comunicados`;

interface Estado {
  dados: NotaComunicadoItemDto[];
  temMais: boolean;
  tokenProximaPagina: string | null;
  erro: null | unknown;
}

export const useComunicadosGeraisStore = defineStore('comunicadosGerais', {
  state: (): Estado => ({
    erro: null,
    temMais: false,
    dados: [],
    tokenProximaPagina: null,
  }),
  actions: {
    async getComunicadosGerais({
      data_inicio,
      data_fim,
      palavra_chave,
    }: FilterNotaComunicadoDto) {
      try {
        this.dados = [];

        const resposta: PaginatedDto<NotaComunicadoItemDto> = await this.requestS.get(`${baseUrl}`, {
          data_inicio,
          data_fim,
          palavra_chave,
        });

        this.temMais = resposta.tem_mais;
        this.dados = resposta.linhas;
        this.tokenProximaPagina = resposta.token_proxima_pagina;
      } catch (err) {
        console.error('Erro ao tentar buscar docuumentos gerais', err);
      }
    },
    async mudarLido(id: number, lido: boolean) {
      await this.requestS.patch(`${baseUrl}/${id}/lido`, {
        lido,
      });
    },
  },
  getters: {
    comunicadosGerais(state): NotaComunicadoItemDto[] {
      return state.dados;
    },
  },
});
