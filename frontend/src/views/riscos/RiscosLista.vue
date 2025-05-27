<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import { grauDescricao } from '@back/common/RiscoCalc.ts';
import LocalFilter from '@/components/LocalFilter.vue';
import { risco as schema } from '@/consts/formSchemas';
import statuses from '@/consts/riskStatuses';
import arrayToValueAndLabel from '@/helpers/arrayToValueAndLabel';
import dateToField from '@/helpers/dateToField';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const projetosStore = useProjetosStore();
const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

const riscosStore = useRiscosStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(riscosStore);

const listaDeStatuses = arrayToValueAndLabel(statuses);

const route = useRoute();
const projetoId = route?.params?.projetoId;
const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  riscosStore.$reset();

  await riscosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_risco === statusVisível.value))
));

iniciar();
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Riscos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <div
      v-if="!permissõesDoProjetoEmFoco.apenas_leitura
        || permissõesDoProjetoEmFoco.sou_responsavel"
      class="ml2"
    >
      <router-link
        :to="{ name: 'riscosCriar' }"
        class="btn"
      >
        Novo risco
      </router-link>
    </div>
  </div>

  <div class="flex center mb1 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="f1"
    />
  </div>

  <div class="flex center mb2 spacebetween">
    <div class="f1 mr1">
      <label class="label tc300">Filtrar por grau</label>
      <select
        v-model.number="grauVisível"
        class="inputtext"
        name="grau"
      >
        <option
          :value="0"
        >
          selecionar
        </option>
        <option
          v-for="item, i in grauDescricao"
          :key="i"
          :value="i + 1"
        >
          {{ i + 1 }} - {{ item }}
        </option>
      </select>
    </div>
    <div class="f1">
      <label class="label tc300">Filtrar por status</label>
      <select
        v-model.number="statusVisível"
        class="inputtext"
        name="status"
      >
        <option
          value=""
        >
          selecionar
        </option>
        <option
          v-for="item in listaDeStatuses"
          :key="item.valor"
          :value="item.valor"
        >
          {{ item.etiqueta }}
        </option>
      </select>
    </div>
  </div>

  <table
    v-if="listaFiltrada.length"
    class="tabela-de-etapas"
  >
    <colgroup>
      <col class="col--minimum">
      <col class="col--data">
      <col>
      <col style="width: 8em">
      <col class="col--minimum">
      <col style="width: 8em">
      <col style="width: 9em">
      <col
        v-if="!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel"
        class="col--botão-de-ação"
      >
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th class="tr">
          {{ schema.fields['codigo'].spec.label }}
        </th>
        <th class="cell--data">
          {{ schema.fields['registrado_em'].spec.label }}
        </th>
        <th class="tl">
          Risco
        </th>
        <th class="center">
          Grau
        </th>
        <th class="tr">
          Planos pendentes
        </th>
        <th class="tl">
          Resposta indicada
        </th>
        <th class="tl">
          Status
        </th>
        <th
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
        />
      </tr>
    </thead>

    <tbody
      v-for="linha in listaFiltrada"
      :key="linha.id"
      class="tabela-de-etapas__item"
    >
      <tr
        class="t13"
      >
        <td class="cell--number">
          {{ linha.codigo }}
        </td>
        <td class="cell--data">
          {{ dateToField(linha.registrado_em) }}
        </td>
        <th>
          <router-link
            :to="{
              name: 'planosDeAçãoListar',
              params: {
                riscoId: linha.id
              }
            }"
          >
            {{ linha.titulo }}
          </router-link>
        </th>
        <td class="center">
          <span
            class="etiqueta"
            :class="`etiqueta--alerta__peso-${linha.grau}`"
          >
            {{ linha.grau }}
            <template v-if="linha.grau">
              - {{ grauDescricao[linha.grau - 1] }}
            </template>
          </span>
        </td>
        <td
          class="cell--number"
          :class="{
            tvermelho: linha.planos_de_acao_sem_dt_term?.length
          }"
        >
          {{ linha.planos_de_acao_sem_dt_term?.length || '-' }}
        </td>
        <td class="center">
          {{ linha.resposta }}
        </td>
        <td class="center">
          {{ statuses[linha.status_risco] }}
        </td>
        <td
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
          class="center"
        >
          <router-link
            :to="{
              name: 'riscosEditar',
              params: {
                projetoId: projetoId,
                riscoId: linha.id,
              }
            }"
            title="Editar risco"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
    </tbody>
  </table>

  <span
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
