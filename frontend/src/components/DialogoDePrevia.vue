<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import dateToField from '@/helpers/dateToField';

import LoadingComponent from './LoadingComponent.vue';
import SmaeDialog from './SmaeDialog.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  arquivosPorId: {
    type: Object,
    required: true,
  },
});

const route = useRoute();

const cargaPendente = ref(true);

const arquivoAtual = computed(() => props.arquivosPorId[route.query.arquivo_id]);

const ehPdf = computed(() => arquivoAtual.value?.arquivo?.preview?.mime_type === 'application/pdf'
  && !!arquivoAtual.value?.arquivo?.preview?.download_token);

const ehImagem = computed(() => arquivoAtual.value?.arquivo?.preview?.mime_type?.startsWith('image/')
  && !!arquivoAtual.value?.arquivo?.preview?.download_token);

const urlDoArquivo = computed(() => (arquivoAtual.value?.arquivo?.download_token
  ? `${baseUrl}/download/${arquivoAtual.value.arquivo.download_token}`
  : null));

const urlDaPrevia = computed(() => {
  if (!arquivoAtual.value?.arquivo?.preview?.download_token) {
    return null;
  }

  const url = `${baseUrl}/download/${arquivoAtual.value.arquivo.preview.download_token}?inline=true`;

  return ehPdf.value
    ? `${url}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=1`
    : url;
});

watch(arquivoAtual, () => {
  cargaPendente.value = true;
});
</script>
<template>
  <SmaeDialog
    id="previa-arquivo"
    :parametros-associados="['arquivo_id']"
    class="dialogo-de-previa largura-total"
    style="flex-direction: column; display: flex;"
  >
    <template #titulo>
      {{ arquivoAtual?.arquivo?.nome_original || '—' }}

      <small v-if="arquivoAtual?.data">
        ({{ dateToField(arquivoAtual?.data) || '-' }})
      </small>
    </template>

    <template #subtitulo>
      <svg
        width="24"
        height="24"
        color="#F2890D"
        class="ib"
      ><use xlink:href="#i_alert" /></svg>{{ ehPdf
        ? 'Prévia limitada às primeiras 5 páginas do documento'
        : 'Pré-visualização do arquivo' }}
    </template>
    <template #acoes>
      <SmaeLink
        v-if="urlDoArquivo"
        :download="arquivoAtual?.arquivo?.nome_original"
        class="dialogo-de-previa__download-button btn with-icon amarelo"
        :to="urlDoArquivo"
      >
        baixar arquivo <svg
          class="f0 mr0 ml0"
          width="24"
          height="24"
        ><use
          xlink:href="#i_download"
        /></svg>
      </SmaeLink>
    </template>

    <dl
      v-if="arquivoAtual?.descricao"
      class="flex g2 flexwrap"
    >
      <div
        class="f1 mb1 fb100"
      >
        <dt
          class="t12 uc w700 mb05 tamarelo"
        >
          Descrição
        </dt>
        <dd
          class="t13"
        >
          {{ arquivoAtual?.descricao || '—' }}
        </dd>
      </div>
    </dl>

    <iframe
      v-if="ehPdf"
      class="dialogo-de-previa__previa dialogo-de-previa__previa--iframe block card-shadow"
      :src="urlDaPrevia"
    >
      Seu navegador não suporta iframes.
    </iframe>

    <template
      v-else-if="ehImagem"
    >
      <LoadingComponent v-if="cargaPendente" />
      <img
        v-show="!cargaPendente"
        class="dialogo-de-previa__previa dialogo-de-previa__previa--img block card-shadow"
        :src="urlDaPrevia"
        alt="Pré-visualização do arquivo"
        @load="cargaPendente = false"
      >
    </template>
    <p
      v-else
      class="tc300"
    >
      Formato desconhecido.
    </p>
  </SmaeDialog>
</template>
<style lang="less" scoped>
.dialogo-de-previa__previa {
  flex-shrink: 1;
  max-width: 100%;
  border: none;
  margin-left: auto;
  margin-right: auto;
}

.dialogo-de-previa__previa--iframe {
  width: 100%;
  height: 500px;
  min-height: 350px;
}

.dialogo-de-previa__previa--img {
  width: max-content;
  max-height: 500px;
}

.dialogo-de-previa__download-wrapper {
  &::before,
  &::after {
    flex-grow: 1;
    content: '';
    height: 1px;
    background: @c100;
  }
}

.dialogo-de-previa__download-button {
  max-width: max-content;
}

.dialogo-de-previa__download-button svg {
  height: 1.25em;
}

small {
  font-weight: 400;
  font-size: 65%;
  color: @c600;
  overflow-wrap: normal;
  word-break: normal;
  flex-shrink: 0;
}
</style>
