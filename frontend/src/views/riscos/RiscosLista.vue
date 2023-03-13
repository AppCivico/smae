<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import riskLevels from '@/consts/riskLevels';
import statuses from '@/consts/riskStatuses';
import arrayToValueAndLabel from '@/helpers/arrayToValueAndLabel';
import dateToField from '@/helpers/dateToField';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const projetosStore = useProjetosStore();
const riscosStore = useRiscosStore();

const {
  emFoco: projetoEmFoco,
} = storeToRefs(projetosStore);
const {
  chamadasPendentes, erro,
} = storeToRefs(riscosStore);

const listaDeStatuses = arrayToValueAndLabel(statuses);

const projetoId = useRoute()?.params?.projetoId;

const termoDeBusca = ref('');
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  riscosStore.$reset();

  await riscosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? riscosStore.listaFiltradaPor(termoDeBusca.value)
  : riscosStore.listaFiltradaPor(termoDeBusca.value)
    .filter((x) => x.grau === grauVisível.value || x.status === statusVisível.value)));

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Risco' }}</h1>
    <hr class="ml2 f1">

    <div
      v-if="projetoEmFoco?.eh_prioritario"
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
      v-model="termoDeBusca"
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
          value=""
          :selected="!grauVisível"
        >
          qualquer
        </option>
        <option
          v-for="item, i in riskLevels"
          :key="i"
          :value="i + 1"
          :selected="grauVisível === i"
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
          :selected="!!status"
        >
          qualquer
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
      <col>
      <col class="col--data">
      <col>
      <col style="width: 6em">
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th class="tl">
          Código
        </th>
        <th class="cell--data">
          Registrado em
        </th>
        <th>
          Risco
        </th>
        <th class="center">
          Grau
        </th>
        <th>
          Resposta indicada
        </th>
        <th>
          Status
        </th>
        <th />
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
        <td>
          {{ linha.codigo }}
        </td>
        <td class="cell--data">
          {{ dateToField(linha.registrado_em) }}
        </td>
        <th>
          {{ linha.consequencia }}
        </th>
        <td class="center">
          <span
            class="etiqueta"
            :class="`etiqueta--alerta__peso-${linha.grau}`"
          >
            {{ linha.grau }}
            <template v-if="linha.grau">
              - {{ riskLevels[linha.grau] }}
            </template>
          </span>
        </td>
        <td>
          {{ linha.resposta }}
        </td>
        <td>
          {{ linha.status }}
        </td>
        <td
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
