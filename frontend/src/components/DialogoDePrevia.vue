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

watch(arquivoAtual, () => {
  cargaPendente.value = true;
});
</script>
<template>
  <SmaeDialog
    id="previa-arquivo"
    :parametros-associados="[
      'arquivo_id'
    ]"
    titulo="Pré-visualização do arquivo"
    class="dialogo-de-previa"
    style="flex-direction: column; display: flex;"
  >
    <dl
      class="flex g2 mb1 flexwrap"
    >
      <div
        class="f1 mb1 fb50"
      >
        <dt
          class="t12 uc w700 mb05 tamarelo"
        >
          Nome
        </dt>
        <dd
          class="t13"
        >
          {{ arquivoAtual?.arquivo?.nome_original || '—' }}
        </dd>
      </div>
      <div
        class="f1 mb1 fb10em"
      >
        <dt
          class="t12 uc w700 mb05 tamarelo"
        >
          Data
        </dt>
        <dd
          class="t13"
        >
          {{ dateToField(arquivoAtual?.data) || '—' }}
        </dd>
      </div>
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
      v-if="arquivoAtual?.arquivo?.preview?.mime_type == 'application/pdf'"
      class="dialogo-de-previa__previa dialogo-de-previa__previa--iframe block card-shadow"
      :src="`${baseUrl}/download/${arquivoAtual?.arquivo?.preview.download_token}?inline=true`"
    >
      Seu navegador não suporta iframes.
    </iframe>

    <template
      v-else-if="arquivoAtual?.arquivo?.preview?.mime_type?.startsWith('image/')"
    >
      <LoadingComponent v-if="cargaPendente" />
      <img
        v-show="!cargaPendente"
        class="dialogo-de-previa__previa dialogo-de-previa__previa--img block card-shadow"
        :src="`${baseUrl}/download/${arquivoAtual?.arquivo?.preview.download_token}`"
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

    <div
      v-if="arquivoAtual?.arquivo?.download_token"
      class="dialogo-de-previa__download-wrapper flex center g2 mt2"
    >
      <SmaeLink
        :download="arquivoAtual?.arquivo?.nome_original"
        class="dialogo-de-previa__download-button flex center g1 btn big"
        :to="`${baseUrl}/download/${arquivoAtual?.arquivo?.download_token}`"
      >
        baixar arquivo <svg
          class="f0 mr0 ml0"
          width="24"
          height="24"
        ><use
          xlink:href="#i_download"
        /></svg>
      </SmaeLink>
    </div>
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
</style>
