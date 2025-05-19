<template>
  <div>
    <h3>
      {{ analise?.variavel?.titulo }}
    </h3>

    <h4 v-if="$props.periodo">
      {{ dateToTitle(`${periodo}-01`) }}
    </h4>

    <h4 />

    <table
      v-if="Array.isArray(analise?.valores) && analise?.valores.length"
      class="tablemain horizontal-lines mb1"
    >
      <col class="col--minimum">
      <col>
      <col>
      <col v-if="analise?.valores[0].variavel.acumulativa">
      <thead>
        <th colspan="2">
          Variável
        </th>
        <th>Realizado</th>
        <th v-if="analise?.valores[0].variavel.acumulativa">
          Acumulado
        </th>
      </thead>
      <tbody>
        <tr
          v-for="(valor, i) in analise?.valores"
          :key="i"
        >
          <td>{{ valor.variavel.codigo }}</td>
          <th>{{ valor.variavel.titulo }}</th>
          <td>
            <template v-if="valor.variavel?.variavel_categorica_id && valor.valor_realizado">
              {{ dadosAuxiliares?.categoricas?.[valor.valor_realizado] || valor.valor_realizado }}
            </template>
            <template v-else>
              {{ valor.valor_realizado }}
            </template>
          </td>
          <td v-if="valor.variavel.acumulativa">
            {{ valor.valor_realizado_acumulado }}
          </td>
        </tr>
      </tbody>
    </table>

    <table class="tablemain tbody-zebra">
      <col class="col--minimum">
      <col>
      <col class="col--dataHora">

      <thead>
        <tr>
          <th> Fase </th>
          <th> Responsável </th>
          <th />
        </tr>
      </thead>
      <template
        v-for="item, k in fasesMapeadas"
        :key="k"
      >
        <tbody v-if="item">
          <tr>
            <th>{{ fasesDaVariavel[item.fase as VariavelFase]?.nome || item.fase }}</th>
            <td>{{ item.criador_nome }}</td>
            <td class="tr">
              {{ localizarDataHorario(item?.criado_em) }}
            </td>
          </tr>
          <tr>
            <td colspan="3">
              {{ item.analise_qualitativa }}
            </td>
          </tr>
        </tbody>
      </template>
    </table>

    <div
      v-if="analise?.uploads.length"
      class="mt2 mb2"
    >
      <table class="tablemain">
        <col>
        <col>
        <col>
        <col class="col--minimum">
        <thead>
          <tr>
            <th colspan="2">
              Documento comprobatório
            </th>
            <th>Fase</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="arquivo in analise.uploads"
            :key="arquivo.id"
          >
            <td class="flex center">
              <svg
                width="20"
                height="20"
                class="mr1"
              ><use xlink:href="#i_doc" /></svg>
              {{ arquivo?.nome_original }}
            </td>
            <td>{{ arquivo.descricao }}</td>
            <td>{{ arquivo.fase }}</td>

            <td>
              <SmaeLink
                v-if="arquivo?.download_token"
                :to="`${baseUrl}/download/${arquivo.download_token}`"
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
import fasesDaVariavel from '@/consts/fasesDaVariavel';
import { localizarDataHorario } from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import type { VariavelAuxiliarDto } from '@back/variavel/dto/list-variavel.dto';
import type { VariavelAnaliseQualitativaResponseDto } from '@back/variavel/dto/variavel.ciclo.dto';
import { computed, PropType } from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  analise: {
    type: Object as PropType<VariavelAnaliseQualitativaResponseDto | null>,
    default: null,
  },
  periodo: {
    type: String,
    default: '',
  },
  dadosAuxiliares: {
    type: Object as PropType<VariavelAuxiliarDto>,
    default: () => null,
  },
});

type VariavelFase = 'Preenchimento' | 'Validacao' | 'Liberacao';
type Fase = {
  fase: VariavelFase;
  criador_nome: string;
  criado_em: Date;
  eh_liberacao_auto?: boolean;
  analise_qualitativa?: string;
};

const fasesMapeadas = computed(() => {
  const mapa: Record<VariavelFase, Fase | null> = {
    Preenchimento: null,
    Validacao: null,
    Liberacao: null,
  };

  if (props.analise?.analises && Array.isArray(props.analise?.analises)) {
    props.analise.analises.forEach((item: Fase) => {
      if (mapa[item.fase as VariavelFase] !== undefined) {
        mapa[item.fase as VariavelFase] = item;
      }
    });
  }

  return mapa;
});
</script>
