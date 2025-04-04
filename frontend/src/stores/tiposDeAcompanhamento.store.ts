import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AcompanhamentoTipo, ListAcompanhamentoTipoDto } from '@back/pp/acompanhamento-tipo/entities/acompanhament-tipo.entities.dto';
import { useAuthStore } from './auth.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Lista = ListAcompanhamentoTipoDto['linhas'];

type TipoDeAcompanhamentoPorId = {
  [key: string]: AcompanhamentoTipo;
};

type ChamadasPendentes = {
  lista: boolean;
  emFoco: boolean;
};

type Estado = {
  lista: Lista;
  chamadasPendentes: ChamadasPendentes;
  erro: null | unknown;
};

function caminhoParaApi() {
  const authStore = useAuthStore();

  switch (authStore.sistemaEscolhido) {
    case 'Projetos':
      return 'acompanhamento-tipo';

    case 'MDO':
      return 'acompanhamento-tipo-mdo';

    default:
      throw new Error(
        'Você precisa estar em algum módulo para executar essa ação.',
      );
  }
}

export const useTiposDeAcompanhamentoStore = defineStore('tiposDeAcompanhamento', {
  state: (): Estado => ({
    lista: [],

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
        const {
          linhas,
        } = await this.requestS.get(`${baseUrl}/${caminhoParaApi()}`, params);

        this.lista = linhas;
      } catch (erro: unknown) {
        this.erro = erro;
      } finally {
        this.chamadasPendentes.lista = false;
        this.chamadasPendentes.emFoco = false;
      }
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/${caminhoParaApi()}/${id || this.route.params.tipoDeAtendimentoId}`);

        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0): Promise<boolean> {
      this.chamadasPendentes.emFoco = true;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/${caminhoParaApi()}/${id || this.route.params.tipoDeAtendimentoId}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/${caminhoParaApi()}`, params);
        }

        this.chamadasPendentes.emFoco = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.emFoco = false;
        return false;
      }
    },
  },
  getters: {
    tiposPorId: ({ lista }: Estado) => lista
      .reduce((acc:TipoDeAcompanhamentoPorId, cur:AcompanhamentoTipo) => ({
        ...acc,
        [cur.id]: cur,
      }), {}),
  },
});
