<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePanoramaStore } from '@/stores/panorama.store.ts';

const panoramaStore = usePanoramaStore();
const {
  perfil,
  variáveisPorId,
} = storeToRefs(panoramaStore);

const idsDosItensAbertos = ref([]);

//  atualizadas
//    ponto focal:
//      - todas as conferidas
//    para os outros:
//      - todas as enviadas
const listaDeAtualizadas = computed(() => {
  if (!perfil.value) return [];

  const aUsar = perfil.value === 'ponto_focal'
    ? 'conferidas'
    : 'enviadas';

  return panoramaStore.listaDeAtualizadas.map((x) => ({
    id: x.id,
    código: x.codigo,
    título: x.titulo,
    variáveis: x.variaveis?.[aUsar]?.map((y) => ({
      id: y,
      código: variáveisPorId.value[y]?.codigo || '',
      título: variáveisPorId.value[y]?.titulo || '',
    }))
      .sort((a, b) => a.código.localeCompare(b.código)),
  }));
});
</script>
<template>
  <ul class="uc w700">
    <li
      v-for="meta in listaDeAtualizadas"
      :key="meta.id"
    >
      <input
        :id="`atualizada--${meta.id}`"
        v-model="idsDosItensAbertos"
        type="checkbox"
        :value="meta.id"
        :arial-label="idsDosItensAbertos.includes(meta.id)
          ? `fechar variáveis da meta ${meta.código}`
          : `abrir variáveis da meta ${meta.código}`"
        :title="idsDosItensAbertos.includes(meta.id)
          ? `fechar variáveis da meta ${meta.código}`
          : `abrir variáveis da meta ${meta.código}`"
        :disabled="!meta.variáveis.length"
        class="accordion-opener"
      >
      <label
        :for="`atualizada--${meta.id}`"
        class="block mb1 bgc50 br6 p1 g1 flex center"
      >
        <router-link
          :to="{
            name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
            params: {
              meta_id: meta.id
            }
          }"
        >
          {{ meta.código }} - {{ meta.título }}
        </router-link>
        <small v-ScrollLockDebug>
          (<code>meta.atualizado_em:&nbsp;{{ meta.atualizado_em }}</code>)
        </small>
      </label>
      <Transition
        v-if="meta.variáveis.length"
        name="fade"
      >
        <ul
          v-if="idsDosItensAbertos.includes(meta.id)"
          class="pl2"
        >
          <li
            v-for="variável in meta.variáveis"
            :key="variável.id"
            class="mb1 bgc50 br6 p1 flex start"
          >
            {{ variável.código || variável.id }} - {{ variável.título }}
          </li>
        </ul>
      </Transition>
    </li>
  </ul>
</template>
