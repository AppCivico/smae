<script setup>
import { ref, defineProps, computed } from 'vue';
import SmallModal from '@/components/SmallModal.vue';
import requestS from '@/helpers/requestS.ts';
import dateToDate, { dateToMonthYear } from '@/helpers/dateToDate';

const showModal = ref(false);
const analise = ref(null);
const props = defineProps(['g', 'variavel']);
const baseUrl = `${import.meta.env.VITE_API_URL}`;

const mappedValues = computed(() => {
  const mapping = {
    Previsto: '',
    Realizado: '',
    PrevistoAcumulado: '',
    RealizadoAcumulado: '',
  };

  analise.value.ordem_series.forEach((item, index) => {
    mapping[item] = analise.value.series[index]?.valor_nominal || '';
  });

  return mapping;
});

function nestLinhas(l) {
  const a = {};
  l.forEach((x) => {
    if (!a[x.agrupador]) a[x.agrupador] = [];
    a[x.agrupador].push(x);
  });
  return Object.entries(a);
}
function toggleAccordeon(t) {
  t.target.closest('.tzaccordeon').classList.toggle('active');
}

function openAnalise() {
  showModal.value = true;
}

function hasModal(cicloFisico) {
  return cicloFisico?.analise || cicloFisico?.tem_documentos;
}

async function buscarAnalise(dataValor, variavelId) {
  try {
    analise.value = await requestS.get(`${baseUrl}/mf/metas/variaveis/analise-qualitativa`, { data_valor: dataValor, variavel_id: variavelId });
  } catch (erro) {
    console.log(erro);
  }
}

function handleClick(obj) {
  if (hasModal(obj.ciclo_fisico)) {
    buscarAnalise(obj.series[0].data_valor, props.g?.variavel?.id);
    openAnalise();
  }
}
</script>
<template>
  <SmallModal
    v-if="showModal"
  >
    <div class="flex spacebetween center mb2">
      <h2>
        Análise Qualitativa da Variável
      </h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-modal="true"
        :formulário-sujo="false"
        @close="showModal = false"
      />
    </div>
    <div>
      <h3>
        {{ analise?.variavel?.titulo }}
      </h3>

      <table class="tablemain">
        <col>
        <thead>
          <tr>
            <th> Mês/ano </th>
            <th> Previsto mensal </th>
            <th> Realizado mensal </th>
            <th> Previsto acumulado </th>
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
                {{ arquivo?.arquivo.nome_original }}
              </td>
              <td>{{ arquivo.arquivo.descricao }}</td>
              <td>{{ arquivo.criador.nome_exibicao }}</td>
              <td>{{ dateToDate(arquivo.criado_em) }}</td>
              <td>
                <svg
                  width="20"
                  height="20"
                  class="mr1"
                ><use xlink:href="#i_download" /></svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </SmallModal>
  <template v-if="g?.linhas">
    <template
      v-for="k in nestLinhas(g.linhas)"
      :key="k[0]"
    >
      <tr
        class="tzaccordeon"
        @click="toggleAccordeon"
      >
        <td
          colspan="56"
        >
          <svg
            class="arrow"
            width="13"
            height="8"
          ><use xlink:href="#i_down" /></svg> <span>{{ k[0] }}</span>
        </td>
      </tr>
      <tbody>
        <!-- ver erro -->
        <tr
          v-for="(val,i) in k[1]"
          :key="val.id ? val.id : i"
        >
          <td>
            <div class="flex center">
              <div
                v-if="variavel"
                class="mr1"
                :style="{ color: hasModal(val.ciclo_fisico) ? '#94DA00' : '#B8C0CC' }"
                @click="handleClick(val)"
              >
                <svg
                  width="16"
                  height="20"
                ><use xlink:href="#i_document" /></svg>
              </div>
              <div
                v-else
                class="farol i1"
              />
              <span>{{ val.periodo }}</span>
            </div>
          </td>
          <td>
            {{ val.series[g.ordem_series.indexOf('Previsto')]?.valor_nominal ?? '-' }}
          </td>
          <td>
            {{ val.series[g.ordem_series.indexOf('Realizado')]?.valor_nominal ?? '-' }}
          </td>
          <td>
            {{ val.series[g.ordem_series.indexOf('PrevistoAcumulado')]?.valor_nominal ?? '-' }}
          </td>
          <td>
            {{
              val.series[g.ordem_series.indexOf('RealizadoAcumulado')]?.valor_nominal ?? '-'
            }}
          </td>
          <td style="white-space: nowrap; text-align: right;" />
        </tr>
      </tbody>
    </template>
  </template>
  <tr v-else-if="g?.loading">
    <td colspan="555">
      <span class="spinner">Carregando</span>
    </td>
  </tr>
</template>
