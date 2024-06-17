<script setup>
import LoadingComponent from '@/components/LoadingComponent.vue';
import LocalFilter from '@/components/LocalFilter.vue';
import consolidarDiretorios from '@/helpers/consolidarDiretorios';
import createDataTree from '@/helpers/createDataTree.ts';
import { computed, defineAsyncComponent, ref } from 'vue';

const Arvore = defineAsyncComponent({
  loader: () => import('./ArvoreDeArquivos.vue'),
  loadingComponent: LoadingComponent,
});

const props = defineProps({
  arquivos: {
    type: Array,
    required: true,
  },
  diretórios: {
    type: Array,
    default: () => [],
  },

  apenasLeitura: {
    type: Boolean,
    default: false,
  },

  rotaDeAdição: {
    type: Object,
    default: null,
  },
  rotaDeEdição: {
    type: Object,
    default: null,
  },
});

defineEmits(['apagar', 'editar']);

const listaFiltradaPorTermoDeBusca = ref([]);
const ordenadoPor = ref('descricao');
const ordem = ref('crescente');

const arquivosOrdenados = computed(() => [...props.arquivos]
  .sort((a, b) => {
    if (a[ordenadoPor.value] || b[ordenadoPor.value]) {
      return ordem.value === 'crescente'
        ? (a[ordenadoPor.value] || '').localeCompare((b[ordenadoPor.value] || ''))
        : (b[ordenadoPor.value] || '').localeCompare((a[ordenadoPor.value] || ''));
    }
    return 0;
  }));

const arquivosAgrupadosPorCaminho = computed(() => listaFiltradaPorTermoDeBusca.value
  .reduce((acc, cur) => {
    const caminho = (cur?.arquivo?.diretorio_caminho || '/');

    acc[caminho] = !acc[caminho]
      ? [cur]
      : acc[caminho].concat([cur]);
    return acc;
  }, {})
  || {});

const diretóriosConsolidados = computed(() => consolidarDiretorios(
  props.arquivos,
  props.diretórios,
));

const árvoreDeDiretórios = computed(() => createDataTree(
  diretóriosConsolidados.value
    .reduce((acc, cur) => acc.concat(
      cur.replace('/', '')
        .split('/')
        .map((segmento, index, segmentos) => ({
          id: segmento || '/',
          pai: !segmento ? null : (segmentos[index - 1] || '/'),
          caminho: segmento ? `${cur.split(segmento)[0] + segmento}/` : '/',
        }))
        .filter((x) => !acc.some((y) => y.id === x.id)),
    ), []),
  'pai',
) || []);
</script>
<template>
  <div class="gerenciador-de-arquivos">
    <div class="flex flexwrap mb2 spacebetween">
      <div class="f1 mr1">
        <label class="label tc300">Ordenar por</label>
        <select
          v-model="ordenadoPor"
          class="inputtext"
        >
          <option value="descricao">
            Descrição
          </option>
          <option value="data">
            Data
          </option>
        </select>
      </div>
      <div class="f1 mr1">
        <label class="label tc300">Ordem</label>
        <select
          v-model="ordem"
          class="inputtext"
        >
          <option value="crescente">
            crescente
          </option>
          <option value="decrescente">
            decrescente
          </option>
        </select>
      </div>
      <LocalFilter
        v-model="listaFiltradaPorTermoDeBusca"
        class="f2"
        :lista="arquivosOrdenados"
      />
    </div>

    <Arvore
      :lista-de-diretórios="árvoreDeDiretórios"
      class="arvore-de-arquivos--raiz"
      :apenas-leitura="props.apenasLeitura"
      :arquivos-agrupados-por-caminho="arquivosAgrupadosPorCaminho"
      :rota-de-adição="props.rotaDeAdição"
      :rota-de-edição="props.rotaDeEdição"
      @apagar="($params) => $emit('apagar', $params)"
      @editar="($params) => $emit('editar', $params)"
    />

    <router-link
      v-if="props.rotaDeAdição"
      :to="props.rotaDeAdição"
      class="addlink mt1"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_+" />
      </svg>
      Adicionar arquivo
    </router-link>
  </div>
</template>
<style lang="less">
.gerenciador-de-arquivos {}
</style>
