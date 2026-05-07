import { defineStore } from 'pinia';

import dateTimeToDate from '@/helpers/dateTimeToDate';

import type { GestaoDistribuicaoSolicitacaoAjusteDto } from '@back/casa-civil/distribuicao-recurso/dto/gestao-distribuicao-solicitacao-ajuste.dto';
import type { UpdateDistribuicaoSolicitacaoAjusteDto } from '@back/casa-civil/distribuicao-recurso/dto/update-distribuicao-solicitacao-ajuste.dto';
import type {
  DistribuicaoSolicitacaoAjusteDto,
  ListDistribuicaoSolicitacaoAjusteDto,
} from '@back/casa-civil/distribuicao-recurso/entities/distribuicao-solicitacao-ajuste.entity';

interface Estado {
  lista: DistribuicaoSolicitacaoAjusteDto[];
  emFoco: DistribuicaoSolicitacaoAjusteDto | null;
  chamadasPendentes: ChamadasPendentes;
  erros: Erros;
}

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useDistribuicaoSolicitacaoAjusteStore = defineStore(
  'distribuicaoSolicitacaoAjuste',
  {
    state: (): Estado => ({
      lista: [],
      emFoco: null,

      chamadasPendentes: {
        lista: false,
        emFoco: false,
      },
      erros: {
        lista: null,
        emFoco: null,
      },
    }),

    actions: {
      async buscarItem(
        id = 0,
        params: Record<string, unknown> = {},
      ): Promise<void> {
        this.chamadasPendentes.emFoco = true;
        this.erros.emFoco = null;

        try {
          const resposta = (await this.requestS.get(
            `${baseUrl}/distribuicao-recurso-solicitacao-ajuste/${id}`,
            params,
          )) as DistribuicaoSolicitacaoAjusteDto;

          this.emFoco = resposta;
        } catch (error_) {
          this.erros.emFoco = error_;
        }
        this.chamadasPendentes.emFoco = false;
      },

      async buscarTudo(params: Record<string, unknown> = {}): Promise<void> {
        this.chamadasPendentes.lista = true;
        this.erros.lista = null;

        try {
          const resposta = (await this.requestS.get(
            `${baseUrl}/distribuicao-recurso-solicitacao-ajuste`,
            params,
          )) as ListDistribuicaoSolicitacaoAjusteDto;

          this.lista = resposta.linhas || [];
        } catch (error_) {
          this.erros.lista = error_;
        }
        this.chamadasPendentes.lista = false;
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
              `${baseUrl}/distribuicao-recurso-solicitacao-ajuste/${id}`,
              params,
            )) as RecordWithId;
          } else {
            resposta = (await this.requestS.post(
              `${baseUrl}/distribuicao-recurso-solicitacao-ajuste`,
              params,
            )) as RecordWithId;
          }

          this.chamadasPendentes.emFoco = false;
          return resposta || true;
        } catch (erro) {
          this.erros.emFoco = erro;
          this.chamadasPendentes.emFoco = false;
          return false;
        }
      },

      async aplicarDecisao(
        id: number,
        status: GestaoDistribuicaoSolicitacaoAjusteDto['status'],
        resposta_motivo?: GestaoDistribuicaoSolicitacaoAjusteDto['resposta_motivo'],
      ): Promise<boolean> {
        this.chamadasPendentes.emFoco = true;
        this.erros.emFoco = null;

        try {
          (await this.requestS.patch(
            `${baseUrl}/distribuicao-recurso-solicitacao-ajuste/${id}/gestao`,
            { status, resposta_motivo },
          )) as RecordWithId;
          this.chamadasPendentes.emFoco = false;
          return true;
        } catch (error_) {
          this.erros.emFoco = error_;
          this.chamadasPendentes.emFoco = false;
          return false;
        }
      },

      async solicitarAprovacao(id: number): Promise<boolean> {
        this.chamadasPendentes.emFoco = true;
        this.erros.emFoco = null;

        try {
          (await this.requestS.patch(
            `${baseUrl}/distribuicao-recurso-solicitacao-ajuste/${id}/submeter`,
            { id },
          )) as RecordWithId;
          this.chamadasPendentes.emFoco = false;
          return true;
        } catch (error_) {
          this.erros.emFoco = error_;
          this.chamadasPendentes.emFoco = false;
          return false;
        }
      },
    },

    getters: {
      itemParaEdicao: ({
        emFoco,
      }): UpdateDistribuicaoSolicitacaoAjusteDto | null => {
        if (!emFoco) return null;

        const camposSolicitados = emFoco.campos_solicitados;

        const camposDeData = new Set([
          'assinatura_estado',
          'assinatura_municipio',
          'assinatura_termo_aceite',
          'data_empenho',
          'conclusao_suspensiva',
          'vigencia',
        ]);

        return Object.keys(camposSolicitados).reduce((acc, campo) => {
          const valor = camposSolicitados[campo];

          if (valor?.para) {
            if (camposDeData.has(campo)) {
              // eslint-disable-next-line max-len
              acc[campo as keyof UpdateDistribuicaoSolicitacaoAjusteDto] = dateTimeToDate(valor.para);
            } else {
              acc[campo as keyof UpdateDistribuicaoSolicitacaoAjusteDto] = valor.para as string;
            }
          }
          return acc;
        }, {
          informacoes_complementares: emFoco.informacoes_complementares || undefined,
        });
      },
    },
  },
);
