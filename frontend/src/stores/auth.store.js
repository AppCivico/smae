import { defineStore } from 'pinia';
import modulos from '@/consts/modulosDoSistema';
import retornarModuloAPartirDeEntidadeMae from '@/helpers/retornarModuloAPartirDeEntidadeMae';
import { useAlertStore } from '@/stores/alert.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAuthStore = defineStore('auth', {
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

        await this.getDados(null, { headers: { 'smae-sistemas': '' } });

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
      localStorage.removeItem('sistemaEscolhido');

      // @see https://github.com/vuejs/pinia/discussions/693#discussioncomment-1401218
      this.resetAllStores();

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

      if (a.some((c) => per[c] && !per[c].listar && !per[c].visualizar)) {
        per.algumAdmin = 1;
      }

      localStorage.setItem('permissions', JSON.stringify(per));
      this.permissions = per;
      return per;
    },
  },
  getters: {
    sistemaCorrente() {
      if (import.meta.env.VITE_TROCA_AUTOMATICA_MODULO !== 'true') {
        return this.sistemaEscolhido;
      }

      return retornarModuloAPartirDeEntidadeMae(this.route.meta.entidadeMãe)
        || this.moduloDaRotaAnterior
        || this.sistemaEscolhido;
    },
    dadosDoSistemaEscolhido({ sistemaCorrente, user }) {
      const dados = modulos[sistemaCorrente];

      // em duas condições porque arrays como parâmetro da função
      // `temPermissãoPara()` funcionam como **ou** e primeira condição é
      // obrigatória
      if (this.temPermissãoPara('SMAE.loga_direto_na_analise')
        && this.temPermissãoPara([
          'Reports.dashboard_pdm',
          'Reports.dashboard_programademetas',
          'Reports.dashboard_portfolios',
          'SMAE.espectador_de_painel_externo',
        ])
      ) {
        dados.rotaInicial = { name: 'análises' };
      } else if (sistemaCorrente === 'Projetos' && !user?.flags?.pp_pe) {
        dados.rotaInicial = { name: 'projetosListar' };
      }

      return dados || {};
    },
    estouAutenticada: ({ token }) => !!token,
    temPermissãoPara: ({ user }) => (permissoes) => (Array.isArray(permissoes)
      ? permissoes
      : [permissoes]
    ).some((x) => (x.slice(-1) === '.'
      // se o valor termina com `.`,
      // ele tem que bater com o começo de algumas permissões
      ? user.privilegios.some((y) => y.indexOf(x) === 0)
      : user.privilegios.some((y) => x === y))),

    rotaEhPermitida() {
      const rotasPorNome = this.router.getRoutes().reduce((acc, cur) => {
        if (cur.name) {
          acc[cur.name] = cur;
        }
        return acc;
      }, {});

      return (rota) => {
        const nome = typeof rota === 'string'
          ? rota
          : rota.name;

        if (!nome) {
          throw new Error('Rota sem nome fornecida.');
        }

        return !rotasPorNome[nome]?.meta?.limitarÀsPermissões
        || this.temPermissãoPara(rotasPorNome[nome]?.meta?.limitarÀsPermissões);
      };
    },
  },
});
