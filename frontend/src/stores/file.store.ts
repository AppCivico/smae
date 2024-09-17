// eslint-disable-next-line import/no-extraneous-dependencies
import { defineStore } from 'pinia';

import { Upload } from '@/../../backend/src/upload/entities/upload.entity.ts';

const baseUrl = import.meta.env.VITE_API_URL;

type OpcoesArquivo = {
  tipo_id: number;
  descricao: string;
};

export type NovoArquivo = {
  token: string;
  nomeOriginal: string;
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
    async upload(opcoes: OpcoesArquivo, ev: Event): Promise<NovoArquivo> {
      const target = ev.target as HTMLInputElement;

      if (!target.files) {
        throw new Error('Erro ao receber arquivo');
      }

      this.carregando = true;

      const [file] = target.files;

      const formData = new FormData();
      formData.append('tipo', 'DOCUMENTO');
      formData.append('tipo_documento_id', opcoes.tipo_id.toString());
      formData.append('descricao', opcoes.descricao);
      formData.append('arquivo', file);

      try {
        const arquivoAtualizado: Upload = await this.requestS.upload(
          `${baseUrl}/upload`,
          formData,
        );

        return {
          token: arquivoAtualizado.upload_token,
          nomeOriginal: file.name,
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
