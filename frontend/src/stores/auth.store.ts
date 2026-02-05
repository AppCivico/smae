import { defineStore } from 'pinia';

import type { RouteRecordNormalized } from 'vue-router';

import type { AccessToken } from '@back/auth/models/AccessToken';
import type { LoginRequestBody } from '@back/auth/models/LoginRequestBody.dto';
import type { ReducedAccessToken } from '@back/auth/models/ReducedAccessToken';
import type { MinhaContaDto } from '@back/minha-conta/models/minha-conta.dto';
import type {
  ModuloSistema,
  ModulosDoSistema,
} from '@/consts/modulosDoSistema';

import modulos from '@/consts/modulosDoSistema';
import retornarModuloAPartirDeEntidadeMae from '@/helpers/retornarModuloAPartirDeEntidadeMae';
import { useAlertStore } from '@/stores/alert.store';

import type { ParametrosDeRequisicao } from '@/helpers/requestS';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: JSON.parse(localStorage.getItem('token') || 'null'),
    reducedToken: null as string | null,
    returnUrl: null,
    permissions: JSON.parse(localStorage.getItem('permissions') || 'null'),
    sistemaEscolhido: (localStorage.getItem('sistemaEscolhido')
      ?? 'SMAE') as ModuloSistema,
    moduloDaRotaAnterior: '' as ModuloSistema | '',

    modulosAcessiveis: [] as ModuloSistema[], // aqueles que o usuário pode escolher
    modulosDisponiveis: [] as ModuloSistema[], // aqueles visíveis na tela de escolha de módulo

    chamadasPendentes: {
      listarModulos: false,
      escolherModulo: false,
    },
    erros: {
      listarModulos: null as unknown,
      escolherModulo: null as unknown,
    },
  }),
  actions: {
    async login(carga: LoginRequestBody) {
      try {
        const token = (await this.requestS.post(
          `${baseUrl}/login`,
          carga as unknown as ParametrosDeRequisicao,
        )) as AccessToken | ReducedAccessToken;

        if ('reduced_access_token' in token) {
          this.reducedToken = token.reduced_access_token;
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
    async getDados(
      params: ParametrosDeRequisicao,
      opcoes: Record<string, unknown>,
    ) {
      try {
        const user = (await this.requestS.get(
          `${baseUrl}/minha-conta`,
          params,
          opcoes,
        )) as MinhaContaDto;

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
    async passwordRecover(username: string) {
      try {
        await this.requestS.post(`${baseUrl}/solicitar-nova-senha`, {
          email: username,
        });
        const alertStore = useAlertStore();
        alertStore.success(
          'Uma senha temporária foi enviada para o seu e-mail.',
        );
        this.router.push('/login');
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
      }
    },
    async passwordRebuilt(password: string) {
      try {
        if (!this.reducedToken) {
          this.router.push('/login');
          return;
        }
        const token = (await this.requestS.post(
          `${baseUrl}/escrever-nova-senha`,
          { reduced_access_token: this.reducedToken, senha: password },
        )) as AccessToken;
        this.reducedToken = null;
        this.token = token.access_token;
        localStorage.setItem('token', JSON.stringify(token.access_token));

        const user = (await this.requestS.get(
          `${baseUrl}/minha-conta`,
        )) as MinhaContaDto;
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
      this.requestS.post(`${baseUrl}/sair`, null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('permissions');
      localStorage.removeItem('sistemaEscolhido');

      // @see https://github.com/vuejs/pinia/discussions/693#discussioncomment-1401218
      this.resetStores();

      this.router.push('/login');
    },

    async carregarModulos() {
      this.chamadasPendentes.listarModulos = true;
      this.erros.listarModulos = null;

      try {
        const resposta = await this.requestS.get(
          `${baseUrl}/minha-conta`,
          null,
          { headers: { 'smae-sistemas': Object.keys(modulos).join(',') } },
        ) as MinhaContaDto;

        const {
          sessao: { sistemas, sistemas_disponiveis: sistemasDisponiveis },
        } = resposta;

        this.user = resposta.sessao;
        localStorage.setItem('user', JSON.stringify(resposta.sessao));

        if (Array.isArray(sistemas)) {
          this.modulosAcessiveis = sistemas.filter((sistema) => sistema !== 'SMAE');
          this.modulosDisponiveis = sistemasDisponiveis || [];
        }
      } catch (erro) {
        this.erros.listarModulos = erro;
      } finally {
        this.chamadasPendentes.listarModulos = false;
      }
    },

    async escolherModulo(sistema: ModuloSistema, ignorarRotaInicial = false) {
      this.chamadasPendentes.escolherModulo = true;
      this.erros.escolherModulo = null;

      if (!this.modulosAcessiveis.includes(sistema)) {
        this.erros.escolherModulo = 'Você não tem acesso a este módulo.';
        this.chamadasPendentes.escolherModulo = false;
        return Promise.reject(new Error(this.erros.escolherModulo as string));
      }

      try {
        await this.getDados(null, {
          headers: { 'smae-sistemas': `SMAE,${sistema}` },
        });

        this.sistemaEscolhido = sistema;
        localStorage.setItem('sistemaEscolhido', sistema);

        if (!ignorarRotaInicial && this.dadosDoSistemaEscolhido?.rotaInicial) {
          const listaDeRotasPossiveis = !Array.isArray(
            this.dadosDoSistemaEscolhido?.rotaInicial,
          )
            ? [this.dadosDoSistemaEscolhido?.rotaInicial]
            : this.dadosDoSistemaEscolhido?.rotaInicial;

          const rotaFiltrada = listaDeRotasPossiveis
            .find((rota) => this.rotaEhPermitida(rota.name));

          if (rotaFiltrada) {
            this.router.push(rotaFiltrada);
          } else {
            this.router.push({ name: 'cadastrosBasicos' });
          }
        }

        this.resetStores([
          'regions',
          'users',
          'tarefas',
          'Orcamentos',
          'processos',
          'acompanhamentos',
          'macrotemasPsStore',
          'Macrotemas',
          // Provavelmente não existem
          'planosSetoriais',
          'Metas',
          'psMetas',
        ]);
      } catch (erro) {
        this.sistemaEscolhido = 'SMAE' as ModuloSistema;
        this.erros.escolherModulo = erro;

        return await Promise.reject(erro);
      } finally {
        this.chamadasPendentes.escolherModulo = false;
      }

      return Promise.resolve();
    },

    async sincronizarModuloComRota(): Promise<void> {
      const moduloDaRota = this.route.meta?.entidadeMãe
        && retornarModuloAPartirDeEntidadeMae(this.route.meta.entidadeMãe);

      if (!moduloDaRota || moduloDaRota === this.sistemaCorrente) {
        return;
      }

      if (!this.modulosAcessiveis.length && !this.chamadasPendentes.listarModulos) {
        await this.carregarModulos();
      }

      try {
        await this.escolherModulo(moduloDaRota, true);

        if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
          console.warn('Módulo sincronizado com a rota atual com sucesso. Vamos recarregar a página para garantir que tudo seja carregado corretamente.');
        }

        window.location.reload();
      } catch {
        const alertStore = useAlertStore();
        alertStore.error(
          this.erros.escolherModulo
            || 'Não foi possível sincronizar o módulo com a rota atual.',
        );

        if (
          import.meta.env.VITE_EXPOR_ERROS === 'true'
          || import.meta.env.DEV
        ) {
          console.warn('Não foi possível sincronizar o módulo com a rota atual. Redirecionando para a página inicial...');
        }

        this.router.push({ name: 'home' });
      }
    },

    setPermissions() {
      const per: Record<string, Record<string, number>> = {};
      if (this.user.privilegios) {
        this.user.privilegios.forEach((p: string) => {
          const c = p.split('.');
          if (c[1]) {
            if (!per[c[0]]) {
              per[c[0]] = {};
            }
            per[c[0]][c[1]] = 1;
          }
        });
      }

      // const a = [
      //   'CadastroCicloFisico',
      //   'CadastroEtapa',
      //   'CadastroGrupoPaineis',
      //   'CadastroMacroTema',
      //   'CadastroMeta',
      //   'CadastroOds',
      //   'CadastroOrgao',
      //   'CadastroPainel',
      //   'CadastroPdm',
      //   'CadastroPessoa',
      //   'CadastroRegiao',
      //   'CadastroSubTema',
      //   'CadastroTag',
      //   'CadastroTema',
      //   'CadastroTipoDocumento',
      //   'CadastroTipoOrgao',
      //   'CadastroUnidadeMedida',
      //   'Projeto',
      // ];

      // if (a.some((c) => per[c] && !per[c].listar && !per[c].visualizar)) {
      //   per.algumAdmin = 1;
      // }

      localStorage.setItem('permissions', JSON.stringify(per));
      this.permissions = per;
      return per;
    },
  },
  getters: {
    sistemaCorrente(): ModuloSistema {
      if (import.meta.env.VITE_TROCA_AUTOMATICA_MODULO !== 'true') {
        return this.sistemaEscolhido;
      }

      return (
        retornarModuloAPartirDeEntidadeMae(this.route.meta.entidadeMãe)
        || this.moduloDaRotaAnterior
        || this.sistemaEscolhido
      );
    },
    dadosDoSistemaEscolhido(): ModulosDoSistema[ModuloSistema] {
      const dados = modulos[this.sistemaCorrente];

      if (!dados) {
        return {} as ModulosDoSistema[ModuloSistema];
      }

      // em duas condições porque arrays como parâmetro da função
      // `temPermissãoPara()` funcionam como **ou** e primeira condição é
      // obrigatória
      if (
        this.temPermissãoPara('SMAE.loga_direto_na_analise')
        && this.temPermissãoPara([
          'Reports.dashboard_pdm',
          'Reports.dashboard_programademetas',
          'Reports.dashboard_portfolios',
          'SMAE.espectador_de_painel_externo',
        ])
      ) {
        return { ...dados, rotaInicial: { name: 'análises' } };
      }

      if (
        this.sistemaCorrente === 'Projetos'
        && !this.user?.flags?.pp_pe
      ) {
        return { ...dados, rotaInicial: { name: 'projetosListar' } };
      }

      return dados;
    },
    estouAutenticada: ({ token }) => !!token,
    temPermissãoPara:
      ({ user }) => (permissoes: string | string[]) => (Array.isArray(permissoes)
        ? permissoes
        : [permissoes]).some((x) => (x.slice(-1) === '.'
        // se o valor termina com `.` ele tem que bater com o começo de algumas permissões
        ? user.privilegios.some((y: string) => y.indexOf(x) === 0)
        : user.privilegios.some((y: string) => x === y))),

    rotaEhPermitida() {
      const rotasPorNome = this.router.getRoutes().reduce(
        (acc, cur) => {
          if (cur.name) {
            acc[String(cur.name)] = cur;
          }
          return acc;
        },
        {} as Record<string, RouteRecordNormalized>,
      );

      return (rota: string | RouteRecordNormalized) => {
        const nome = typeof rota === 'string' ? rota : rota?.name;

        if (!nome) {
          throw new Error('Rota sem nome fornecida.');
        }

        return (
          !rotasPorNome[String(nome)]?.meta?.limitarÀsPermissões
          || this.temPermissãoPara(
            rotasPorNome[String(nome)].meta.limitarÀsPermissões || '',
          )
        );
      };
    },
  },
});
