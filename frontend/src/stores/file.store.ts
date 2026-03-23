import type { Upload } from '@back/upload/entities/upload.entity';
import { defineStore } from 'pinia';

const baseUrl = import.meta.env.VITE_API_URL;

type OpcoesArquivo = {
  tipo_id: number;
  descricao: string;
};

export type NovoArquivo = {
  token: string;
  nomeOriginal: string;
  descricao: string | null;
};

interface Estado {
  arquivo: File | null;
  erro: any | null;
  carregando: boolean;
}

export const useFileStore = defineStore('FileStore', {
  state: (): Estado => ({
    arquivo: null,
    erro: null,
    carregando: false,
  }),
  actions: {
    async upload(opcoes: OpcoesArquivo, file: File): Promise<NovoArquivo> {
      if (!file) {
        throw new Error('Erro ao receber arquivo');
      }

      this.carregando = true;

      const formData = new FormData();
      formData.append('tipo', 'DOCUMENTO');
      formData.append('tipo_documento_id', opcoes.tipo_id.toString());
      formData.append('descricao', opcoes.descricao);
      formData.append('arquivo', file);

      try {
        const arquivoAtualizado = (await this.requestS.upload(
          `${baseUrl}/upload`,
          formData,
        )) as unknown as Upload;

        return {
          token: arquivoAtualizado.upload_token,
          nomeOriginal: file.name,
          descricao: opcoes.descricao,
        };
      } catch (e) {
        this.erro = e;
        throw e;
      } finally {
        this.carregando = false;
      }
    },
  },
});
