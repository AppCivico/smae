import dateToDate from '@/helpers/dateToDate';
import { defineStore } from 'pinia';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ListImportacaoOrcamentoDto } from '@/../../backend/src/importacao-orcamento/entities/importacao-orcamento.entity';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListImportacaoOrcamentoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  envio: boolean;
}

interface Estado {
  lista: Lista;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
  paginação: {
    temMais: Boolean;
    tokenDaPróximaPágina: String;
  };
}

export const useImportaçõesStore = defineStore('importações', {
  state: (): Estado => ({
    lista: [],

    chamadasPendentes: {
      lista: false,
      envio: false,
    },

    paginação: {
      temMais: false,
      tokenDaPróximaPágina: 'String',
    },

    erro: null,
  }),

  actions: {
    async buscarTudo(params: { token_proxima_pagina?: String } = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      try {
        const {
          linhas,
          tem_mais: temMais,
          token_proxima_pagina: tokenDaPróximaPágina,
        } = await this.requestS.get(`${baseUrl}/importacao-orcamento`, { ...params, ipp: 5 });

        if (Array.isArray(linhas)) {
          this.lista = params.token_proxima_pagina
            ? this.lista.concat(linhas)
            : linhas;

          this.paginação.temMais = temMais || false;
          this.paginação.tokenDaPróximaPágina = tokenDaPróximaPágina || '';
        }
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },
  },

  getters: {
    listaPreparada: ({ lista }) => lista.map((x) => ({
      ...x,
      arquivo: {
        href: `${baseUrl}/download/${x.arquivo.token}`,
        texto: x.arquivo.nome_original,
      },
      saida_arquivo: x.saida_arquivo
        ? {
          href: `${baseUrl}/download/${x.saida_arquivo.token}`,
          texto: x.saida_arquivo.nome_original,
        }
        : null,
      status: x.saida_arquivo
        ? `${x.linhas_importadas}/${(x.linhas_importadas ?? 0) + (x.linhas_recusadas ?? 0)} linhas importadas`
        : x.processado_errmsg || 'em processamento',

      criado_por: `${x.criado_por.nome_exibicao}`,
      criado_em: `${dateToDate(x.criado_em)}`,
    })) || [],

  },
});
