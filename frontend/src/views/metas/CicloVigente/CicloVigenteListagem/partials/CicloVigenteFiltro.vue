<script setup lang="ts">
import { computed, ref } from 'vue';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import FiltroParaPagina, { type Formulario } from '@/components/FiltroParaPagina.vue';
import { cicloVigenteFiltroSchema as schema } from '@/consts/formSchemas';

const formularioSujo = ref<boolean>(false);

const campos = computed<Formulario>(() => [
  {
    campos: {
      ps_pdm: {
        tipo: 'select',
        opcoes: [
          { id: 'PlanoSetorial', label: 'Plano Setorial' },
          { id: 'ProgramaDeMetas', label: 'Programa de Metas' },
        ],
      },
      orgao: { tipo: 'select', opcoes: [] },
      equipe: { tipo: 'select', opcoes: [] },
    },
  },
]);

const valoresIniciais = computed(() => ({}));

</script>

<template>
  <section class="ciclo-vigente-filtro">
    <EnvelopeDeAbas>
      <template #pendente />

      <template #atualizada />
    </EnvelopeDeAbas>

    <FiltroParaPagina
      v-model:formulario-sujo="formularioSujo"
      :formulario="campos"
      :schema="schema"
      :valores-iniciais="valoresIniciais"
    />

    <slot :formulario-sujo="formularioSujo" />
  </section>
</template>

<style lang="less" scoped>
// .comunicados-gerais-filtro {
//   :deep {
//     .maxw {
//       max-width: 60%;
//     }
//   }
// }
</style>
