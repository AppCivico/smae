<template>
  <Dashboard>
    <TítuloDePágina>Lista de ícones</TítuloDePágina>

    <dl
      v-if="lista.length"
      class="flex flexwrap g2"
    >
      <div
        v-for="item in lista"
        :key="item.id"
        class="p1 tc"
      >
        <dt class="flex justifycenter">
          <svg
            :width="item.width || 24"
            :height="item.height || 24"
          ><use :xlink:href="item.url" /></svg>
        </dt>
        <dt class="w900 mt1">
          {{ item.name }}
        </dt>
        <dd class="mt1">
          {{ item.width }}px × {{ item.height }}px
        </dd>
      </div>
    </dl>
  </Dashboard>
</template>
<script lang="ts" setup>
import Dashboard from '@/components/DashboardLayout.vue';
import { Ref, ref } from 'vue';

type Icone = {
  id: string;
  url: string;
  name: string;
  width?: string | null;
  height?: string | null;
};

const lista: Ref<Icone[]> = ref([]);

function montarLista() {
  const envelopeDeIcones = document.getElementById('svg-icons');

  if (envelopeDeIcones) {
    const icones = envelopeDeIcones.querySelectorAll('symbol');

    icones.forEach((icone) => {
      const { id } = icone;
      const url = `#${id}`;
      const name = id;
      const width = icone.hasAttribute('width')
        ? icone.getAttribute('width')
        : icone.getAttribute('viewBox')?.split(' ')[2];
      const height = icone.hasAttribute('height')
        ? icone.getAttribute('height')
        : icone.getAttribute('viewBox')?.split(' ')[3];

      lista.value.push({
        id, url, name, width, height,
      });
    });
  }
}

montarLista();
</script>
