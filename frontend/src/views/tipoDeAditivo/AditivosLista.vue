<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import schema from '@/consts/formSchemas/buscaLivre';
import filtrarObjetos from '@/helpers/filtrarObjetos';
import { useAlertStore } from '@/stores/alert.store';
import { useTipoDeAditivosStore } from '@/stores/tipoDeAditivos.store';

const route = useRoute();

const alertStore = useAlertStore();
const aditivosStore = useTipoDeAditivosStore();
const { lista } = storeToRefs(aditivosStore);

async function excluirAditivo(item) {
  if (await aditivosStore.excluirItem(item.id)) {
    aditivosStore.$reset();
    aditivosStore.buscarTudo();
    alertStore.success(`"${item.nome}" removido.`);
  }
}

aditivosStore.$reset();
aditivosStore.buscarTudo();

const tiposFiltrados = computed(() => (
  filtrarObjetos(lista.value, route.query.palavra_chave)
));

</script>
<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: 'tipoDeAditivos.criar' }"
        class="btn big ml1"
      >
        Novo aditivo
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <FiltroParaPagina
    :schema="schema"
    :formulario="[{
      campos: {
        palavra_chave: {
          tipo: 'search',
        },
      }
    }]"
    auto-submit
  />

  <SmaeTable
    :dados="tiposFiltrados"
    :colunas="[
      { chave: 'nome', label: 'nome' },
      { chave: 'tipo', label: 'tipo' },
    ]"
    :rota-editar="({ id }) => ({ name: 'tipoDeAditivos.editar', params: { aditivoId: id } })"
    parametro-no-objeto-para-excluir="nome"
    @deletar="excluirAditivo"
  />
</template>
