<template>
  <TituloDePagina>Envio de arquivo</TituloDePagina>

  <p>
    Envie um ou mais arquivos para associar com a análise qualitativa.
  </p>

  <form
    class="contentStyle"
    @submit.prevent="associarDocumentoComAnalise"
  >
    <ol v-if="listaDeCampos.length">
      <li
        v-for="(arquivo, i) in listaDeCampos"
        :key="i"
        :class="{ 'com-erro': erros[i] }"
      >
        <CampoDeArquivo
          id="arquivo"
          v-model="listaDeCampos[i]"
          name="arquivo"
          tipo="DOCUMENTO"
          @envio-bem-sucedido="listaDeCampos.push('')"
          @arquivo-removido="listaDeCampos.splice(i, 1)"
        />
      </li>
    </ol>

    <ErrorComponent
      :erro="erroGeral"
      class="mb1"
    />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        type="submit"
        :aria-busy="enviando"
        :aria-disabled="!listaDeArquivos.length"
      >
        Associar arquivos
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import CampoDeArquivo from '@/components/CampoDeArquivo.vue';
import {
  computed,
  ref,
} from 'vue';
import { useRoute } from 'vue-router';

const emit = defineEmits(['envioBemSucedido']);

const route = useRoute();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);
const alertStore = useAlertStore();

const listaDeCampos = ref(['']);
const enviando = ref(false);
const erroGeral = ref(null);
const erros = ref({});

const listaDeArquivos = computed(() => listaDeCampos.value
  .filter((registroDoArquivo) => registroDoArquivo));

function associarDocumentoComAnalise() {
  if (enviando.value || !listaDeArquivos.value.length) {
    return;
  }

  erroGeral.value = null;
  erros.value = {};
  enviando.value = true;

  const associacoes = listaDeArquivos.value
    .filter((registroDoArquivo) => registroDoArquivo)
    .map((registroDoArquivo) => monitoramentoDeMetasStore.associarDocumentoComAnalise(
      route.params.planoSetorialId,
      route.params.cicloId,
      {
        ciclo_fisico_id: route.params.cicloId,
        meta_id: route.params.meta_id,
        upload_token: registroDoArquivo,
      },
    ));

  Promise.all(associacoes).then((respostas) => {
    let temErro;

    respostas.forEach((resposta, i) => {
      if (!resposta) {
        erros.value[i] = 'Erro ao associar documento com a análise.';
        temErro = true;
      }
    });

    if (temErro) {
      throw new Error('Erro ao associar um dos documentos com a análise.');
    } else {
      alertStore.success('Documento associado com sucesso!');
    }
    emit('envioBemSucedido');
  }).catch((error) => {
    erroGeral.value = error.message;
  }).finally(() => {
    enviando.value = false;
  });
}
</script>
<style lang="less">
.com-erro {
  color: @vermelho;
}
</style>
