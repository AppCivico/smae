<script setup>
import dateToTitle from '@/helpers/dateToTitle';
import { useCiclosStore } from '@/stores/ciclos.store';

const CiclosStore = useCiclosStore();
defineProps(['parent', 'list', 'indexes', 'editPeriodo', 'abrePeriodo']);
function openParent(e) {
  e.target.closest('.accordeon').classList.toggle('active');
}
</script>
<template>
  <div
    v-for="v in list"
    :key="v.variavel.id"
    class="accordeon active mb2"
  >
    <div
      class="flex mb1"
      @click="openParent"
    >
      <span class="t0"><svg
        class="arrow"
        width="13"
        height="8"
      ><use xlink:href="#i_down" /></svg></span>
      <h4 class="t1 mb0">
        {{ v.variavel.titulo }}
      </h4>
    </div>
    <div class="content">
      <table class="tablemain fix no-zebra">
        <thead>
          <tr>
            <th style="width: 25%">
              Código
            </th>
            <th style="width: 25%">
              Mês/Ano
            </th>
            <th style="width: 17.5%">
              Projetado Mensal
            </th>
            <th style="width: 17.5%">
              Realizado Mensal
            </th>
            <th style="width: 17.5%">
              Projetado Acumulado
            </th>
            <th style="width: 17.5%">
              Realizado Acumulado
            </th>
            <th style="width: 50px" />
          </tr>
        </thead>
        <tr
          v-for="val in v.series"
          :key="val.periodo"
          :class="{
            bgs2: val.aguarda_cp,
            bgs1: val.aguarda_complementacao,
          }"
        >
          <td>{{ v.variavel.codigo }}</td>
          <td @click="abrePeriodo(parent, v.variavel.id, val.periodo)">
            {{ dateToTitle(val.periodo) }}
          </td>
          <td @click="abrePeriodo(parent, v.variavel.id, val.periodo)">
            {{ val.series[indexes.indexOf('Previsto')]?.valor_nominal ?? '-' }}
          </td>
          <td
            :class="{
              'tamarelo': val.nao_preenchida && CiclosStore.valoresNovos.valorRealizado,
            }"
            @click="abrePeriodo(parent, v.variavel.id, val.periodo)"
          >
            {{ !val.nao_preenchida
              ? val.series[indexes.indexOf('Realizado')]?.valor_nominal
              : (CiclosStore.valoresNovos.valorRealizado ?? '-') }}
          </td>
          <td
            @click="abrePeriodo(parent, v.variavel.id, val.periodo)"
          >
            <span v-if="!v.variavel.acumulativa">
              N/A
            </span>

            <span v-else>
              {{ val.series[indexes.indexOf('PrevistoAcumulado')]?.valor_nominal ?? '-' }}
            </span>
          </td>
          <td
            :class="{
              'tamarelo': val.nao_preenchida && CiclosStore.valoresNovos.valorRealizadoAcumulado
            }"
            @click="abrePeriodo(parent, v.variavel.id, val.periodo)"
          >
            <span v-if="!v.variavel.acumulativa">
              N/A
            </span>

            <span v-else>
              {{ !val.nao_preenchida
                ? val.series[indexes.indexOf('RealizadoAcumulado')]?.valor_nominal
                : (CiclosStore.valoresNovos.valorRealizadoAcumulado ?? '-') }}
            </span>
          </td>
          <td style="white-space: nowrap; text-align: right;">
            <a
              v-if="val.pode_editar && editPeriodo"
              class="tprimary"
              @click="editPeriodo(parent, v.variavel.id, val.periodo)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </a>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>
