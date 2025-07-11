<script setup>
import { useImportaçõesStore } from '@/stores/importacoes.store.ts';

const importaçõesStore = useImportaçõesStore();

if (!importaçõesStore.portfoliosPermitidos.length) {
  importaçõesStore.buscarPortfolios();
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
        name: 'EnviosOrçamentosProjetosNovo',
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
            for="portfolio_id"
            class="label"
          >
            Portfólio&nbsp;<span
              class="tvermelho"
            >*</span>
          </label>
          <select
            id="portfolio_id"
            name="portfolio_id"
            class="inputtext light mb1"
            :value="$route.query.portfolio_id"
            :class="{
              loading: importaçõesStore.chamadasPendentes.portfoliosPermitidos
            }"
            :disabled="importaçõesStore.chamadasPendentes.portfoliosPermitidos"
            @change="($event) => $router.push({
              name: $route.name,
              query: {
                portfolio_id: $event.target.value || undefined
              }
            })"
          >
            <option value="">
              Todos
            </option>
            <option
              v-for="item in importaçõesStore.portfoliosPermitidos"
              :key="item.id"
              :value="item.id"
              :selected="item.id == $route.query.portfolio_id"
            >
              {{ item.id }} - {{ item.titulo }}
            </option>
          </select>
        </div>

        <hr class="ml1 mr1 f1">
      </template>
    </component>
  </router-view>
</template>
