<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { acompanhamento as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const riscosStore = useRiscosStore();

const acompanhamentosStore = useAcompanhamentosStore();
const {
  chamadasPendentes, erro,
} = storeToRefs(acompanhamentosStore);

const route = useRoute();
const projetoId = route?.params?.projetoId;

const termoDeBusca = ref('');
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  acompanhamentosStore.$reset();

  await acompanhamentosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? acompanhamentosStore.listaFiltradaPor(termoDeBusca.value)
  : acompanhamentosStore.listaFiltradaPor(termoDeBusca.value)
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_acompanhamento === statusVisível.value))
));

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      {{ typeof route?.meta?.título === 'function'
        ? route.meta.título()
        : route?.meta?.título
        || 'Acompanhamentos' }}
    </h1>
    <hr class="ml2 f1">

    <div class="ml2">
      <router-link
        :to="{ name: 'acompanhamentosCriar' }"
        class="btn"
      >
        Novo registro de acompanhamento
      </router-link>
    </div>
  </div>

  <div class="flex center mb1 spacebetween">
    <LocalFilter
      v-model="termoDeBusca"
      class="f1"
    />
  </div>

  <table
    v-if="listaFiltrada.length"
    class="tabela-de-etapas"
  >
    <colgroup>
      <col class="col--data">
      <col>
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th>
          {{ schema.fields['data_registro'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['participantes'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['detalhamento'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['encaminhamento'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['responsavel'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['risco'].spec.label }}
        </th>
        <th />
      </tr>
    </thead>

    <tbody
      v-for="linha in listaFiltrada"
      :key="linha.id"
      class="tablemain"
    >
      <tr>
        <td>
          {{ dateToField(linha.data_registro) }}
        </td>
        <td>
          {{ linha.participantes }}
        </td>
        <td>
          {{ linha.detalhamento }}
        </td>
        <td>
          {{ linha.encaminhamento }}
        </td>
        <td>
          {{ linha.responsavel }}
        </td>
        <td>
          <router-link
            v-for="item, k in linha.risco"
            :key="k"
            :to="{
              name: 'planosDeAçãoListar',
              params: {
                riscoId: item.id
              }
            }"
          >
            {{ riscosStore.riscosPorId[item.id]?.codigo }},
          </router-link>
        </td>
        <td
          class="center"
        >
          <router-link
            :to="{
              name: 'acompanhamentosEditar',
              params: {
                projetoId: projetoId,
                acompanhamentoId: linha.id,
              }
            }"
            title="Editar acompanhamento"
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
