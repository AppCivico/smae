import type { TipoVinculoDto } from '@back/casa-civil/tipo-vinculo/entities/tipo-vinculo.entity';
import type { ListVinculoDto, VinculoDto } from '@back/casa-civil/vinculo/entities/vinculo.entity';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export type Vinculo = VinculoDto;

export type Filtros = {
  campo_vinculo?: string;
  meta_id?: number;
  iniciativa_id?: number;
  atividade_id?: number;
  projeto_id?: number;
  transferencia_id?: number;
  distribuicao_id?: number;
  tipo_vinculo_id?: number;
} | null;

type Estado = {
  linhasEndereco: Vinculo[];
  linhasDotacao: Vinculo[];
  linhasDemanda: Vinculo[];
  lista: Vinculo[];
  tiposDeVinculo: TipoVinculoDto[];
  chamadasPendentes: {
    lista: boolean;
    salvar: boolean;
    excluir: boolean;
    tiposDeVinculo: boolean;
  };
  erros: {
    lista: null | unknown;
    endereco: null | unknown;
    dotacao: null | unknown;
    demanda: null | unknown;
    salvar: null | unknown;
    excluir: null | unknown;
    tiposDeVinculo: null | unknown;
  };
};

export const useTransferenciasVinculosStore = defineStore('transferenciasVinculos', {
  state: (): Estado => ({
    linhasEndereco: [],
    linhasDotacao: [],
    linhasDemanda: [],
    lista: [],
    tiposDeVinculo: [],
    chamadasPendentes: {
      lista: false,
      salvar: false,
      excluir: false,
      tiposDeVinculo: false,
    },
    erros: {
      lista: null,
      endereco: null,
      dotacao: null,
      demanda: null,
      salvar: null,
      excluir: null,
      tiposDeVinculo: null,
    },
  }),

  actions: {
    async buscarVinculos(filtros: Filtros = null) {
      this.chamadasPendentes.lista = true;
      this.erros.lista = null;

      try {
        if (filtros?.campo_vinculo === 'Endereco') {
          this.erros.endereco = null;
          const respostaEndereco = await this.requestS.get(
            `${baseUrl}/distribuicao-recurso-vinculo`,
            filtros,
          );
          this.linhasEndereco = respostaEndereco?.linhas || [];
        } else if (filtros?.campo_vinculo === 'Dotacao') {
          this.erros.dotacao = null;
          const respostaDotacao = await this.requestS.get(
            `${baseUrl}/distribuicao-recurso-vinculo`,
            filtros,
          );
          this.linhasDotacao = respostaDotacao?.linhas || [];
        } else if (filtros?.campo_vinculo === 'Demanda') {
          this.erros.demanda = null;
          const respostaDemanda = await this.requestS.get(
            `${baseUrl}/distribuicao-recurso-vinculo`,
            filtros,
          );
          this.linhasDemanda = respostaDemanda?.linhas || [];
        } else {
          const resposta = await this.requestS.get(
            `${baseUrl}/distribuicao-recurso-vinculo`,
            filtros,
          ) as ListVinculoDto;

          this.lista = resposta?.linhas || [];
        }
      } catch (erro) {
        this.erros.lista = erro;
        // Guarda o erro específico também
        if (filtros?.campo_vinculo === 'Endereco') {
          this.erros.endereco = erro;
        } else if (filtros?.campo_vinculo === 'Dotacao') {
          this.erros.dotacao = erro;
        } else if (filtros?.campo_vinculo === 'Demanda') {
          this.erros.demanda = erro;
        }
      } finally {
        this.chamadasPendentes.lista = false;
      }
    },

    async salvarItem(params: Record<string, unknown>, id = 0) {
      this.chamadasPendentes.salvar = true;
      this.erros.salvar = null;

      try {
        if (id) {
          return await this.requestS.patch(
            `${baseUrl}/distribuicao-recurso-vinculo/${id}`,
            params,
          );
        }

        return await this.requestS.post(
          `${baseUrl}/distribuicao-recurso-vinculo`,
          params,
        );
      } catch (erro) {
        this.erros.salvar = erro;
        throw erro;
      } finally {
        this.chamadasPendentes.salvar = false;
      }
    },

    async excluirItem(id: number) {
      this.chamadasPendentes.excluir = true;
      this.erros.excluir = null;

      try {
        await this.requestS.delete(`${baseUrl}/distribuicao-recurso-vinculo/${id}`);
        return true;
      } catch (erro) {
        this.erros.excluir = erro;
        return false;
      } finally {
        this.chamadasPendentes.excluir = false;
      }
    },

    async buscarTiposDeVinculo() {
      this.chamadasPendentes.tiposDeVinculo = true;
      this.erros.tiposDeVinculo = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}/tipo-vinculo`);
        this.tiposDeVinculo = resposta?.linhas || [];
      } catch (erro) {
        this.erros.tiposDeVinculo = erro;
      } finally {
        this.chamadasPendentes.tiposDeVinculo = false;
      }
    },
  },
});
