<script setup>
import SmallModal from '@/components/SmallModal.vue';
import requestS from '@/helpers/requestS.ts';
import { computed, defineProps, ref } from 'vue';
import { useRoute } from 'vue-router';
import CicloFisicoPdM from './CicloFisicoPdM.vue';
import CicloFisicoPS from './CicloFisicoPS.vue';

const route = useRoute();

const showModal = ref(false);
const analise = ref(null);
const periodo = ref('');
const props = defineProps({
  g: {
    type: Object,
    default: () => ({}),
  },
  variavel: {
    type: Boolean,
    default: false,
  },
  temVariavelAcumulada: {
    type: Boolean,
    default: true,
  },
});
const baseUrl = `${import.meta.env.VITE_API_URL}`;

const conteudoDoModal = computed(() => (route.meta.entidadeMãe === 'planoSetorial'
  ? CicloFisicoPS
  : CicloFisicoPdM));

const temVariavelCategorica = computed(() => !!props.g.variavel?.variavel_categorica_id);

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

// TO-DO: Usar usar query strings para abrir o diálogo
function openAnalise() {
  showModal.value = true;
}

function hasModal(cicloFisico) {
  return route.meta.entidadeMãe === 'planoSetorial'
    ? cicloFisico?.contagem_qualitativa
    : cicloFisico?.analise || cicloFisico?.tem_documentos;
}

// TO-DO: Mover toda a lógica para o componente correspondente e
async function buscarAnalise(dataValor, variavelId) {
  try {
    analise.value = route.meta.entidadeMãe === 'planoSetorial'
      ? await requestS.get(`${baseUrl}/variavel-analise-qualitativa`, {
        consulta_historica: true,
        data_referencia: dataValor,
        variavel_id: variavelId,
      })
      : await requestS.get(`${baseUrl}/mf/metas/variaveis/analise-qualitativa`, {
        data_valor: dataValor,
        variavel_id: variavelId,
      });
  } catch (erro) {
    console.log(erro);
  }
}

function handleClick(obj) {
  if (hasModal(obj.ciclo_fisico)) {
    periodo.value = obj.periodo;

    if (route.meta.entidadeMãe === 'planoSetorial') {
      buscarAnalise(
        `${obj.periodo}-01`,
        props.g.variavel?.variavel_mae_id || props.g.variavel?.id,
      );
    } else {
      buscarAnalise(
        obj.series[0].data_valor,
        props.g.variavel?.id,
      );
    }
    openAnalise();
  }
}

function contarCategorias(elementos) {
  const contagem = {};

  const categoriasLocais = props.g.dados_auxiliares?.categoricas || {};

  Object.keys(categoriasLocais).forEach((categoria) => {
    contagem[categoria] = 0;
  });

  elementos?.forEach((elemento) => {
    if (contagem[elemento.categoria] !== undefined) {
      contagem[elemento.categoria] += 1;
    }
  });

  return contagem;
}

function obterTooltipTexto(item, index) {
  const serieIndex = props.g.ordem_series?.indexOf(index);

  if (serieIndex === -1 || !item.series[serieIndex] || !item.series[serieIndex].elementos?.length) {
    return '-';
  }

  const contagem = contarCategorias(item.series[serieIndex].elementos);

  return Object.entries(props.g.dados_auxiliares?.categoricas || {})
    .filter(([chave]) => contagem[chave] > 0)
    .map(([chave, descricao]) => `- ${contagem[chave]} ${descricao}`)
    .join('\n');
}

function obterValorTabela(item, index) {
  const serieIndex = props.g.ordem_series?.indexOf(index);

  if (serieIndex === -1 || !item.series[serieIndex]) {
    return '-';
  }

  if (item.series[serieIndex].elementos?.length > 1) {
    return obterTooltipTexto(item, index);
  }

  const valor = item.series[serieIndex].valor_nominal;

  if (!valor) {
    return '-';
  }

  if (temVariavelCategorica.value) {
    return props.g.dados_auxiliares?.categoricas?.[valor] || valor;
  }

  return valor;
}

</script>
<template>
  <SmallModal
    v-if="showModal"
    class="largura-total"
  >
    <div class="flex spacebetween center mb2">
      <h2>
        Análise Qualitativa da Variável
      </h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-modal="true"
        :formulario-sujo="false"
        @close="showModal = false"
      />
    </div>
    <component
      :is="conteudoDoModal"
      :analise="analise"
      :periodo="periodo"
      :dados-auxiliares="g.dados_auxiliares"
    />
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
        <tr
          v-for="(val, i) in k[1]"
          :key="val.id ? val.id : i"
        >
          <td>
            <div class="flex center">
              <component
                :is="hasModal(val.ciclo_fisico) ? 'button' : 'span'"
                v-if="variavel"
                :type="hasModal(val.ciclo_fisico) ? 'button' : null"
                class="mr1 like-a__text"
                :style="{ color: hasModal(val.ciclo_fisico) ? '#94DA00' : '#B8C0CC' }"
                @click="handleClick(val)"
              >
                <svg
                  width="16"
                  height="20"
                ><use xlink:href="#i_document" /></svg>
              </component>
              <div
                v-else
                class="farol i1"
              />
              <span>{{ val.periodo }}</span>
            </div>
          </td>
          <td>
            <div
              v-if="val.series[props.g.ordem_series?.indexOf('Previsto')]?.elementos?.length > 1"
              class="tipinfo ml1"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_i" /></svg><div>
                {{ obterValorTabela(val, 'Previsto') }}
              </div>
            </div>
            <span v-else>
              {{ obterValorTabela(val, 'Previsto') }}
            </span>
          </td>
          <td>
            <div
              v-if="val.series[props.g.ordem_series?.indexOf('Realizado')]?.elementos?.length > 1"
              class="tipinfo ml1"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_i" /></svg><div>
                {{ obterValorTabela(val, 'Realizado') }}
              </div>
            </div>
            <span v-else>
              {{ obterValorTabela(val, 'Realizado') }}
            </span>
          </td>
          <td>
            <span v-if="!temVariavelAcumulada">
              N/A
            </span>

            <span v-else>
              {{ obterValorTabela(val, 'PrevistoAcumulado') }}
            </span>
          </td>
          <td>
            <span v-if="!temVariavelAcumulada">
              N/A
            </span>

            <span v-else>
              {{ obterValorTabela(val, 'RealizadoAcumulado') }}
            </span>
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
