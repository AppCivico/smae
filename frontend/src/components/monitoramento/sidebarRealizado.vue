<script setup>
import { default as modalComplementacao } from '@/components/monitoramento/modalComplementacao.vue';
import { default as modalRealizado } from '@/components/monitoramento/modalRealizado.vue';
import {
  useAlertStore, useAuthStore, useCiclosStore, useEditModalStore, useSideBarStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const SideBarStore = useSideBarStore();
const alertStore = useAlertStore();
const editModalStore = useEditModalStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const { meta_id } = route.params;

const pr = defineProps(['props']);
const { props } = pr;

const CiclosStore = useCiclosStore();
const { SingleAnalise } = storeToRefs(CiclosStore);

async function getAnaliseData() {
  await CiclosStore.getAnalise(props.var_id, props.periodo);
}
getAnaliseData();

function dateToTitle(d) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const month = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][dd.getUTCMonth()];
  const year = dd.getUTCFullYear();
  return `${month} ${year}`;
}
function dateToDate(d) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';
  return dx || '';
}
function vazio(s) {
  return s || '-';
}
async function conferir() {
  try {
    const r = await CiclosStore.conferir({ variavel_id: props.var_id, data_valor: props.periodo });
    if (r == true) {
      SideBarStore.clear();
      alertStore.success('Variável conferida');
      CiclosStore.getMetaVars(meta_id);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
function solicitarComplementacao() {
  SideBarStore.clear();
  editModalStore.clear();
  editModalStore.modal(modalComplementacao, {
    parent: props.parent, var_id: props.var_id, periodo: props.periodo, checkClose: props.checkClose,
  });
}
function complementar() {
  SideBarStore.clear();
  editModalStore.clear();
  editModalStore.modal(modalRealizado, {
    parent: props.parent, var_id: props.var_id, periodo: props.periodo, checkClose: props.checkClose,
  });
}

</script>
<template>
  <template v-if="SingleAnalise?.variavel">
    <div class="label tamarelo mb1">
      {{ props.parent.atividade?`Indicador da atividade ${props.parent.atividade.codigo} ${props.parent.atividade.titulo}`:props.parent.iniciativa?`Indicador da iniciativa ${props.parent.iniciativa.codigo} ${props.parent.iniciativa.titulo}`:'Indicador da Meta' }}
    </div>
    <div class="flex center mb2">
      <svg
        class="f0 tlaranja mr1"
        style="flex-basis: 2rem;"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      ><use :xlink:href="`#i_${props.parent.atividade?'atividade':props.parent.iniciativa?'iniciativa':'indicador'}`" /></svg>
      <div class="t20">
        <strong>{{ props.parent.indicador.codigo }} {{ props.parent.indicador.titulo }}</strong>
      </div>
    </div>

    <div class="t20">
      <strong>{{ SingleAnalise.variavel.codigo }} {{ SingleAnalise.variavel.titulo }}</strong>
    </div>
    <div class="t20 mb2">
      {{ dateToTitle(props.periodo) }}
    </div>

    <template v-if="SingleAnalise.ultimoPedidoComplementacao&&!SingleAnalise.ultimoPedidoComplementacao.atendido">
      <div class="complementacao mb2">
        <div class="w700 t13 mb1">
          Solicitação de complementação
        </div>
        <p>{{ SingleAnalise.ultimoPedidoComplementacao.pedido }}</p>
        <div class="t12 tc600">
          {{ dateToDate(SingleAnalise.ultimoPedidoComplementacao.criado_em) }}, {{ SingleAnalise.ultimoPedidoComplementacao.criador.nome_exibicao }}
        </div>
      </div>
    </template>

    <div class="flex g2 mb2">
      <div>
        <div class="t12 uc w700 tc200">
          Projetado
        </div>
        <div class="t13">
          {{ vazio(SingleAnalise.series[SingleAnalise.ordem_series.indexOf('Previsto')].valor_nominal) }}
        </div>
      </div>
      <div>
        <div class="t12 uc w700 tc200">
          Projetado Acumulado
        </div>
        <div class="t13">
          {{ vazio(SingleAnalise.series[SingleAnalise.ordem_series.indexOf('PrevistoAcumulado')].valor_nominal) }}
        </div>
      </div>
    </div>
    <div class="flex g2 mb2">
      <div>
        <div class="t12 uc w700 tc200">
          Realizado
        </div>
        <div class="t13">
          {{ vazio(SingleAnalise.series[SingleAnalise.ordem_series.indexOf('Realizado')].valor_nominal) }}
        </div>
      </div>
      <div v-if="SingleAnalise.variavel.acumulativa">
        <div class="t12 uc w700 tc200">
          Realizado Acumulado
        </div>
        <div class="t13">
          {{ vazio(SingleAnalise.series[SingleAnalise.ordem_series.indexOf('RealizadoAcumulado')].valor_nominal) }}
        </div>
      </div>
    </div>

    <div class="mb2">
      <div class="t12 uc w700 mb05 tc200">
        Análise
      </div>
      <div
        v-for="a in SingleAnalise.analises"
        :key="a.id"
        class="mb1"
      >
        <hr class="mb05">
        <div class="mb05">
          {{ vazio(a.analise_qualitativa) }}
        </div>
        <div class="t12 tc300">
          {{ dateToDate(a.criado_em) }}, {{ a.criador.nome_exibicao }}
        </div>
      </div>
    </div>

    <hr class="mt2 mb2">
    <table class="tablemain mb2 pl0">
      <thead>
        <tr>
          <th style="width: 30%">
            Documento comprobatório
          </th>
          <th style="width: 70%">
            Descrição
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="SingleAnalise.arquivos.length">
          <tr
            v-for="subitem in SingleAnalise.arquivos"
            :key="subitem.id"
          >
            <td>
              <a
                :href="baseUrl+'/download/'+subitem?.arquivo?.download_token"
                download
              >{{ vazio(subitem?.arquivo?.nome_original) }}</a>
            </td>
            <td>
              <a
                :href="baseUrl+'/download/'+subitem?.arquivo?.download_token"
                download
              >{{ vazio(subitem?.arquivo?.descricao) }}</a>
            </td>
          </tr>
        </template>
        <tr v-else>
          <td colspan="60">
            Nenhum arquivo adicionado
          </td>
        </tr>
      </tbody>
    </table>

    <div class="flex center">
      <a
        v-if="perm.PDM?.admin_cp || perm.PDM?.tecnico_cp"
        class="btn mr1"
        @click="conferir"
      >Conferir</a>
      <a
        v-if="perm.PDM?.admin_cp || perm.PDM?.tecnico_cp"
        class="btn mr1 outline bgnone tcprimary"
        @click="solicitarComplementacao"
      >Solicitar{{ SingleAnalise.ultimoPedidoComplementacao?' nova':'' }} complementação</a>
      <a
        v-if="SingleAnalise.ultimoPedidoComplementacao && !SingleAnalise.ultimoPedidoComplementacao.atendido"
        class="btn "
        @click="complementar"
      >Complementar</a>
    </div>
  </template>
  <template v-if="SingleAnalise?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="SingleAnalise?.error||error">
    <div class="error p1">
      <div class="error-msg">
        {{ SingleAnalise.error??error }}
      </div>
    </div>
  </template>
</template>
