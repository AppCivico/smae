<script setup>
import { computed, defineProps, ref } from 'vue';
import { useRoute } from 'vue-router';

import SmallModal from '@/components/SmallModal.vue';
import requestS from '@/helpers/requestS.ts';

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
  || route.meta.entidadeMãe === 'programaDeMetas'
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
    || route.meta.entidadeMãe === 'programaDeMetas'
    ? cicloFisico?.contagem_qualitativa
    : cicloFisico?.analise || cicloFisico?.tem_documentos;
}

// TO-DO: Mover toda a lógica para o componente correspondente e
async function buscarAnalise(dataValor, variavelId) {
  try {
    analise.value = route.meta.entidadeMãe === 'planoSetorial'
      || route.meta.entidadeMãe === 'programaDeMetas'
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

    if (
      route.meta.entidadeMãe === 'planoSetorial'
      || route.meta.entidadeMãe === 'programaDeMetas'
    ) {
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

  const serie = item.series[serieIndex];
  const valor = serie.valor_nominal;

  if (valor === null || valor === undefined) {
    return '-';
  }

  const ehPrevia = serie.eh_previa === true;

  const valorFormatado = temVariavelCategorica.value
    ? props.g.dados_auxiliares?.categoricas?.[valor] || valor
    : valor;

  return ehPrevia ? `${valorFormatado} (Prévia)` : valorFormatado;
}

function obterValorPrevia() {
  if (!props.g.ultima_previa_indicador) return null;

  const previa = props.g.ultima_previa_indicador;

  if (temVariavelCategorica.value && previa.elementos?.totais_categorica) {
    const categorias = props.g.dados_auxiliares?.categoricas || {};
    const valores = previa.elementos.totais_categorica
      .map(({ categorica_valor, valor }) => {
        const descricao = categorias[String(categorica_valor)] || categorica_valor;
        return `- ${valor} ${descricao} (Prévia)`;
      })
      .join('\n');

    return valores || '-';
  }

  const valor = previa.valor_nominal;
  return valor !== null && valor !== undefined ? `${valor} (Prévia)` : '-';
}

function obterAgrupadorPrevia() {
  if (!props.g.ultima_previa_indicador?.data_valor) return null;
  // Pega o ano
  return props.g.ultima_previa_indicador.data_valor.substring(0, 4);
}

function obterPeriodoPrevia() {
  if (!props.g.ultima_previa_indicador?.data_valor) return null;
  // Formato YYYY-MM (igual às linhas normais)
  return props.g.ultima_previa_indicador.data_valor.substring(0, 7);
}

function linhaTemValor(linha) {
  return linha.series.some((serie) => {
    if (serie.elementos?.length > 0) return true;
    return serie.valor_nominal !== null && serie.valor_nominal !== undefined && serie.valor_nominal !== '';
  });
}

function filtrarLinhasComValor(linhas) {
  return linhas.filter(linhaTemValor);
}

function filtrarGruposComValor(grupos) {
  return grupos.filter(([ano, linhas]) => {
    const temLinhasComValor = filtrarLinhasComValor(linhas).length > 0;
    const temPrevia = props.g?.ultima_previa_indicador && obterAgrupadorPrevia() === ano;
    return temLinhasComValor || temPrevia;
  });
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
      v-for="k in filtrarGruposComValor(nestLinhas(g.linhas))"
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
          v-for="(val, i) in filtrarLinhasComValor(k[1])"
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
