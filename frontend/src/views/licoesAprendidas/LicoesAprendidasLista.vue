<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { liçãoAprendida as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const licoesaprendidasStore = useLiçõesAprendidasStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(licoesaprendidasStore);

const route = useRoute();
const projetoId = route?.params?.projetoId;

const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  licoesaprendidasStore.$reset();

  await licoesaprendidasStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_licoesaprendida === statusVisível.value))
));

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      {{ typeof route?.meta?.título === 'function'
        ? route.meta.título()
        : route?.meta?.título
        || 'LicoesAprendidas' }}
    </h1>
    <hr class="ml2 f1">

    <div class="ml2">
      <router-link
        :to="{ name: 'liçõesAprendidasCriar' }"
        class="btn"
      >
        Nova lição aprendida
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
      <col class="col--minimum">
      <col class="col--data">
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th />
        <th class="tl">
          {{ schema.fields['data_registro'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['contexto'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['responsavel'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['observacao'].spec.label }}
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
        <td class="cell--number">
          {{ linha.sequencial }}
        </td>
        <td class="cell--data">
            <router-link
            :to="{
              name: 'liçõesAprendidasResumo',
              params: {
                projetoId: projetoId,
                licaoAprendidaId: linha.id,
              }
            }"
            >
            {{ dateToField(linha.data_registro) }}
            </router-link>
        </td>
        <th>
          {{ linha.contexto }}
        </th>
        <td>
          {{ linha.responsavel }}
        </td>
        <td>
          {{ linha.observacao }}
        </td>
        <td
          class="center"
        >
          <router-link
            :to="{
              name: 'liçõesAprendidasEditar',
              params: {
                projetoId: projetoId,
                licaoAprendidaId: linha.id,
              }
            }"
            title="Editar licoesaprendida"
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
