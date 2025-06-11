import type {
  ClassificacaoDto,
} from '@back/transferencias-voluntarias/classificacao/entities/classificacao.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}/classificacao`;

interface Estado {
  lista: ClassificacaoDto[];
  erro: null | unknown;
}

type ClassificacaoDados = {
  nome: string;
  transferencia_tipo_id: number;
};

export const useClassificacaoStore = defineStore('classificacao', {
  state: (): Estado => ({
    erro: null,
    lista: [],
  }),
  actions: {
    async buscarTudo(): Promise<void> {
      try {
        const resposta = await this.requestS.get(`${baseUrl}`);
        this.lista = resposta.linhas;
      } catch (err) {
        this.erro = err;
        console.error('Erro Erro ao tentar buscar classificação', err);
      }
    },
    async buscarItem(classificacaoId: string): Promise<ClassificacaoDto> {
      try {
        const resposta = await this.requestS.get(`${baseUrl}/${classificacaoId}`);

        return resposta;
      } catch (err) {
        this.erro = err;

        throw err;
      }
    },
    async salvarItem({ nome, transferencia_tipo_id }: ClassificacaoDados) {
      try {
        await this.requestS.post(`${baseUrl}`, {
          nome,
          transferencia_tipo_id,
        });
      } catch (err) {
        this.erro = err;
        console.error('Erro ao tentar inserir classificação', err);
      }
    },
    async atualizarItem(
      id: string,
      { nome, transferencia_tipo_id }: ClassificacaoDados,
    ) {
      try {
        await this.requestS.patch(`${baseUrl}/${id}`, {
          id: Number(id),
          nome,
          transferencia_tipo_id,
        });
      } catch (err) {
        this.erro = err;
        console.error('Erro ao tentar atualizar classificação', err);
      }
    },
    async deletarItem(id: string): Promise<boolean> {
      try {
        await this.requestS.delete(`${baseUrl}/${id}`);
        return true;
      } catch (err) {
        this.erro = err;
        console.error('Erro ao tentar deletar classificação', err);
        return false;
      }
    },
  },
});
