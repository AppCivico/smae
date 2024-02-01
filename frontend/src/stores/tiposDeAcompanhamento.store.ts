import { defineStore } from 'pinia';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AcompanhamentoTipo, ListAcompanhamentoTipoDto } from '@/../../backend/src/pp/acompanhamento-tipo/entities/acompanhament-tipo.entities.dto';

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

  paginação: {
    temMais: Boolean;
    tokenDaPróximaPágina: String;
  };
};

export const useTiposDeAcompanhamentoStore = defineStore('tiposDeAcompanhamento', {
  state: (): Estado => ({
    lista: [],

    chamadasPendentes: {
      lista: true,
      emFoco: true,
    },

    paginação: {
      temMais: false,
      tokenDaPróximaPágina: '',
    },

    erro: null,
  }),
  actions: {
    async buscarTudo(params: { token_proxima_pagina?: String } = {}): Promise<void> {
      this.chamadasPendentes.lista = true;
      this.chamadasPendentes.emFoco = true;
      try {
        const {
          linhas,
          tem_mais: temMais,
          token_proxima_pagina: tokenDaPróximaPágina,
        } = await this.requestS.get(`${baseUrl}/acompanhamento-tipo`, params);
        this.lista = params.token_proxima_pagina
          ? this.lista.concat(linhas)
          : linhas;

        this.paginação.temMais = temMais || false;
        this.paginação.tokenDaPróximaPágina = tokenDaPróximaPágina || '';
      } catch (erro: unknown) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
      this.chamadasPendentes.emFoco = false;
    },

    async excluirItem(id: number): Promise<boolean> {
      this.chamadasPendentes.lista = true;

      try {
        await this.requestS.delete(`${baseUrl}/acompanhamento-tipo/${id || this.route.params.tipoDeAtendimentoId}`);

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
          await this.requestS.patch(`${baseUrl}/acompanhamento-tipo/${id || this.route.params.tipoDeAtendimentoId}`, params);
        } else {
          await this.requestS.post(`${baseUrl}/acompanhamento-tipo`, params);
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
