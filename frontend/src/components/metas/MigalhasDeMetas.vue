<script setup>
import rotasDosNiveisDeMetas from '@/consts/rotasDosNiveisDeMetas';
import {
  useAtividadesStore,
  useIniciativasStore,
  useMetasStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);
const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const groupBy = localStorage.getItem('groupBy') ?? 'todas';

const metaId = computed(() => {
  const id = Number(route.params.meta_id);
  return Number.isNaN(id) ? undefined : id;
});
const iniciativaId = computed(() => {
  const id = Number(route.params.iniciativa_id);
  return Number.isNaN(id) ? undefined : id;
});
const atividadeId = computed(() => {
  const id = Number(route.params.atividade_id);
  return Number.isNaN(id) ? undefined : id;
});

watchEffect(() => {
  if (metaId.value && singleMeta.value.id !== metaId.value) {
    MetasStore.getById(metaId.value);
  }

  if (metaId.value && !activePdm.value?.id) {
    MetasStore.getPdM();
  }

  if (
    iniciativaId.value
    && singleIniciativa.value.id !== iniciativaId.value
    && !singleIniciativa.value.loading
  ) {
    IniciativasStore.getByIdReal(iniciativaId.value);
  }
  if (
    atividadeId.value
    && singleAtividade.value.id !== atividadeId.value
    && !singleAtividade.value.loading
  ) {
    AtividadesStore.getByIdReal(atividadeId.value);
  }
});
</script>
<template>
  <nav class="migalhas-de-pão migalhas-de-pão--metas">
    <ul class="migalhas-de-pão__lista">
      <li
        v-if="activePdm?.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          class="migalhas-de-pão__link"
          to="/metas"
        >
          {{ activePdm?.nome }}
        </SmaeLink>
      </li>
      <template v-if="metaId && activePdm?.id">
        <template
          v-for="item in Object.values(rotasDosNiveisDeMetas)"
          :key="item.nível"
        >
          <li
            v-if="activePdm['possui_' + item.nível]
              && singleMeta[item.nível]
              && [item.nível, 'todas'].includes(groupBy)
            "
            class="migalhas-de-pão__item"
          >
            <SmaeLink
              :to="`/metas/${item.segmento}/${singleMeta[item.nível]?.id}`"
              class="migalhas-de-pão__link"
            >
              {{ activePdm['rotulo_' + item.nível] }} {{ singleMeta[item.nível]?.descricao }}
            </SmaeLink>
          </li>
        </template>
      </template>
      <li
        v-if="metaId && singleMeta.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          :to="`/metas/${metaId}`"
          class="migalhas-de-pão__link"
        >
          Meta {{ singleMeta?.codigo }} {{ singleMeta?.titulo }}
        </SmaeLink>
      </li>

      <li
        v-if="iniciativaId && activePdm?.possui_iniciativa && singleIniciativa.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          :to="`/metas/${metaId}/iniciativas/${iniciativaId}`"
          class="migalhas-de-pão__link"
        >
          {{ activePdm?.rotulo_iniciativa }}
          {{ singleIniciativa?.codigo }}
          {{ singleIniciativa?.titulo }}
        </SmaeLink>
      </li>

      <li
        v-if="atividadeId && activePdm?.possui_atividade && singleAtividade.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          :to="`/metas/${metaId}/iniciativas/${iniciativaId}/atividades/${atividadeId}`"
          class="migalhas-de-pão__link"
        >
          {{ activePdm?.rotulo_atividade }}
          {{ singleAtividade?.codigo }}
          {{ singleAtividade?.titulo }}
        </SmaeLink>
      </li>
    </ul>
  </nav>
</template>
