<script setup>
import rotasDosNiveisDeMetas from '@/consts/rotasDosNiveisDeMetas';
import {
  useAtividadesStore,
  useIniciativasStore, useMetasStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useCounterStore } from '@/stores/counter.store';

const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);
if (meta_id && singleMeta.value.id != meta_id) MetasStore.getById(meta_id);
if (meta_id && !activePdm.value.id) MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if (iniciativa_id && singleIniciativa.value.id != iniciativa_id) {
  IniciativasStore.getById(meta_id, iniciativa_id);
}

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if (atividade_id && singleAtividade.value.id != atividade_id) {
  AtividadesStore.getById(iniciativa_id, atividade_id);
}

const groupBy = localStorage.getItem('groupBy') ?? 'todas';

const b = useCounterStore('b');

const { count: countB } = storeToRefs(b);
</script>
<template>
  <nav class="migalhas-de-pão migalhas-de-pão--metas">
    <ul class="migalhas-de-pão__lista">
      <li
        v-if="activePdm.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          class="migalhas-de-pão__link"
          to="/metas"
        >
          {{ activePdm.nome }}
        </SmaeLink>
      </li>
      <template v-if="meta_id && activePdm.id">
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
        v-if="meta_id && singleMeta.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          :to="`/metas/${meta_id}`"
          class="migalhas-de-pão__link"
        >
          Meta {{ singleMeta?.codigo }} {{ singleMeta?.titulo }}
        </SmaeLink>
      </li>

      <li
        v-if="iniciativa_id && activePdm.possui_iniciativa && singleIniciativa.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}`"
          class="migalhas-de-pão__link"
        >
          {{ activePdm.rotulo_iniciativa }}
          {{ singleIniciativa?.codigo }}
          {{ singleIniciativa?.titulo }}
        </SmaeLink>
      </li>

      <li
        v-if="atividade_id && activePdm.possui_atividade && singleAtividade.id"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/${atividade_id}`"
          class="migalhas-de-pão__link"
        >
          {{ activePdm.rotulo_atividade }}
          {{ singleAtividade?.codigo }}
          {{ singleAtividade?.titulo }}
        </SmaeLink>
      </li>
    </ul>
  </nav>

  <div class="flex g2">
    <button
      type="button"
      class="f1"
      @click="b.increment()"
    >
      Increment B
    </button>
  </div>

  <pre>countB@MigalhasDeMetas.vue: {{ countB }}</pre>
</template>
