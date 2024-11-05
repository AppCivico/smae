<script setup>
import LoadingComponent from '@/components/LoadingComponent.vue';
import LocalFilter from '@/components/LocalFilter.vue';
import consolidarDiretorios from '@/helpers/consolidarDiretorios';
import createDataTree from '@/helpers/createDataTree.ts';
import requestS from '@/helpers/requestS.ts';
import {
  computed, defineAsyncComponent, ref, watchEffect,
} from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const Arvore = defineAsyncComponent({
  loader: () => import('./ArvoreDeArquivos.vue'),
  loadingComponent: LoadingComponent,
});

const props = defineProps({
  arquivos: {
    type: Array,
    required: true,
  },
  // Você pode enviar:
  // - `true` para carregar todos os diretórios
  // - um objeto que será enviado na requisição de carga de diretórios
  parâmetrosDeDiretórios: {
    type: [
      Boolean,
      Object,
    ],
    default: undefined,
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

const diretórios = ref([]);
const listaFiltradaPorTermoDeBusca = ref([]);
const chamadasPendentes = ref({
  diretórios: false,
});
const ordenadoPor = ref('descricao');
const ordem = ref('crescente');
const erros = ref({
  diretórios: null,
});

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
  diretórios.value,
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

watchEffect(async () => {
  erros.value.diretórios = null;

  if (props.parâmetrosDeDiretórios) {
    chamadasPendentes.value.diretórios = true;

    try {
      const { linhas } = typeof props.parâmetrosDeDiretórios === 'object'
        ? await requestS.get(`${baseUrl}/diretorio`, props.parâmetrosDeDiretórios)
        : await requestS.get(`${baseUrl}/diretorio`);

      diretórios.value = linhas;
    } catch (erro) {
      erros.value.diretórios = erro;
    } finally {
      chamadasPendentes.value.diretórios = false;
    }
  } else {
    diretórios.value.splice(0);
  }
});
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

    <SmaeLink
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
    </SmaeLink>
  </div>
</template>
<style lang="less">
.gerenciador-de-arquivos {}
</style>
