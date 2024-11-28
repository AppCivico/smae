<script setup>
import FeedbackEmptyList from '@/components/FeedbackEmptyList.vue';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePanoramaStore } from '@/stores/panorama.store.ts';

const panoramaStore = usePanoramaStore();
const {
  perfil,
  variáveisPorId,
  chamadasPendentes,
} = storeToRefs(panoramaStore);
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

    riscoEnviado: x.risco_enviado,
    fechamentoEnviado: x.fechamento_enviado,
    analiseQualitativaEnviada: x.analise_qualitativa_enviada,

    atualizadoEm: x.atualizado_em,

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
  <Transition name="fade">
    <LoadingComponent v-if="chamadasPendentes.lista" />

    <FeedbackEmptyList
      v-else-if="!listaDeAtualizadas.length"
      tipo="negativo"
      título="Você ainda não possui atividades atualizadas!"
      mensagem="Complete pendências para visualiza-las aqui."
    />
    <ul
      v-else
      class="uc w700"
    >
      <li
        v-for="meta in listaDeAtualizadas"
        :key="meta.id"
      >
        <span
          class="block mb1 bgc50 br6 p1 g1 flex center"
        >
          <template v-if="perfil !== 'ponto_focal' && meta.variáveis?.length">
            <span
              v-if="meta.analiseQualitativaEnviada !== null"
              class="f0 tipinfo"
            >
              <svg
                class="meta__icone"
                :color="meta.analiseQualitativaEnviada
                  ? '#8ec122'
                  : '#ee3b2b'"
                width="24"
                height="24"
              ><use xlink:href="#i_iniciativa" /></svg><div>Qualificação</div>
            </span>
            <span
              v-if="meta.riscoEnviado !== null"
              class="f0 tipinfo"
            >
              <svg
                class="meta__icone"
                :color="meta.riscoEnviado
                  ? '#8ec122'
                  : '#ee3b2b'"
                width="24"
                height="24"
              ><use xlink:href="#i_binoculars" /></svg><div>Análise de Risco</div>
            </span>
            <span
              v-if="meta.fechamentoEnviado !== null"
              class="f0 tipinfo"
            >
              <svg
                class="meta__icone"
                :color="meta.fechamentoEnviado
                  ? '#8ec122'
                  : '#ee3b2b'"
                width="24"
                height="24"
              ><use xlink:href="#i_check" /></svg><div>Fechamento</div>
            </span>
          </template>
          <router-link
            v-if="meta.variáveis?.length"
            :to="{
              name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
              params: {
                meta_id: meta.id
              }
            }"
          >
            {{ meta.código }} - {{ meta.título }}
          </router-link>
          <span v-else>{{ meta.código }} - {{ meta.título }}</span>
          <small
            v-if="meta.atualizadoEm"
            v-ScrollLockDebug
          >
            (<code>meta.atualizado_em:&nbsp;{{ meta.atualizadoEm }}</code>)
          </small>
        </span>
      </li>
    </ul>
  </Transition>
</template>
