import tipoDePerfil from '@/consts/tipoDePerfil';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}/equipe-responsavel`;

export const useEquipesStore = (prefixo) => defineStore(prefixo ? `${prefixo}.equipesStore` : 'equipesStore', {
  state: () => ({
    lista: [],
    emFoco: null,

    chamadasPendentes: {
      lista: false,
      emFoco: false,
    },
    erro: null,
  }),
  actions: {
    async buscarItem(params = {}) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        const resposta = await this.requestS.get(`${baseUrl}`, params);
        this.emFoco = resposta?.linhas?.[0] || null;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.emFoco = false;
    },

    async buscarTudo(params = {}) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        const { linhas } = await this.requestS.get(`${baseUrl}`, params);
        this.lista = linhas;
      } catch (erro) {
        this.erro = erro;
      }
      this.chamadasPendentes.lista = false;
    },

    async excluirItem(id) {
      this.chamadasPendentes.lista = true;
      this.erro = null;

      try {
        await this.requestS.delete(`${baseUrl}/${id}`);
        this.chamadasPendentes.lista = false;
        return true;
      } catch (erro) {
        this.erro = erro;
        this.chamadasPendentes.lista = false;
        return false;
      }
    },

    async salvarItem(params = {}, id = 0) {
      this.chamadasPendentes.emFoco = true;
      this.erro = null;

      try {
        if (id) {
          await this.requestS.patch(`${baseUrl}/${id}`, params);
        } else {
          await this.requestS.post(`${baseUrl}`, params);
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
    itemParaEdicao({ emFoco }) {
      return {
        ...emFoco,
        participantes: emFoco?.participantes?.map((participante) => participante.id) || [],
        colaboradores: emFoco?.colaboradores?.map((colaborador) => colaborador.id) || [],
      };
    },

    equipesPorIds: ({ lista }) => (ids) => lista.filter((equipe) => ids.includes(equipe.id)),

    equipesPorOrgaoIdPorPerfil: ({ lista }) => {
      const porOrgao = lista.reduce((acc, grupo) => {
        if (!acc[grupo.orgao_id]) {
          acc[grupo.orgao_id] = {};
        }

        if (!acc[grupo.orgao_id][grupo.perfil]) {
          acc[grupo.orgao_id][grupo.perfil] = [];
        }

        acc[grupo.orgao_id][grupo.perfil].push(grupo);
        return acc;
      }, {});

      Object.keys(porOrgao).forEach((orgaoId) => {
        porOrgao[orgaoId] = Object.keys(porOrgao[orgaoId])
          // ordenar por nome do perfil
          .sort((a, b) => tipoDePerfil[a].nome.localeCompare(tipoDePerfil[b].nome))
          .reduce((acc, key) => {
            // ordenar por nome da equipe
            acc[key] = porOrgao[orgaoId][key].sort((a, b) => a.titulo.localeCompare(b.titulo));
            return acc;
          }, {});
      });

      return porOrgao;
    },
  },
})();
