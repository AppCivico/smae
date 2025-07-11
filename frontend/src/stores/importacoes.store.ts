import dateToDate from '@/helpers/dateToDate';
import type { PaginatedDto } from '@back/common/dto/paginated.dto';
import type { RecordWithId } from '@back/common/dto/record-with-id.dto';
import type { ImportacaoOrcamentoDto, ListImportacaoOrcamentoDto } from '@back/importacao-orcamento/entities/importacao-orcamento.entity';
import type { PortfolioDto } from '@back/pp/portfolio/entities/portfolio.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListImportacaoOrcamentoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  portfoliosPermitidos: boolean;
  arquivos: boolean;
}

interface Estado {
  lista: Lista;
  portfoliosPermitidos: PortfolioDto[];
  chamadasPendentes: ChamadasPendentes;
  erros: {
    lista: null | unknown;
    portfoliosPermitidos: null | unknown;
    arquivos: null | unknown
  };
  paginação: {
    temMais: boolean;
    tokenDaPróximaPágina: string;
  };
}

export const useImportaçõesStore = defineStore('importações', {
  state: (): Estado => ({
    lista: [],
    portfoliosPermitidos: [],

    chamadasPendentes: {
      lista: false,
      portfoliosPermitidos: false,
      arquivos: false,
    },

    paginação: {
      temMais: false,
      tokenDaPróximaPágina: '',
    },

    erros: {
      lista: null,
      portfoliosPermitidos: null,
      arquivos: null,
    },
  }),

  actions: {
    async buscarTudo(params: { token_proxima_pagina?: string } = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        const {
          linhas,
          tem_mais: temMais,
          token_proxima_pagina: tokenDaPróximaPágina,
        } = await this.requestS.get(`${baseUrl}/importacao-orcamento`, params) as PaginatedDto<ImportacaoOrcamentoDto>;

        if (Array.isArray(linhas)) {
          this.lista = params.token_proxima_pagina
            ? this.lista.concat(linhas)
            : linhas;

          this.paginação.temMais = temMais || false;
          this.paginação.tokenDaPróximaPágina = tokenDaPróximaPágina || '';
        }
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async buscarPortfolios(params = {}): Promise<void> {
      this.chamadasPendentes.portfoliosPermitidos = true;
      this.erros.portfoliosPermitidos = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/importacao-orcamento/portfolio`, params);
        if (Array.isArray(resposta)) {
          this.portfoliosPermitidos = resposta;
        } else {
          throw new Error('Resposta fora do padrão esperado');
        }
      } catch (erro: unknown) {
        this.erros.portfoliosPermitidos = erro;
      }
      this.chamadasPendentes.portfoliosPermitidos = false;
    },

    async associarArquivo(params = {}): Promise<boolean | RecordWithId> {
      this.chamadasPendentes.arquivos = true;
      this.erros.arquivos = null;

      try {
        const resposta = await this.requestS.post(`${baseUrl}/importacao-orcamento/`, params) as RecordWithId;
        this.chamadasPendentes.arquivos = false;
        return resposta;
      } catch (erro) {
        this.erros.arquivos = erro;
        this.chamadasPendentes.arquivos = false;
        return false;
      }
    },
  },

  getters: {
    listaPreparada: ({ lista }) => lista.map((x) => ({
      ...x,
      arquivo: {
        href: `${baseUrl}/download/${x.arquivo.token}`,
        texto: x.arquivo.nome_original,
        download: true,
      },
      saida_arquivo: x.saida_arquivo
        ? {
          href: `${baseUrl}/download/${x.saida_arquivo.token}`,
          texto: x.saida_arquivo.nome_original,
          download: true,
        }
        : null,
      status: x.saida_arquivo
        ? `${x.linhas_importadas}/${(x.linhas_importadas ?? 0) + (x.linhas_recusadas ?? 0)} linhas importadas`
        : x.processado_errmsg || 'em processamento',
      nome_do_portfolio: x.portfolio?.titulo
        ? x.portfolio.titulo
        : null,
      criado_por: `${x.criado_por.nome_exibicao}`,
      criado_em: `${dateToDate(x.criado_em)}`,
    })) || [],
  },
});
