<script setup>
import dateToTitle from '@/helpers/dateToTitle';
import modalComplementacaoEmLote from '@/components/monitoramento/modalComplementacaoEmLote.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useCiclosStore } from '@/stores/ciclos.store';
import { useEditModalStore } from '@/stores/editModal.store';

const { temPermissãoPara } = useAuthStore();

const CiclosStore = useCiclosStore();
const editModalStore = useEditModalStore();

defineProps([
  'parent',
  'list',
  'indexes',
  'editPeriodo',
  'abrePeriodo',
  'editPeriodoEmLote',
]);

function abrirModalComplementação(parent, variávelComposta, params) {
  editModalStore.clear();
  editModalStore.modal(modalComplementacaoEmLote, {
    parent, variávelComposta, params,
  });
}

function openParent(e) {
  e.target.closest('.accordeon').classList.toggle('active');
}
</script>
<template>
  <div
    v-for="c in list"
    :key="c.id"
    class="accordeon active mb2"
  >
    <div
      class="flex spacebetween center mb1"
      @click="openParent"
    >
      <span class="t0"><svg
        class="arrow"
        width="13"
        height="8"
      ><use xlink:href="#i_down" /></svg></span>
      <h4 class="t1 mb0">
        {{ c.titulo }}
      </h4>
      <hr class="ml2 f1">
      <button
        v-if="temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp'])"
        type="button"
        class="ml2 btn"
        @click.stop="abrirModalComplementação(parent, c, { apenasVazias: true })"
      >
        Solicitar complementação
      </button>
      <button
        type="button"
        class="ml2 btn"
        @click.stop="editPeriodoEmLote(parent, c, { apenasVazias: true })"
      >
        Ações em lote
      </button>
    </div>

    <div class="content">
      <table class="tablemain no-zebra fix">
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
        <tbody
          v-for="v in c.variaveis"
          :key="v.variavel.id"
        >
          <tr
            v-for="val in v.series"
            :key="val.periodo"
            :class="{
              bgs2: val.aguarda_cp,
              bgs1: val.aguarda_complementacao,
            }"
          >
            <td>{{ v.variavel?.codigo }}</td>
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
        </tbody>
      </table>
    </div>
  </div>
</template>
