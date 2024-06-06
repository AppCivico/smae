import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useUsersStore = defineStore({
  id: 'users',
  state: () => ({
    accessProfiles: {},
    users: {},
    user: {},
    temp: {},
    pessoasSimplificadas: {},
    // desrespeitando o padrão legado porque temos que manter o `user` limpo
    chamadasPendentes: {
      user: false,
    },
    erros: {
      user: null,
    },
  }),
  actions: {
    clear() {
      this.accessProfiles = {};
      this.users = {};
      this.user = {};
      this.temp = {};
      this.pessoasSimplificadas = {};
    },
    async register(user) {
      await this.requestS.post(`${baseUrl}/pessoa`, user);
      return true;
    },
    async getAll() {
      try {
        if (this.users.loading) return;
        this.users = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/pessoa`);
        this.users = r.linhas;
      } catch (error) {
        this.users = { error };
      }
    },
    async getById(id) {
      this.chamadasPendentes.user = true;
      this.erros.user = null;
      try {
        const r = await this.requestS.get(`${baseUrl}/pessoa/${id}`);
        if (!r.id) {
          throw new Error('Usuário não encontrado');
        }
        r.desativado = r.desativado ? '1' : false;
        if (r.grupos) r.grupos = r.grupos.map((g) => g.id);
        this.user = r;
      } catch (error) {
        this.erros.user = error;
      }
      this.chamadasPendentes.user = false;
    },
    async buscarPessoasSimplificadas(params) {
      try {
        if (this.pessoasSimplificadas.loading) return;
        //this.pessoasSimplificadas = { loading: true };
        const r = await this.requestS.get(`${baseUrl}/pessoa/reduzido`, params);
        this.pessoasSimplificadas = r.linhas;
      } catch (error) {
        this.pessoasSimplificadas = { error };
      }
    },
    async update(id, params) {
      this.erros.user = null;
      this.chamadasPendentes.user = true;
      try {
        const m = {
          email: params.email,
          nome_exibicao: params.nome_exibicao,
          nome_completo: params.nome_completo,
          lotacao: params.lotacao,
          orgao_id: params.orgao_id,
          perfil_acesso_ids: params.perfil_acesso_ids,
          grupos: params.grupos,
        };

        const authStore = useAuthStore();
        if (id == authStore.user.id && !params.perfil_acesso_ids.length) {
          const alertStore = useAlertStore();
          alertStore.error('Não se pode remover seu próprio perfil.');
          return false;
        }

        if (params.desativado == '1') {
          m.desativado = true;
          m.desativado_motivo = params.desativado_motivo;
        } else {
          m.desativado = false;
        }

        await this.requestS.patch(`${baseUrl}/pessoa/${id}`, m);
        if (id === authStore.user.id) {
          const user = { ...authStore.user, ...params };
          localStorage.setItem('user', JSON.stringify(user));
          authStore.user = user;
        }
        this.users = {};
        this.chamadasPendentes.user = true;
        return true;
      } catch (error) {
        this.erros.user = error;
        this.chamadasPendentes.user = true;
        return false;
      }
    },
    /* async delete(id) {
            const authStore = useAuthStore();
            if(id !== authStore.user.id){
                this.users.find(x => x.id === id).isDeleting = true;
                await this.requestS.delete(`${baseUrl}/deletar-usuario/${id}`);
                this.users = this.users.filter(x => x.id !== id);
            }
        } */
    async filterUsers(f) {
      this.temp = { loading: true };
      this.erros.user = null;
      try {
        if (!this.users.length) {
          await this.getAll();
        }
        this.temp = f
          ? this.users
            .filter((u) => (f.orgao
              ? u.orgao_id == f.orgao
              : 1)
              && (f.nomeemail
                ? (u.nome_completo.includes(f.nomeemail) || u.email.includes(f.nomeemail))
                : 1))
          : this.users;
      } catch (error) {
        this.erros.user = error;
      }
      this.chamadasPendentes.user = true;
    },
    async getProfiles() {
      this.accessProfiles = { loading: true };
      try {
        const r = await this.requestS.get(`${baseUrl}/perfil-de-acesso`);
        this.accessProfiles = r.linhas;
      } catch (error) {
        this.accessProfiles = { error };
      }
    },
  },
  getters: {
    perfisPorId: (({ accessProfiles }) => (Array
      .isArray(accessProfiles)
      ? accessProfiles.reduce((acc, cur) => {
        if (!acc[cur.id]) {
          acc[cur.id] = [];
        }
        acc[cur.id].push(cur);
        return acc;
      }, {})
      : {})),
    pessoasSimplificadasPorÓrgão: (({ pessoasSimplificadas }) => (Array
      .isArray(pessoasSimplificadas)
      ? pessoasSimplificadas.reduce((acc, cur) => {
        if (!acc[cur.orgao_id]) {
          acc[cur.orgao_id] = [];
        }
        acc[cur.orgao_id].push(cur);
        return acc;
      }, {})
      : {})),
  },
});
