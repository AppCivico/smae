<script setup>
import { useCiclosStore } from '@/stores';

const CiclosStore = useCiclosStore();
const props = defineProps(['parent', 'list', 'indexes', 'editPeriodo', 'abrePeriodo']);
function openParent(e) {
  e.target.closest('.accordeon').classList.toggle('active');
}
function dateToTitle(d) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const month = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][dd.getUTCMonth()];
  const year = dd.getUTCFullYear();
  return `${month}/${year}`;
}
</script>
<template>
  <div
    v-for="v in list"
    :key="v.variavel.id"
    class="accordeon active p1"
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
        {{ v.variavel.codigo }} {{ v.variavel.titulo }}
      </h4>
    </div>
    <div class="content">
      <table class="tablemain fix">
        <thead>
          <tr>
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
        <tr v-if="v.series[0]?.pode_editar">
          <td
            colspan="200"
            class="tc"
          >
            <a
              v-if="editPeriodo"
              class="tprimary addlink"
              @click="editPeriodo(parent, v.variavel.id, v.series[0].periodo)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg> <span>Adicionar {{ dateToTitle(v.series[0].periodo) }}</span>
            </a>
          </td>
        </tr>
        <tr
          v-for="val in v.series"
          :key="val.periodo"
          :class="{
            bgs2: val.aguarda_cp,
            bgs1: val.aguarda_complementacao,
          }"
        >
          <td @click="abrePeriodo(parent, v.variavel.id, val.periodo)">
            <div class="flex center">
              <div class="farol i1" /> <span>{{ dateToTitle(val.periodo) }}</span>
            </div>
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
            {{ val.series[indexes.indexOf('PrevistoAcumulado')]?.valor_nominal ?? '-' }}
          </td>
          <td
            :class="{
              'tamarelo': val.nao_preenchida && CiclosStore.valoresNovos.valorRealizadoAcumulado
            }"
            @click="abrePeriodo(parent, v.variavel.id, val.periodo)"
          >
            {{ !val.nao_preenchida
              ? val.series[indexes.indexOf('RealizadoAcumulado')]?.valor_nominal
              : (CiclosStore.valoresNovos.valorRealizadoAcumulado ?? '-') }}
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
