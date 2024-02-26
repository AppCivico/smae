import { useAlertStore } from '@/stores/alert.store';
import { defineStore } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')),
    token: JSON.parse(localStorage.getItem('token')),
    reducedtoken: null,
    returnUrl: null,
    permissions: JSON.parse(localStorage.getItem('permissions')),
  }),
  actions: {
    async login(username, password) {
      try {
        const token = await this.requestS.post(`${baseUrl}/login`, { email: username, senha: password });

        if (token.reduced_access_token) {
          this.reducedtoken = token.reduced_access_token;
          this.router.push('/nova-senha');
          return;
        }
        this.token = token.access_token;
        localStorage.setItem('token', JSON.stringify(token.access_token));

        await this.getDados();

        if (this.permissions?.SMAE?.loga_direto_na_analise) {
          this.router.push({ name: 'análises' });
        } else {
          this.router.push(this.returnUrl || '/');
        }
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
      }
    },
    async getDados() {
      try {
        const user = await this.requestS.get(`${baseUrl}/minha-conta`);
        this.user = user.sessao;
        localStorage.setItem('user', JSON.stringify(user.sessao));

        this.setPermissions();
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
      }
    },
    async passwordRecover(username) {
      try {
        await this.requestS.post(`${baseUrl}/solicitar-nova-senha`, { email: username });
        const alertStore = useAlertStore();
        alertStore.success('Uma senha temporária foi enviada para o seu e-mail.');
        this.router.push('/login');
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
      }
    },
    async passwordRebuilt(password) {
      try {
        if (!this.reducedtoken) {
          this.router.push('/login');
          return;
        }
        const token = await this.requestS.post(`${baseUrl}/escrever-nova-senha`, { reduced_access_token: this.reducedtoken, senha: password });
        this.reducedtoken = null;
        this.token = token.access_token;
        localStorage.setItem('token', JSON.stringify(token.access_token));

        const user = await this.requestS.get(`${baseUrl}/minha-conta`);
        this.user = user.sessao;
        localStorage.setItem('user', JSON.stringify(user.sessao));

        this.setPermissions();

        const alertStore = useAlertStore();
        alertStore.success('Senha salva com sucesso. Bem-vindo!');
        this.router.push(this.returnUrl || '/');
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
      }
    },
    logout() {
      this.requestS.post(`${baseUrl}/sair`);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('permissions');
      this.$reset();
      this.router.push('/login');
    },
    setPermissions() {
      const per = {};
      if (this.user.privilegios) {
        this.user.privilegios.forEach((p) => {
          const c = p.split('.');
          if (c[1]) {
            if (!per[c[0]]) per[c[0]] = {};
            per[c[0]][c[1]] = 1;
          }
        });
      }

      const a = [
        'CadastroAtividade',
        'CadastroCicloFisico',
        'CadastroCronograma',
        'CadastroEtapa',
        'CadastroGrupoPaineis',
        'CadastroIndicador',
        'CadastroIniciativa',
        'CadastroMacroTema',
        'CadastroMeta',
        'CadastroOds',
        'CadastroOrgao',
        'CadastroPainel',
        'CadastroPdm',
        'CadastroPessoa',
        'CadastroRegiao',
        'CadastroSubTema',
        'CadastroTag',
        'CadastroTema',
        'CadastroTipoDocumento',
        'CadastroTipoOrgao',
        'CadastroUnidadeMedida',
        'Projeto',
      ];

      for (const c in a) {
        if (per[a[c]] && !per[a[c]].listar && !per[a[c]].visualizar) {
          per.algumAdmin = 1;
          break;
        }
      }

      localStorage.setItem('permissions', JSON.stringify(per));
      return this.permissions = per;
    },
  },
  getters: {
    estouAutenticada: ({ token }) => !!token,
    temPermissãoPara: ({ user }) => (permissões) => (Array.isArray(permissões)
      ? permissões
      : [permissões]
    ).some((x) => user.privilegios.some((y) => y.indexOf((
      // garantir que há um `.` no nome da permissão pelo menos na segunda
      // letra. Caso contrário, adicionar-lhe um ao final
      x.indexOf('.') < 1 ? `${x}.` : x
    )) !== -1)),
  },
});
