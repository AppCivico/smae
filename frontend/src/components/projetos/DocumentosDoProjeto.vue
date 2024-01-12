<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import createDataTree from '@/helpers/createDataTree.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import ArvoreDeArquivos from './ArvoreDeArquivos.vue';

const alertStore = useAlertStore();
const projetosStore = useProjetosStore();
const {
  chamadasPendentes,
  arquivos,
  diretóriosConsolidados,
  erro,
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

const ordenadoPor = ref('descricao');
const ordem = ref('crescente');

const arquivosOrdenados = computed(() => [...arquivos.value]
  .sort((a, b) => {
    if (a[ordenadoPor.value] || b[ordenadoPor.value]) {
      return ordem.value === 'crescente'
        ? (a[ordenadoPor.value] || '').localeCompare((b[ordenadoPor.value] || ''))
        : (b[ordenadoPor.value] || '').localeCompare((a[ordenadoPor.value] || ''));
    }
    return 0;
  }));

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

const listaFiltradaPorTermoDeBusca = ref([]);

const arquivosAgrupadosPorCaminho = computed(() => listaFiltradaPorTermoDeBusca.value
  .reduce((acc, cur) => {
    const caminho = (cur?.arquivo?.diretorio_caminho || '/');

    acc[caminho] = !acc[caminho]
      ? [cur]
      : acc[caminho].concat([cur]);
    return acc;
  }, {})

  || {});

function excluirArquivo(id) {
  alertStore.confirmAction('Deseja remover o arquivo?', () => {
    projetosStore.excluirArquivo(id);
  }, 'Remover');
}

function iniciar() {
  projetosStore.buscarDiretórios();
  projetosStore.buscarArquivos();
}

iniciar();
</script>
<template>
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

  <div
    v-if="chamadasPendentes?.arquivos"
    class="spinner mb1"
  >
    Carregando
  </div>

  <ArvoreDeArquivos
    :lista-de-diretórios="árvoreDeDiretórios"
    class="mb1 arvore-de-arquivos--raiz"
    :apenas-leitura="permissõesDoProjetoEmFoco.apenas_leitura
      || !permissõesDoProjetoEmFoco.sou_responsavel"
    :arquivos-agrupados-por-caminho="arquivosAgrupadosPorCaminho"
    @apagar="($params) => excluirArquivo($params)"
  />

  <router-link
    :to="{
      name: 'projetosNovoDocumento'
    }"
    class="addlink mb1"
  >
    <svg
      width="20"
      height="20"
    >
      <use xlink:href="#i_+" />
    </svg>
    Adicionar arquivo
  </router-link>

  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>

  <div
    v-if="chamadasPendentes?.arquivos"
    class="spinner mb1"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
