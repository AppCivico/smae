import { ref } from 'vue';
import { TipoUpload } from '@back/upload/entities/tipo-upload';
import requestS from '@/helpers/requestS';
import { useAuthStore } from '@/stores/auth.store';

const baseUrl = import.meta.env.VITE_API_URL;

interface UploadResponse {
  upload_token: string;
}

export function useUpload() {
  const carregando = ref(false);
  const erro = ref<unknown>(null);

  async function uploadArquivo(file: File, tipo: TipoUpload): Promise<string> {
    const authStore = useAuthStore();
    const tamanhoMaximo = authStore.user?.max_upload_size;

    if (tamanhoMaximo !== null && tamanhoMaximo !== undefined && file.size > tamanhoMaximo) {
      const limite = `${(tamanhoMaximo / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} MB`;
      const erroTamanho = new Error(`O arquivo excede o tamanho máximo permitido de ${limite}.`);
      erro.value = erroTamanho;
      throw erroTamanho;
    }

    try {
      carregando.value = true;
      erro.value = null;

      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('arquivo', file);

      const resposta = await requestS.upload(
        `${baseUrl}/upload`,
        formData,
      ) as UploadResponse;

      return resposta.upload_token;
    } catch (e) {
      erro.value = e;
      throw e;
    } finally {
      carregando.value = false;
    }
  }

  function obterUrlDownload(downloadToken: string): string {
    return `${baseUrl}/download/${downloadToken}`;
  }

  return {
    carregando,
    erro,
    uploadArquivo,
    obterUrlDownload,
  };
}
