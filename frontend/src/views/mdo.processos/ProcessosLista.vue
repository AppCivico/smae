<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { processo as schema } from '@/consts/formSchemas';
import formatProcesso from '@/helpers/formatProcesso';
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { useProcessosStore } from '@/stores/processos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

const processosStore = useProcessosStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(processosStore);

const obrasStore = useObrasStore();

const {
  permissõesDaObraEmFoco,
} = storeToRefs(obrasStore);

const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  processosStore.$reset();

  await processosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_processo === statusVisível.value))
));

function excluirProcesso(id, nome) {
  alertStore.confirmAction(`Deseja mesmo remover "${formatProcesso(nome)}"?`, async () => {
    if (await useProcessosStore().excluirItem(id)) {
      alertStore.success('Processo removido.');

      await processosStore.buscarTudo();
    }
  }, 'Remover');
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Processos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <div class="ml2">
      <router-link
        v-if="!permissõesDaObraEmFoco.apenas_leitura
          || permissõesDaObraEmFoco.sou_responsavel"
        :to="{ name: 'processosDaObraCriar' }"
        class="btn"
      >
        Novo processo
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
      <col>
      <col class="col--minimum">
      <col
        v-if="!permissõesDaObraEmFoco.apenas_leitura
          || permissõesDaObraEmFoco.sou_responsavel"
        class="col--botão-de-ação"
      >
      <col
        v-if="!permissõesDaObraEmFoco.apenas_leitura
          || permissõesDaObraEmFoco.sou_responsavel"
        class="col--botão-de-ação"
      >
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th class="tl">
          {{ schema.fields['processo_sei'].spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields['descricao'].spec.label }}
        </th>
        <th class="center">
          {{ schema.fields['link'].spec.label }}
        </th>
        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />        <th
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
        />
      </tr>
    </thead>

    <tbody
      v-for="linha in listaFiltrada"
      :key="linha.id"
      class="tablemain"
    >
      <tr>
        <td class="cell--number">
          <router-link
            :to="{
              name: 'processosDaObraResumo',
              params: {
                obraId: obraId,
                processoId: linha.id,
              }
            }"
          >
            {{ formatProcesso(linha.processo_sei) }}
          </router-link>
        </td>
        <th>
          {{ linha.descricao }}
        </th>
        <td class="center cell--minimum">
          <a
            v-if="!!linha.link"
            :href="linha.link"
            target="_blank"
          >
            link processo
          </a>
        </td>
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
          class="center"
        >
          <router-link
            v-if="linha.categoria === 'Manual'"
            :to="{
              name: 'processosDaObraEditar',
              params: {
                obraId: obraId,
                processoId: linha.id,
              }
            }"
            title="Editar processo"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td
          v-if="!permissõesDaObraEmFoco.apenas_leitura
            || permissõesDaObraEmFoco.sou_responsavel"
          class="center"
        >
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirProcesso(linha.id, linha.processo_sei)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
    </tbody>
  </table>

  <div
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
