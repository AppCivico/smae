<script setup>
import {
  useAtividadesStore,
  useIniciativasStore, useMetasStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

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

const groupBy = localStorage.getItem('groupBy') ?? 'macro_tema';
let groupByRoute;

switch (groupBy) {
  case 'macro_tema':
    groupByRoute = 'macrotemas';
    break;
  case 'tema':
    groupByRoute = 'temas';
    break;
  case 'sub_tema':
    groupByRoute = 'subtemas';
    break;
  default:
    console.error(`Valor inválido salvo em \`localStorage.getItem('groupBy')\`:${localStorage.getItem('groupBy')}`);
    break;
}
</script>

<template>
  <nav class="migalhas-de-pão migalhas-de-pão--metas">
    <ul class="migalhas-de-pão__lista">
      <li
        v-if="activePdm.id"
        class="migalhas-de-pão__item"
      >
        <router-link
          class="migalhas-de-pão__link"
          to="/metas"
        >
          {{ activePdm.nome }}
        </router-link>
      </li>
      <li
        v-if="meta_id && activePdm.id && activePdm['possui_' + groupBy] && singleMeta[groupBy]"
        class="migalhas-de-pão__item"
      >
        <router-link
          :to="`/metas/${groupByRoute}/${singleMeta[groupBy]?.id}`"
          class="migalhas-de-pão__link"
        >
          {{ activePdm['rotulo_' + groupBy] }} {{ singleMeta[groupBy]?.descricao }}
        </router-link>
      </li>
      <li
        v-if="meta_id && singleMeta.id"
        class="migalhas-de-pão__item"
      >
        <router-link
          :to="`/metas/${meta_id}`"
          class="migalhas-de-pão__link"
        >
          Meta {{ singleMeta?.codigo }} {{ singleMeta?.titulo }}
        </router-link>
      </li>

      <li
        v-if="iniciativa_id && activePdm.possui_iniciativa && singleIniciativa.id"
        class="migalhas-de-pão__item"
      >
        <router-link
          :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}`"
          class="migalhas-de-pão__link"
        >
          {{ activePdm.rotulo_iniciativa }}
          {{ singleIniciativa?.codigo }}
          {{ singleIniciativa?.titulo }}
        </router-link>
      </li>

      <li
        v-if="atividade_id && activePdm.possui_atividade && singleAtividade.id"
        class="migalhas-de-pão__item"
      >
        <router-link
          :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/${atividade_id}`"
          class="migalhas-de-pão__link"
        >
          {{ activePdm.rotulo_atividade }}
          {{ singleAtividade?.codigo }}
          {{ singleAtividade?.titulo }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>
