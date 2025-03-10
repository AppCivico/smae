import type { RecordWithId } from '@back/common/dto/record-with-id.dto';
import type { CreateTipoDocumentoDto } from '@back/tipo-documento/dto/create-tipo-documento.dto';
import type { ListTipoDocumentoDto } from '@back/tipo-documento/dto/list-tipo-documento.dto';
import type { TipoDocumentoDto } from '@back/tipo-documento/entities/tipo-documento.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListTipoDocumentoDto['linhas'];

interface ChamadasPendentes {
  lista: boolean;
  emFoco: boolean;
}

interface Estado {
  lista: Lista;
  emFoco: CreateTipoDocumentoDto | null;
  chamadasPendentes: ChamadasPendentes;

  erro: null | unknown;
}

export const useTiposDeDocumentosStore = defineStore('tiposDeDocumentos', {
  state: (): Estado => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async buscarTudo(params = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}/tipo-documento`, params) as ListTipoDocumentoDto;

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/tipo-documento/${id}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<RecordWithId | boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        let resposta;

        if (id) {
          resposta = await this.requestS.patch(`${baseUrl}/tipo-documento/${id}`, params) as RecordWithId;
        } else {
          resposta = await this.requestS.post(`${baseUrl}/tipo-documento`, params) as RecordWithId;
        }

        this.chamadasPendentes.emFoco = false;
        this.erro = null;
        return resposta;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    tiposPorId: ({ lista }) => lista
      .reduce((acc, item) => {
        if (item.id) {
          acc[item.id] = item;
        }
        return acc;
      }, {} as Record<number, TipoDocumentoDto>),
  },
});
