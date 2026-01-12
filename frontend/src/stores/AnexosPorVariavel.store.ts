import type {
  ListaDocumentosPorVariavelGlobalDto,
  VariavelDocumentosGlobalDto,
} from '@back/variavel/dto/variavel.ciclo.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = VariavelDocumentosGlobalDto[];

interface Estado {
  lista: Lista;
  chamadasPendentes: {
    lista: boolean;
  };
  erros: {
    lista: unknown;
  };
}

export const useAnexosPorVariavelStore = (prefixo = '') => defineStore(prefixo ? `${prefixo}.anexosPorVariavel` : 'anexosPorVariavel', {
  state: (): Estado => ({
    lista: [],
    chamadasPendentes: {
      lista: false,
    },
    erros: {
      lista: null,
    },
  }),
  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/plano-setorial-variavel-ciclo/documentos-por-variavel`,
          params,
        ) as ListaDocumentosPorVariavelGlobalDto;

        this.lista = resposta?.variaveis || [];
      } catch (erro: unknown) {
        this.erros.lista = erro;
      }

      this.chamadasPendentes.lista = false;
    },
  },
  getters: {
    listaConvertida: ({ lista }: Estado) => {
      const documentos: Documento[] = [];

      lista.forEach((variavel) => {
        variavel.documentos?.forEach((doc) => {
          documentos.push({
            id: doc.id,
            data: doc.referencia_data as unknown as Date,
            descricao: doc.descricao,
            arquivo: {
              id: doc.id,
              descricao: doc.descricao,
              tamanho_bytes: doc.tamanho_bytes,
              nome_original: doc.nome_original,
              download_token: doc.download_token,
              diretorio_caminho: doc.diretorio_caminho,
              preview: doc.preview ? {
                status: doc.preview.status,
                tipo: doc.preview.tipo,
                erro_mensagem: doc.preview.erro_mensagem,
                download_token: doc.preview.download_token,
                mime_type: doc.preview.mime_type,
                tamanho_bytes: doc.preview.tamanho_bytes,
                atualizado_em: doc.preview.atualizado_em || null,
              } : null,
            },
          });
        });
      });

      return documentos;
    },
  },
})();
