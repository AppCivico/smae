<script setup>
// import DocumentosDoProjeto from '@/components/projetos/DocumentosDoProjeto.vue';
import DocumentosDaTransferencia from "@/components/transferencia/DocumentosDaTransferencia.vue";
// import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTransferenciasVoluntariasStore } from "@/stores/transferenciasVoluntarias.store.js";

import { storeToRefs } from "pinia";

defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

// const projetosStore = useProjetosStore();
const transferenciasVoluntariasStore = useTransferenciasVoluntariasStore();

// const {
//   permissõesDoProjetoEmFoco,
// } = storeToRefs(projetosStore);

// const {
//   permissõesDaTransferenciaEmFoco,
// } = storeToRefs(transferenciasVoluntariasStore);
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina> Documentos Transferencia </TítuloDePágina>

    <hr class="ml2 f1" />

    <!-- <router-link
      :to="{
        name: 'projetosNovoDocumento',
        params: 85,
      }"
      class="btn ml2"
    >
      Novo arquivo
    </router-link> -->
  </div>

  <DocumentosDaTransferencia />
</template>
