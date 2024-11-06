<template>
  <div>
    <h3>
      {{ analise?.variavel?.titulo }}
    </h3>

    <h4 v-if="$props.periodo">
      {{ dateToTitle(`${periodo}-01`) }}
    </h4>

    <table class="tablemain">
      <col>
      <col>
      <col>
      <col>
      <col>
      <thead>
        <tr>
          <th> Mês/ano </th>
          <th> Previsto mensal </th>
          <th> Realizado mensal </th>
          <th> Previsto acumulado</th>
          <th> Realizado acumulado </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="analise?.series?.length">
          <td>{{ dateToMonthYear(analise?.series[0]?.data_valor) }}</td>
          <td>{{ mappedValues['Previsto'] }}</td>
          <td>{{ mappedValues['Realizado'] }}</td>
          <td>{{ mappedValues['PrevistoAcumulado'] }}</td>
          <td>{{ mappedValues['RealizadoAcumulado'] }}</td>
        </tr>
      </tbody>
    </table>
    <div class="mt2 mb2">
      <h5 class="mb0 tc300">
        ANÁLISE
      </h5>
      <hr class="mt05 mb1">
      <p>
        {{ analise?.analises[0]?.analise_qualitativa }}
      </p>
      <hr class="mt1 mb1">
    </div>
    <div
      v-if="analise?.arquivos.length"
      class="mt2 mb2"
    >
      <table class="tablemain">
        <col>
        <col>
        <col>
        <col>
        <col>
        <thead>
          <tr>
            <th>Documento comprobatório</th>
            <th />
            <th />
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="arquivo in analise.arquivos"
            :key="arquivo.id"
          >
            <td class="flex center">
              <svg
                width="20"
                height="20"
                class="mr1"
              ><use xlink:href="#i_doc" /></svg>
              {{ arquivo?.arquivo?.nome_original }}
            </td>
            <td>{{ arquivo.arquivo?.descricao }}</td>
            <td>{{ arquivo.criador?.nome_exibicao }}</td>
            <td>{{ dateToDate(arquivo.criado_em) }}</td>
            <td>
              <SmaeLink
                v-if="arquivo?.arquivo.download_token"
                :to="baseUrl + '/download/' + arquivo?.arquivo.download_token"
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
    </div>
  </div>
</template>
<script lang="ts" setup>
import dateToDate, { dateToMonthYear } from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import type {
  MfListVariavelAnaliseQualitativaDto,
} from '@back/mf/metas/dto/mf-meta.dto';
import { computed, PropType } from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  analise: {
    type: Object as PropType<MfListVariavelAnaliseQualitativaDto | null>,
    default: null,
  },
  periodo: {
    type: String,
    default: '',
  },
  dadosAuxiliares: {
    type: Object,
    default: () => null,
  },
});

const mappedValues = computed(() => {
  const mapping = {
    Previsto: '',
    Realizado: '',
    PrevistoAcumulado: '',
    RealizadoAcumulado: '',
  };

  if (props.analise) {
    props.analise.ordem_series.forEach((item: (keyof typeof mapping), index: number) => {
      mapping[item] = props.analise?.series[index]?.valor_nominal || '';
    });
  }

  return mapping;
});

</script>
