<script setup>
import Dashboard from '@/components/DashboardLayout.vue';
import { useCounterStore } from '@/stores/counter.store';
import { storeToRefs } from 'pinia';

const a = useCounterStore('a');
const b = useCounterStore('b');
const counterStore = useCounterStore();

const { count: defaultCounter } = storeToRefs(counterStore);
const { count: countA } = storeToRefs(a);
const { count: countB } = storeToRefs(b);

</script>
<template>
  <Dashboard>
    <MigalhasDePão
      v-if="!$route.meta.desabilitarMigalhasDePãoPadrão"
      class="mb1"
    />

    <div class="flex g2">
      <button
        type="button"
        class="f1"
        @click="counterStore.increment()"
      >
        Increment defaultCounter
      </button>
      <button
        type="button"
        class="f1"
        @click="a.increment()"
      >
        Increment A
      </button>
      <button
        type="button"
        class="f1"
        @click="b.increment()"
      >
        Increment B
      </button>
    </div>

    <pre>defaultCountB@PlanosSetoriaisRaiz.vue: {{ defaultCounter }}</pre>
    <pre>countA@PlanosSetoriaisRaiz.vue: {{ countA }}</pre>
    <pre>countB@PlanosSetoriaisRaiz.vue: {{ countB }}</pre>

    <router-view />
  </Dashboard>
</template>
