<script setup>
import truncate from '@/helpers/truncate';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMetasStore } from '@/stores/metas.store';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const MetasStore = useMetasStore();
const { user, temPermissãoPara } = storeToRefs(authStore);
const { Metas } = storeToRefs(MetasStore);

const panoramaStore = usePanoramaStore();

const dadosExtrasDeAbas = {
  TabelaDeVariaveis: {
    id: 'variaveis',
    etiqueta: 'Variáveis',
  },
  TabelaDeVariaveisCompostas: {
    id: 'variaveis-compostas',
    etiqueta: 'Variáveis Compostas',
  },
  TabelaDeVariaveisCompostasEmUso: {
    id: 'variaveis-compostas-em-uso',
    etiqueta: 'Variáveis compostas em uso',
    aberta: true,
  },
};

const dadosParaFiltros = computed(() => {
  const órgãos = {};
  const responsáveis = {};
  const metas = {};

  if (Array.isArray(Metas.value)) {
    Metas.value.forEach((x) => {
      metas[x.id] = x;
      metas[x.id].órgãos = [];
      metas[x.id].pessoas = [];

      x.orgaos_participantes.forEach((y) => {
        metas[x.id].órgãos.push(y.orgao.id);

        if (!órgãos[y.orgao.id]) {
          órgãos[y.orgao.id] = { ...y.orgao, pessoas: {} };
        }

        y.participantes.forEach((z) => {
          if (!órgãos[y.orgao.id].pessoas[z.id]) {
            órgãos[y.orgao.id].pessoas[z.id] = true;
          }
        });

        if (y.responsavel) {
          y.participantes.forEach((z) => {
            metas[x.id].pessoas.push(z.id);
            if (!responsáveis[z.id]) {
              responsáveis[z.id] = { ...z, órgãos: {} };
            }
            // aceitando a mesma pessoa em mais de um órgão
            if (!responsáveis[z.id].órgãos[y.orgao.id]) {
              responsáveis[z.id].órgãos[y.orgao.id] = true;
            }
          });
        }
      });
    });
  }

  return {
    metas: Object.values(metas)
      .sort((a, b) => a.titulo.localeCompare(b.titulo)),
    órgãos: Object.values(órgãos)
      .map((x) => ({ ...x, pessoas: Object.keys(x.pessoas) }))
      .sort((a, b) => a.sigla.localeCompare(b.sigla)),
    responsáveis: Object.values(responsáveis)
      .map((x) => ({ ...x, órgãos: Object.keys(x.órgãos) }))
      .sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao)),
  };
});

function atualizarFiltro(chave, valor) {
  router.push({
    query: {
      ...route.query,
      [chave]: valor || undefined,
    },
  });
}

if (!route.query.visao) {
  router.replace({
    query: {
      ...route.query,
      visao: 'pessoal',
    },
  });
}

if (!Array.isArray(Metas.value) || !Metas.value.length) {
  MetasStore.getAll();
}

// panoramaStore.buscarTudo();
</script>
<template>
  <Dashboard>
    <header class="flex center mb2 spacebetween g1">
      <TítuloDePágina class="f1">
        Quadro de atividades
      </TítuloDePágina>

      <hr class="f1">

      <nav class="flex g1 flexwrap">
        <router-link
          :to="{ query: { ...$route.query, visao: 'pessoal' } }"
          class="btn bgnone outline ml1"
          :class="{
            tcprimary: $route.query.visao === 'pessoal'
          }"
        >
          Visão pessoal
        </router-link>

        <router-link
          :to="{ query: { ...$route.query, visao: 'geral' } }"
          class="btn bgnone outline ml1"
          :class="{
            tcprimary: $route.query.visao === 'geral'
          }"
        >
          Visão geral
        </router-link>
      </nav>
    </header>

    <pre v-ScrollLockDebug>dadosParaFiltros.responsáveis:
    {{ dadosParaFiltros.responsáveis }}</pre>
    <pre v-ScrollLockDebug>dadosParaFiltros.órgãos:
    {{ dadosParaFiltros.órgãos }}</pre>
    <pre v-ScrollLockDebug>Metas:{{ Metas }}</pre>
    <pre v-ScrollLockDebug>$route.query:{{ $route.query }}</pre>

    <div class="flex flexwrap g2">
      <div class="flex flexwrap f4 g1">
        <div
          class="mb1 f1"
        >
          <Transition name="fade">
            <form
              v-if="$route.query.visao !== 'pessoal'"
              class="mb2"
              @submit.prevent
            >
              <legend class="tprimary mb1 w700 t16">
                Filtros
              </legend>

              <div class="mb1">
                <label
                  for="filtro-de-meta"
                  class="label tc300"
                >Meta</label>
                <select
                  id="filtro-de-meta"
                  :disabled="!dadosParaFiltros.metas.length"
                  class="inputtext light mb1"
                  name="filtro-de-meta"
                  @change="({ target }) => {
                    atualizarFiltro('meta', target.value);
                  }"
                >
                  <option :value="undefined" />
                  <option
                    v-for="item in dadosParaFiltros.metas"
                    :key="item.id"
                    :selected="Number($route.query.meta) === item.id"
                    :value="item.id"
                    :title="item.titulo?.length > 36 ? item.titulo : undefined"
                    :hidden="($route.query.responsavel
                      && !item.pessoas.includes(Number($route.query.responsavel)))
                      || ($route.query.orgao
                        && !item.órgãos.includes(Number($route.query.orgao)))"
                  >
                    {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
                  </option>
                </select>
              </div>
              <div class="mb1">
                <label
                  for="filtro-de-orgao"
                  class="label tc300"
                >Órgão</label>
                <select
                  id="filtro-de-orgao"
                  class="inputtext light mb1"
                  name="filtro-de-orgao"
                  :disabled="!dadosParaFiltros.órgãos.length || $route.query.meta"
                  @change="({ target }) => {
                    atualizarFiltro('orgao', target.value);
                  }"
                >
                  <option :value="undefined" />
                  <option
                    v-for="item in dadosParaFiltros.órgãos"
                    :key="item.id"
                    :selected="Number($route.query.orgao) === item.id"
                    :value="item.id"
                    :hidden="$route.query.responsavel
                      && !item.pessoas.includes($route.query.responsavel)"
                    :title="item.descricao?.length > 36 ? item.descricao : undefined"
                  >
                    {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
                  </option>
                </select>
              </div>
              <div class="mb1">
                <label
                  for="filtro-de-responsavel"
                  class="label tc300"
                >Responsável</label>
                <select
                  id="filtro-de-responsavel"
                  class="inputtext light mb1"
                  name="filtro-de-responsavel"
                  :disabled="!dadosParaFiltros.responsáveis.length || $route.query.meta"
                  @change="({ target }) => {
                    atualizarFiltro('responsavel', target.value);
                  }"
                >
                  <option :value="undefined" />
                  <option
                    v-for="item in dadosParaFiltros.responsáveis"
                    :key="item.id"
                    :selected="Number($route.query.responsavel) === item.id"
                    :value="item.id"
                    :hidden="$route.query.orgao
                      && !item.órgãos.includes($route.query.orgao)"
                  >
                    {{ item.nome_exibicao }}
                  </option>
                </select>
              </div>
            </form>
          </Transition>

          <div class="mb1">
            <h2 class="mb1 w700 t16">
              Legenda
            </h2>
            <dl>
              <div class="flex g1 mb1 center">
                <dt>
                  <svg
                    width="24"
                    height="24"
                    color="#EE3B2B"
                  ><use xlink:href="#i_clock" /></svg>
                </dt>
                <dd class="f2">
                  Conferência
                </dd>
              </div>
              <div class="flex g1 mb1 center">
                <dt>
                  <svg
                    width="24"
                    height="24"
                    color="#EE3B2B"
                  ><use xlink:href="#i_alert" /></svg>
                </dt>
                <dd class="f2">
                  Complementação
                </dd>
              </div>
              <div class="flex g1 mb1 center">
                <dt>
                  <svg
                    width="24"
                    height="24"
                  ><use xlink:href="#i_calendar" /></svg>
                </dt>
                <dd class="f2">
                  Cronograma
                </dd>
              </div>
              <div class="flex g1 mb1 center">
                <dt>
                  <svg
                    width="24"
                    height="24"
                  ><use xlink:href="#i_$" /></svg>
                </dt>
                <dd class="f2">
                  Orçamento
                </dd>
              </div>
              <div class="flex g1 mb1 center">
                <dt>
                  <svg
                    width="24"
                    height="24"
                  ><use xlink:href="#i_iniciativa" /></svg>
                </dt>
                <dd class="f2">
                  Qualificação
                </dd>
              </div>
              <div class="flex g1 mb1 center">
                <dt>
                  <svg
                    width="24"
                    height="24"
                  ><use xlink:href="#i_binoculars" /></svg>
                </dt>
                <dd class="f2">
                  Análise de Risco
                </dd>
              </div>
              <div class="flex g1 mb1 center">
                <dt>
                  <svg
                    width="24"
                    height="24"
                  ><use xlink:href="#i_check" /></svg>
                </dt>
                <dd class="f2">
                  Fechamento
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <EnvelopeDeAbas
          :meta-dados-por-id="dadosExtrasDeAbas"
          nome-da-chave-de-abas="status"
          class="mb1 f4"
        >
          <template #pendentes="{ estáAberta }">
            aba de pendentes
          </template>

          <template #atualizadas="{ estáAberta }">
            aba de atualizadas
          </template>

          <template #atrasadas="{ estáAberta }">
            aba de atrasadas
          </template>
        </EnvelopeDeAbas>
      </div>

      <div class="mb1 card-shadow f1 p15 calendario">
        <h2 class="w400 t20 tc calendario__titulo mb1">
          Setembro
        </h2>

        <dl class="calendario__lista">
          <div class="flex calendario__item center mb1">
            <dt class="f1 t18 tamarelo calendario__intervalo">
              01 - 15
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Coleta de Dados
            </dd>
          </div>
          <div class="flex calendario__item center mb1">
            <dt class="f1 t18 tamarelo calendario__intervalo">
              16 - 19
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Qualificação
            </dd>
          </div>
          <div class="flex calendario__item center mb1">
            <dt class="f1 t18 tamarelo calendario__intervalo">
              20 - 22
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Análise de Risco
            </dd>
          </div>
          <div class="flex calendario__item center mb1">
            <dt class="f1 t18 tamarelo calendario__intervalo">
              23 - 30
            </dt>
            <dd class="f2 t12 w700 tprimary calendario__evento">
              Fechamento
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </Dashboard>
</template>
<style lang="less">
.calendario {}

.calendario__titulo {
  border-bottom: 1px solid @c200;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
}

.calendario__lista {}

.calendario__item {}

.calendario__intervalo {
  display: flex;

  &:after {
    content: '';
    display: block;
    flex-grow: 1;
    border-bottom: 1px solid @c200;
    height: 0;
    margin-top: auto;
    margin-bottom: auto;
    margin-left: 1rem;
  }
}

.calendario__evento {
  display: flex;

  &:before {
    content: '';
    display: block;
    flex-grow: 1;
    border-bottom: 1px solid @c200;
    height: 0;
    margin-top: auto;
    margin-right: 1rem;
    margin-bottom: auto;
  }
}
</style>
