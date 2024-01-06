<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { acompanhamento as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const acompanhamentosStore = useAcompanhamentosStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(acompanhamentosStore);

const route = useRoute();
const projetoId = route?.params?.projetoId;
const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  acompanhamentosStore.$reset();

  await acompanhamentosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_acompanhamento === statusVisível.value))
));

iniciar();
</script>
<template>
  <!-- eslint-disable-next-line max-len -->
  <!-- eslint-disable vue/multiline-html-element-content-newline
vue/singleline-html-element-content-newline -->
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Acompanhamentos
    </TítuloDePágina>

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
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
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
      <col class="col--botão-de-ação">
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th>
          {{ schema.fields.data_registro.spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields.acompanhamento_tipo_id.spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields.pauta.spec.label }}
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
        <th>
          <router-link
            :to="{
              name: 'acompanhamentosResumo',
              params: {
                projetoId: projetoId,
                acompanhamentoId: linha.id,
              }
            }"
          >
            {{ dateToField(linha.data_registro) }}
          </router-link>
        </th>
        <td>
          {{ linha.acompanhamento_tipo?.nome ? linha.acompanhamento_tipo.nome : '-' }}
        </td>
        <td>
          {{ linha.pauta }}
        </td>
        <td class="center">
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
