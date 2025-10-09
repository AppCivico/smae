<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useVariaveisStore } from '@/stores/variaveis.store';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import { FiltroBusca } from '@/consts/formSchemas';

type IndicadorItem = {
  id: number;
  codigo: string;
  titulo: string;
  tipo_indicador: string;
  pdm_id: number;
  variavel: {
    id: number;
    codigo: string;
    titulo: string;
  };
  meta: {
    id: number;
    codigo: string;
    titulo: string;
  };
  iniciativa: {
    id: number;
    codigo: string;
    titulo: string;
  };
  atividade: null | {
    id: number;
    codigo: string;
    titulo: string;
  };
};

const route = useRoute();
const variaveisStore = useVariaveisStore();

const relacionados = ref<IndicadorItem[]>([]);

watch(() => [
  route.params.variavelId,
  route.query.busca,
], async () => {
  const dados = await variaveisStore.buscarRelacionados(route.params.variavelId, route.query.busca);

  relacionados.value = dados as IndicadorItem[];
}, { immediate: true });
</script>

<template>
  <TituloDaPagina />

  <p class="mt2 mb2">
    Aqui estão listadas todas as instâncias nas quais esta variável é encontrada.
  </p>

  <div class="flex">
    <FiltroParaPagina
      class="fb50"
      uma-linha
      :schema="FiltroBusca"
      :formulario="[
        {
          campos: {
            busca: {
              tipo: 'search',
            }
          }
        }
      ]"
    />
  </div>

  <SmaeTable
    :colunas="[
      { chave: 'tipo', label: 'tipo', formatador: () => 'PDM' },
      { chave: 'titulo', label: 'PDM/Plano setorial' },
      { chave: 'orgao', label: 'órgão', formatador: () => '' },
      { chave: 'meta', label: 'meta', formatador: v => `${v.codigo} - ${v.titulo}` },
      { chave: 'iniciativa' },
      { chave: 'atividade' },
    ]"
    :dados="relacionados"
  >
    <template #celula:iniciativa="{ celula }">
      <span v-if="celula">
        <strong>Iniciativa:</strong>
        {{ celula.codigo }} - {{ celula.titulo }}
      </span>

      <span v-else />
    </template>

    <template #celula:atividade="{ celula }">
      <span v-if="celula">
        <strong>Atividade:</strong>
        {{ celula.codigo }} - {{ celula.titulo }}
      </span>

      <span v-else />
    </template>
  </SmaeTable>
</template>
