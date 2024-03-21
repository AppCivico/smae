<script setup>
import DocumentosDaTransferencia from "@/components/transferencia/DocumentosDaTransferencia.vue";
import { useTransferenciasVoluntariasStore } from "@/stores/transferenciasVoluntarias.store.js";
import { storeToRefs } from "pinia";

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const transferenciasVoluntariasStore = useTransferenciasVoluntariasStore();

</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina> Documentos Transferencia enviar </TítuloDePágina>

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

  <!-- <DocumentosDaTransferencia /> -->
</template>
