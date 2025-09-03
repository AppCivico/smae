<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import FiltroParaPagina, { Formulario } from '@/components/FiltroParaPagina.vue';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';
import { FiltroDotacao as schema } from '@/consts/formSchemas';
import { useDotaçãoStore } from '@/stores/dotacao.store';
import prepararParaSelect from '@/helpers/prepararParaSelect';

const geolocalizadorStore = useGeolocalizadorStore();
const { chamadasPendentes } = storeToRefs(geolocalizadorStore);

const formulario = ref({});

const ano = 2024;
const dotacaoStore = useDotaçãoStore();

const {
  DotaçãoSegmentos: dotacaoSegmentos,
  chamadasPendentes: dotacaoChamadasPendentes,
} = storeToRefs(dotacaoStore);

const dotacaoAtual = computed(() => dotacaoSegmentos.value?.[ano] || {});

const camposDeFiltro = computed<Formulario>(() => [
  {
    campos: {
      orgao_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.orgaos, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      unidade_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.unidades, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      funcao_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.funcoes, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      subfuncao_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.subfuncoes, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      programa_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.programas, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
    },
  },
  {
    campos: {
      projeto_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.projetos_atividades, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
      conta_despesa: {
        tipo: 'numeric',
        atributos: { maxlength: 8, minlength: 8 },
      },
      despesa_fonte: {
        tipo: 'select',
        opcoes: prepararParaSelect(dotacaoAtual.value.fonte_recursos, { id: 'codigo', label: ['codigo', 'descricao'] }),
      },
    },
  },
  {
    campos: {
      exercicio_fonte_recurso: {
        tipo: 'numeric',
        atributos: { maxlength: 1, minlength: 1 },
      },
      exercicio_fonte: {
        tipo: 'numeric',
        atributos: { maxlength: 3, minlength: 3 },
      },
      execucao_orcamentaria: {
        tipo: 'numeric',
        atributos: { maxlength: 4, minlength: 4 },
      },
      origem_recurso: {
        tipo: 'numeric',
        atributos: { maxlength: 1, minlength: 1 },
      },
    },
  },
]);

onMounted(() => {
  dotacaoStore.getDotaçãoSegmentos(ano);
});
</script>

<template>
  {{ Object.keys(dotacaoAtual) }}
  <!-- {{ dotacaoAtual.unidades }} -->
  <FiltroParaPagina
    v-model="formulario"
    class="mb2"
    :schema="schema"
    :formulario="camposDeFiltro"
    :carregando="chamadasPendentes.buscandoEndereco || chamadasPendentes.buscandoProximidade"
  />
</template>
