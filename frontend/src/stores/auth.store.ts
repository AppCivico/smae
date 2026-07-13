import type { AccessToken } from '@back/auth/models/AccessToken';
import type { LoginRequestBody } from '@back/auth/models/LoginRequestBody.dto';
import type { ReducedAccessToken } from '@back/auth/models/ReducedAccessToken';
import { ListaDePrivilegios } from '@back/common/ListaDePrivilegios';
import type { MinhaContaDto } from '@back/minha-conta/models/minha-conta.dto';
import { defineStore } from 'pinia';
import type { RouteRecordNormalized } from 'vue-router';

import type {
  ModuloSistema,
  ModulosDoSistema,
} from '@/consts/modulosDoSistema';
import modulos from '@/consts/modulosDoSistema';
import type { ParametrosDeRequisicao } from '@/helpers/requestS';
import retornarModuloAPartirDeEntidadeMae from '@/helpers/retornarModuloAPartirDeEntidadeMae';
import { useAlertStore } from '@/stores/alert.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

type Privilegios = Record<ModuloSistema, ListaDePrivilegios[]>;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: JSON.parse(localStorage.getItem('token') || 'null'),
    reducedToken: null as string | null,
    returnUrl: null as string | null,
    privilegiosPorModulo: JSON.parse(localStorage.getItem('smae:privilegiosPorModulo') || '{}') as Privilegios,
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
          this.token = null;
          this.user = null;
          Object.keys(this.privilegiosPorModulo).forEach((modulo) => {
            delete this.privilegiosPorModulo[modulo as ModuloSistema];
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('smae:privilegiosPorModulo');

          this.reducedToken = token.reduced_access_token;
          this.router.push('/nova-senha');
          return;
        }
        this.token = token.access_token;

        if (typeof token.access_token === 'string') {
          localStorage.setItem('token', JSON.stringify(token.access_token));
        } else {
          throw new TypeError('Token não recebido.');
        }

        await this.getDados(null, '');

        this.router.push(this.returnUrl || '/');
      } catch (error) {
        const alertStore = useAlertStore();
        alertStore.error(error);
      }
    },
    async getDados(
      params: ParametrosDeRequisicao,
      modulo?: ModuloSistema | '',
    ): Promise<MinhaContaDto | undefined> {
      let opcoes = {};

      if (modulo !== undefined) {
        opcoes = modulo
          ? { headers: { 'smae-sistemas': `SMAE,${modulo}` } }
          : { headers: { 'smae-sistemas': '' } };
      }

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
          throw new TypeError('Usuário não recebido.');
        }

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
      localStorage.removeItem('smae:privilegiosPorModulo');
      localStorage.removeItem('sistemaEscolhido');

      // @see https://github.com/vuejs/pinia/discussions/693#discussioncomment-1401218
      this.resetStores();

      this.router.push('/login');
    },

    // Sessão inválida/expirada (token rejeitado pelo backend - HTTP 401).
    // Diferente do logout(), NÃO chama o endpoint /sair (o token já não vale e a
    // chamada também retornaria 401), apenas limpa o estado local e manda pro login,
    // preservando a rota atual para retornar após autenticar novamente.
    sessaoExpirada() {
      const rotaAtual = this.router?.currentRoute?.value;
      const naLogin = rotaAtual?.name === 'login' || rotaAtual?.path === '/login';
      const returnUrl = !naLogin ? rotaAtual?.fullPath ?? null : null;

      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('smae:privilegiosPorModulo');
      localStorage.removeItem('sistemaEscolhido');

      // @see https://github.com/vuejs/pinia/discussions/693#discussioncomment-1401218
      this.resetStores();

      // definido após o resetStores(), que zeraria o returnUrl
      this.returnUrl = returnUrl;

      if (!naLogin) {
        this.router.push('/login');
      }
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

    salvarModulo(modulo: ModuloSistema) {
      this.sistemaEscolhido = modulo;
      localStorage.setItem('sistemaEscolhido', modulo);
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
        const { sessao: { privilegios } } = await this.getDados(null, sistema);

        this.salvarModulo(sistema);

        this.definirPrivilegiosPorModulo(sistema, privilegios);

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

    async sincronizarPrivilegiosComRota(modulo: ModuloSistema) {
      try {
        if (!this.modulosAcessiveis.length && !this.chamadasPendentes.listarModulos) {
          if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
            console.log('Carregando módulos para a rota atual...');
          }
          await this.carregarModulos();
        }

        if (!this.modulosAcessiveis.includes(modulo)) {
          throw new Error('Você não tem acesso a este módulo.');
        }

        const { sessao: { privilegios } } = await this.getDados(null, modulo);

        if (!privilegios) {
          throw new Error('Privilégios não encontrados para a rota atual.');
        }

        if (!this.sistemaEscolhido) {
          this.salvarModulo(modulo);
        }

        this.definirPrivilegiosPorModulo(modulo, privilegios);
      } catch (error_) {
        throw new Error(`Não foi possível sincronizar os privilégios com a rota atual: ${error_}`);
      }
    },

    async sincronizarModuloComRota(): Promise<void> {
      const moduloDaRota = this.route.meta?.entidadeMãe
        && retornarModuloAPartirDeEntidadeMae(this.route.meta?.entidadeMãe);

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

    definirPrivilegiosPorModulo(modulo: ModuloSistema, privilegios: ListaDePrivilegios[]) {
      this.privilegiosPorModulo[modulo as ModuloSistema] = privilegios;

      localStorage.setItem('smae:privilegiosPorModulo', JSON.stringify(this.privilegiosPorModulo));
    },
  },
  getters: {
    sistemaCorrente(): ModuloSistema {
      if (import.meta.env.VITE_TROCA_AUTOMATICA_MODULO !== 'true') {
        return this.sistemaEscolhido;
      }

      return (
        retornarModuloAPartirDeEntidadeMae(this.route.meta?.entidadeMãe)
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
    temPermissãoPara() {
      return (permissoes: string | string[]) => {
        const privilegios = this.privilegiosPorModulo[this.sistemaCorrente] || [];

        if (!privilegios.length) {
          return false;
        }

        return (Array.isArray(permissoes)
          ? permissoes
          : [permissoes]).some((x) => (x.endsWith('.')
          // se o valor termina com `.` ele tem que bater com o começo de algumas permissões
          ? privilegios.some((y: ListaDePrivilegios) => String(y).startsWith(x))
          : privilegios.some((y: ListaDePrivilegios) => String(y) === x)));
      };
    },

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
