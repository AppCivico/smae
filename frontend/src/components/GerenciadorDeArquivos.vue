<script setup>
import {
  computed, defineAsyncComponent, ref, watchEffect,
} from 'vue';

import LoadingComponent from '@/components/LoadingComponent.vue';
import LocalFilter from '@/components/LocalFilter.vue';
import consolidarDiretorios from '@/helpers/consolidarDiretorios';
import createDataTree from '@/helpers/createDataTree.ts';
import normalizarCaminho from '@/helpers/normalizarCaminho.ts';
import requestS from '@/helpers/requestS.ts';

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

const diretorios = ref([]);
const listaFiltradaPorTermoDeBusca = ref([]);
const chamadasPendentes = ref({
  diretorios: false,
});
const ordenadoPor = ref('descricao');
const ordem = ref('crescente');
const erros = ref({
  diretorios: null,
});

const arquivosOrdenados = computed(() => props.arquivos.slice()
  .sort((a, b) => {
    if (a[ordenadoPor.value] || b[ordenadoPor.value]) {
      return ordem.value === 'crescente'
        ? (a[ordenadoPor.value] ?? '').localeCompare((b[ordenadoPor.value] ?? ''))
        : (b[ordenadoPor.value] ?? '').localeCompare((a[ordenadoPor.value] ?? ''));
    }
    return 0;
  }));

const arquivosAgrupadosPorCaminho = computed(() => Object
  .groupBy(
    listaFiltradaPorTermoDeBusca.value,
    (item) => normalizarCaminho(item.arquivo.diretorio_caminho),
  ));

const diretoriosConsolidados = computed(() => consolidarDiretorios(
  [].concat(
    diretorios.value.map((dir) => dir.caminho),
    props.arquivos.map((arq) => arq.arquivo?.diretorio_caminho || '/'),
  ),
));

const árvoreDeDiretórios = computed(() => createDataTree(diretoriosConsolidados.value, { parentPropertyName: 'pai' }) || []);

// Buscar lista de diretórios. Só é necessário se formos mostrar possíveis
// vazios, se não podemos extrair todos dos arquivos.
watchEffect(async () => {
  erros.value.diretorios = null;

  if (props.parâmetrosDeDiretórios) {
    chamadasPendentes.value.diretorios = true;

    try {
      const { linhas } = typeof props.parâmetrosDeDiretórios === 'object'
        ? await requestS.get(`${baseUrl}/diretorio`, props.parâmetrosDeDiretórios)
        : await requestS.get(`${baseUrl}/diretorio`);

      diretorios.value = linhas;
    } catch (erro) {
      erros.value.diretorios = erro;
    } finally {
      chamadasPendentes.value.diretorios = false;
    }
  } else {
    diretorios.value.splice(0);
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
    >
      <template #nome-diretorio="slotProps">
        <slot
          name="nome-diretorio"
          v-bind="slotProps"
        />
      </template>
      <template #nome-arquivo="slotProps">
        <slot
          name="nome-arquivo"
          v-bind="slotProps"
        />
      </template>
    </Arvore>

    <SmaeLink
      v-if="props.rotaDeAdição && !$props.apenasLeitura"
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
