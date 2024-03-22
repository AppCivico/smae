<script setup>
import { Dashboard } from '@/components';
import { useDashboardStore } from '@/stores/dashboard.store.ts';
import { iframeResize } from 'iframe-resizer';
import { storeToRefs } from 'pinia';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const dashboardStore = useDashboardStore();

const {
  chamadasPendentes, erro, lista, dashboardEmFoco, endereçoParaIframe,
} = storeToRefs(dashboardStore);

const props = defineProps({
  opção: {
    type: Number,
    default: 0,
  },
  id: {
    type: Number,
    default: 0,
  },
});

async function iniciar() {
  if (!lista.value.length) {
    dashboardStore.$reset();
    await dashboardStore.buscarTudo();
  }
  const primeiroId = lista.value[0]?.id;
  const primeiraOpção = dashboardEmFoco.value?.opcoes?.[0]?.id;

  if (!props.id || (primeiraOpção && !props.opção)) {
    if (primeiroId) {
      router.replace({
        query: {
          ...route.query,
          id: route.query.id || primeiroId,
          opcao: primeiraOpção,
        },
      });
    }
  }
}

onBeforeRouteLeave(() => {
  dashboardStore.$reset();
});

iniciar();
</script>
<template>
  <Dashboard class="dashboard--analise">
    <div class="flex spacebetween center flexwrap">
      <header>
        <TítuloDePágina>
          Análise
        </TítuloDePágina>
      </header>
    </div>

    <div class="flex center mb2 spacebetween">
      <div
        v-if="Array.isArray(dashboardEmFoco?.opcoes)"
        class="f1 mr1"
      >
        <label class="label tc300">
          {{ dashboardEmFoco?.opcoes_titulo || 'Opções' }}
        </label>

        <select
          class="inputtext"
          @change="($event) => router.push({
            query: {
              ...$route.query,
              opcao: $event.target.value || undefined
            }

          })"
        >
          <option
            value=""
            :selected="!props.opção"
          >
            selecionar
          </option>
          <option
            v-for="item in dashboardEmFoco.opcoes"
            :key="item.id"
            :value="item.id"
            :selected="props.opção === item.id"
          >
            {{ item.titulo }}
          </option>
        </select>
      </div>

      <hr class="ml2 f1">

      <router-link
        v-for="item in lista"
        :key="item.id"
        :to="{
          name: 'análises',
          query: {
            ...$route.query,
            id: item.id,
            opcao: undefined,
          },
        }"
        class="btn bgnone outline ml1 mb1"
      >
        {{ item.titulo }}
      </router-link>
    </div>

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>

    <div
      v-if="chamadasPendentes?.lista"
      class="iframe-placeholder loading"
    >
      Carregando
    </div>

    <iframe
      v-else-if="endereçoParaIframe"
      :src="endereçoParaIframe"
      frameborder="0"
      allowtransparency
      @load="iframeResize($event.target)"
    />
  </Dashboard>
</template>
<style lang="css">
.dashboard--analise {
  display: flex;
  flex-direction: column;
}
</style>

<style lang="css" scoped>
iframe {
  min-width: 100%;
  flex-grow: 1;
}

.iframe-placeholder {
  margin-right: auto;
  margin-left: auto;
  width: max-content;
  padding-right: 2.5em;
}
</style>
