import type { MfDashTransferenciasDto } from '@back/casa-civil/dash/dto/transferencia.dto';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type RespostaTransferencias = {
  linhas: MfDashTransferenciasDto[];
  requestInfo: {
    queryTook: number;
  };
};

export const usePanoramaTransferenciasStore = defineStore(
  'panoramaTransferencias',
  {
    state: () => ({
      lista: [] as MfDashTransferenciasDto[],
      emFoco: null as MfDashTransferenciasDto | null,

      chamadasPendentes: {
        lista: false,
        emFoco: false,
      } as ChamadasPendentes,
      erro: null as unknown,
    }),
    actions: {
      async buscarTudo(params = {}): Promise<void> {
        this.chamadasPendentes.lista = true;
        this.erro = null;

        try {
          const {
            linhas,
          } = (await this.requestS.get(
            `${baseUrl}/panorama/transferencias`,
            params,
          )) as RespostaTransferencias;

          this.lista = linhas;
        } catch (error_: unknown) {
          this.erro = error_;
        }
        this.chamadasPendentes.lista = false;
      },
    },

    getters: {},
  },
);
