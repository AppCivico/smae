<script setup>
import DocumentosDaTransferencia from '@/components/transferencia/DocumentosDaTransferencia.vue';

const props = defineProps({
  transferenciaId: {
    type: [Number, String],
    default: 0,
  },
});

</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2 mt2">
    <TítuloDePágina> Documentos </TítuloDePágina>
    <hr class="ml2 f1">
    <SmaeLink
      :to="{
        name: 'TransferenciasVoluntariasEnviarArquivo',
        params: {
          transferenciaId,
        },
      }"
      class="btn ml2"
    >
      Novo arquivo
    </SmaeLink>
  </div>

  <DocumentosDaTransferencia />
</template>
