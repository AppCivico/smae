import modulos from '@/consts/modulosDoSistema.ts';
import retornarModuloDeEntidadeMae from '@/helpers/retornarModuloDeEntidadeMae.ts';
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
    sistemaEscolhido: localStorage.getItem('sistemaEscolhido') || 'SMAE',
    moduloDaRotaAnterior: '',
  }),
  actions: {
    async login(carga) {
      try {
        const token = await this.requestS.post(`${baseUrl}/login`, carga);

        if (token.reduced_access_token) {
          this.reducedtoken = token.reduced_access_token;
          this.router.push('/nova-senha');
          return;
        }
        this.token = token.access_token;

        if (typeof token.access_token === 'string') {
          localStorage.setItem('token', JSON.stringify(token.access_token));
        } else {
          throw new Error('Token não recebido.');
        }

        await this.getDados();

        this.router.push(this.returnUrl || '/');
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
      }
    },
    async getDados(params, opcoes) {
      try {
        const user = await this.requestS.get(`${baseUrl}/minha-conta`, params, opcoes);

        this.user = user.sessao;

        if (typeof user.sessao === 'object') {
          localStorage.setItem('user', JSON.stringify(user.sessao));
        } else {
          throw new Error('Usuário não recebido.');
        }

        this.setPermissions();

        return user;
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
        throw error;
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
        'CadastroCicloFisico',
        'CadastroEtapa',
        'CadastroGrupoPaineis',
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
    sistemaCorrente() {
      if (!import.meta.env.VITE_HABILITAR_BETA) {
        return this.sistemaEscolhido;
      }

      return retornarModuloDeEntidadeMae(this.route.meta.entidadeMãe)
        || this.moduloDaRotaAnterior
        || this.sistemaEscolhido;
    },
    dadosDoSistemaEscolhido: ({ sistemaCorrente }) => modulos[sistemaCorrente] || {},
    estouAutenticada: ({ token }) => !!token,
    temPermissãoPara: ({ user }) => (permissoes) => (Array.isArray(permissoes)
      ? permissoes
      : [permissoes]
    ).some((x) => (x.slice(-1) === '.'
      // se o valor termina com `.`,
      // ele tem que bater com o começo de algumas permissões
      ? user.privilegios.some((y) => y.indexOf(x) === 0)
      : user.privilegios.some((y) => x === y))),
  },
});
