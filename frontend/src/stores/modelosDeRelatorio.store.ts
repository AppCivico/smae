import { defineStore } from 'pinia';

import { ModuloSistema } from '@/consts/modulosDoSistema';

import type { CreateRelatorioModeloDto } from '@back/reports/relatorio-modelo/dto/create-relatorio-modelo.dto';
import type {
  ListRelatorioColunasDto,
  ListRelatorioFontesDto,
  ListRelatorioModeloDto,
  RelatorioArquivoColunasDto,
  RelatorioModeloDetailDto,
  RelatorioModeloItemDto,
} from '@back/reports/relatorio-modelo/entities/relatorio-modelo.entity';

export type Fonte = CreateRelatorioModeloDto['fonte'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
  colunas: boolean;
}

interface Erros {
  lista: unknown;
  emFoco: unknown;
  colunas: unknown;
}

interface Estado {
  lista: RelatorioModeloItemDto[];
  emFoco: RelatorioModeloDetailDto | null;
  // Chaveado por fonte: o formulário de criação deixa a fonte a cargo do usuário (um select), e
  // várias fontes podem ter suas colunas já carregadas ao mesmo tempo nessa mesma store.
  colunas: Partial<Record<Fonte, ListRelatorioColunasDto>>;
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
}

const baseUrl = `${import.meta.env.VITE_API_URL}`;

// Namespace por sistema (mesma chave de `route.meta.entidadeMãe` usada em
// termoEncerramento.store.ts): é conhecida antes da tela montar, ao contrário de `fonte`, que
// só é definida dentro do formulário — por isso `fonte` não pode ser a chave de instanciação.
export const useModelosDeRelatorioStore = (
  sistemaEscolhido: ModuloSistema,
) => defineStore(`${sistemaEscolhido}.modelosDeRelatorio`, {
  state: (): Estado => ({
    lista: [],
    emFoco: null,
    colunas: {},

    chamadasPendentes: {
      lista: false,
      emFoco: false,
      colunas: false,
    },
    erros: {
      lista: null,
      emFoco: null,
      colunas: null,
    },
  }),

  actions: {
    async buscarTudo(params: Record<string, unknown> = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        const resposta = (await this.requestS.get(
          `${baseUrl}/relatorio-modelo`,
          params,
        )) as ListRelatorioModeloDto;

        this.lista = resposta.linhas || [];
      } catch (error_) {
        this.erros.lista = error_;
      }
      this.chamadasPendentes.lista = false;
    },

    async buscarItem(id = 0): Promise<void> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;
      this.emFoco = null;

      try {
        this.emFoco = (await this.requestS.get(
          `${baseUrl}/relatorio-modelo/${id}`,
        )) as RelatorioModeloDetailDto;
      } catch (error_) {
        this.erros.emFoco = error_;
      }
      this.chamadasPendentes.emFoco = false;
    },

    // Fontes que aceitam modelo no sistema da requisição, já com as colunas de cada uma — uma
    // chamada só, sem precisar saber a fonte de antemão (o formulário é quem deixa isso a cargo
    // do usuário). Popula `colunas` para todas de uma vez.
    async buscarFontes(params: Record<string, unknown> = {}): Promise<void> {
      this.chamadasPendentes.colunas = true;
      this.erros.colunas = null;

      try {
        const resposta = (await this.requestS.get(
          `${baseUrl}/relatorio-modelo/fontes`,
          params,
        )) as ListRelatorioFontesDto;

        (resposta.linhas || []).forEach((linha) => {
          this.colunas[linha.fonte] = linha;
        });
      } catch (error_) {
        this.erros.colunas = error_;
      }
      this.chamadasPendentes.colunas = false;
    },

    async salvarItem(
      params: Record<string, unknown> = {},
      id = 0,
    ): Promise<unknown> {
      this.chamadasPendentes.emFoco = true;
      this.erros.emFoco = null;

      try {
        let resposta;
        if (id) {
          resposta = (await this.requestS.patch(
            `${baseUrl}/relatorio-modelo/${id}`,
            params,
          )) as RecordWithId;
        } else {
          resposta = (await this.requestS.post(
            `${baseUrl}/relatorio-modelo`,
            params,
          )) as RecordWithId;
        }

        this.chamadasPendentes.emFoco = false;
        return resposta || true;
      } catch (error_) {
        this.erros.emFoco = error_;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        await this.requestS.delete(`${baseUrl}/relatorio-modelo/${id}`);

        this.lista = this.lista.filter((item) => item.id !== id);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (error_) {
        this.erros.lista = error_;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },
  },

  getters: {
    // Indexa `colunas[fonte].arquivos` por nome do arquivo, para lookup O(1) em vez de
    // `Array.find`. Fica em cache por fonte, invalidado só quando `colunas[fonte]` muda de
    // referência (novo fetch ou `$reset()`) — não pelo cache padrão do getter, que não se aplica
    // aqui porque o valor devolvido é uma função (a leitura de `state` acontece dentro dela, fora
    // do rastreamento de reatividade da computed).
    arquivosPorNome: (state) => {
      const cache: Partial<Record<Fonte, {
        origem: ListRelatorioColunasDto | undefined;
        porNome: Record<string, RelatorioArquivoColunasDto>;
      }>> = {};

      return (fonte: Fonte): Record<string, RelatorioArquivoColunasDto> => {
        const origem = state.colunas[fonte];
        const entrada = cache[fonte];

        if (entrada && entrada.origem === origem) {
          return entrada.porNome;
        }

        const porNome = (origem?.arquivos || []).reduce((acc, arquivo) => {
          acc[arquivo.arquivo] = arquivo;
          return acc;
        }, {} as Record<string, RelatorioArquivoColunasDto>);

        cache[fonte] = { origem, porNome };
        return porNome;
      };
    },
  },
})();
