<template>
  <table
    v-if="Array.isArray($props.arquivos)
      && $props.arquivos?.length"
    class="tablemain mb1 mt1"
  >
    <col>
    <col>
    <col>
    <col class="col--data">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Documentos</th>
        <th />
        <th />
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="doc in $props.arquivos"
        :key="doc.id"
      >
        <td class="flex center">
          <svg
            width="20"
            height="20"
            class="mr1"
          ><use xlink:href="#i_doc" /></svg>
          {{ doc?.arquivo?.nome_original }}
        </td>
        <td>{{ doc.arquivo?.descricao }}</td>
        <td>{{ doc.criador?.nome_exibicao }}</td>
        <td>{{ dateToShortDate(doc.criado_em) }}</td>
        <td>
          <SmaeLink
            v-if="doc?.arquivo?.download_token"
            :to="baseUrl + '/download/' + doc?.arquivo?.download_token"
            download
          >
            <svg
              width="20"
              height="20"
              class="mr1"
            ><use xlink:href="#i_download" /></svg>
          </SmaeLink>
        </td>
      </tr>
    </tbody>
  </table>
</template>
<script setup lang="ts">
import { dateToShortDate } from '@/helpers/dateToDate';
import type { ArquivoAnaliseQualitativaDocumentoDto } from '@back/mf/metas/dto/mf-meta-analise-quali.dto';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

defineProps({
  arquivos: {
    type: Array as () => ArquivoAnaliseQualitativaDocumentoDto[],
    required: true,
  },
});
</script>
