<script setup>
import { usePdMStore } from '@/stores/pdm.store';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const PdMStore = usePdMStore();

if (!PdMStore.PdM.length) {
  PdMStore.getAll().then(() => {
    const currentPdM = PdMStore.PdM.find((x) => !!x.ativo);
    if (currentPdM?.id && !route.query.pdm_id) {
      router.replace({
        name: route.name,
        query: { pdm_id: currentPdM?.id },
      });
    }
  });
}
</script>
<template>
  <div
    v-bind="$attrs"
    class="flex spacebetween center mb2"
  >
    <h1>
      {{ typeof $route?.meta?.título === 'function'
        ? $route.meta.título()
        : $route?.meta?.título || 'Projetos' }}
    </h1>
    <hr class="ml2 f1">
    <router-link
      :to="{
        name: 'EnviosOrçamentosMetasNovo',
        query: $route.query
      }"
      class="btn big ml1"
    >
      Enviar arquivo
    </router-link>
  </div>

  <router-view v-slot="{ Component }">
    <component :is="Component">
      <template #filtro>
        <div class="f1">
          <label
            for="pdm_id"
            class="label"
          >
            <abbr title="Programa de metas">PdM</abbr>&nbsp;<span
              class="tvermelho"
            >*</span>
          </label>
          <select
            id="pdm_id"
            name="pdm_id"
            class="inputtext light mb1"
            :value="$route.query.pdm_id"
            :class="{
              loading: PdMStore.PdM?.loading
            }"
            :disabled="PdMStore.PdM?.loading"
            @change="($event) => $router.push({
              name: $route.name,
              query: { pdm_id: $event.target.value || undefined }
            })"
          >
            <option
              v-for="item in PdMStore.PdM"
              :key="item.id"
              :value="item.id"
              :selected="item.id == $route.query.pdm_id"
            >
              {{ item.nome }}
            </option>
          </select>
        </div>

        <hr class="ml1 mr1 f1">
      </template>
    </component>
  </router-view>
</template>
