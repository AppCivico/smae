<script setup>
import truncate from '@/helpers/truncate';
import { useRoute, useRouter } from 'vue-router';
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const MetasStore = useMetasStore();
const { Metas } = storeToRefs(MetasStore);

const route = useRoute();
const router = useRouter();

const dadosParaFiltros = computed(() => {
  const órgãos = {};
  const coordenadoresCp = {};
  const metas = {};

  if (Array.isArray(Metas.value)) {
    Metas.value.forEach((x) => {
      metas[x.id] = { ...x };
      metas[x.id].órgãos = [];
      metas[x.id].pessoas = [];

      x.orgaos_participantes.forEach((y) => {
        metas[x.id].órgãos.push(y.orgao.id);

        if (!órgãos[y.orgao.id]) {
          órgãos[y.orgao.id] = { ...y.orgao, pessoas: {} };
        }

        y.participantes.forEach((z) => {
          if (!órgãos[y.orgao.id].pessoas[z.id]) {
            órgãos[y.orgao.id].pessoas[z.id] = true;
          }
        });
      });

      x.coordenadores_cp.forEach((z) => {
        metas[x.id].pessoas.push(z.id);
        if (!coordenadoresCp[z.id]) {
          coordenadoresCp[z.id] = { ...z, órgãosEnvolvidosEmMetas: {} };
        }

        x.orgaos_participantes.forEach((y) => {
          if (!coordenadoresCp[z.id].órgãosEnvolvidosEmMetas[y.orgao.id]) {
            coordenadoresCp[z.id].órgãosEnvolvidosEmMetas[y.orgao.id] = true;
          }
        });
      });
    });
  }

  return {
    metas: Object.values(metas)
      .sort((a, b) => a.titulo.localeCompare(b.titulo)),
    órgãos: Object.values(órgãos)
      .map((x) => ({ ...x, pessoas: Object.keys(x.pessoas) }))
      .sort((a, b) => a.sigla.localeCompare(b.sigla)),
    coordenadoresCp: Object.values(coordenadoresCp)
      .map((x) => ({ ...x, órgãosEnvolvidosEmMetas: Object.keys(x.órgãosEnvolvidosEmMetas) }))
      .sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao)),
  };
});

function atualizarFiltro(chave, valor) {
  router.replace({
    query: {
      ...route.query,
      [chave]: valor || undefined,
    },
  });
}

if (!Array.isArray(Metas.value) || !Metas.value.length) {
  MetasStore.getAll();
}
</script>
<template>
  <form
    class="mb2"
    @submit.prevent
  >
    <legend class="tprimary mb1 w700 t16">
      Filtros
    </legend>

    <div class="mb1">
      <label
        for="filtro-de-metas"
        class="label tc300"
      >Metas</label>
      <select
        id="filtro-de-metas"
        :disabled="!dadosParaFiltros.metas.length"
        class="inputtext light mb1"
        name="filtro-de-metas"
        @change="({ target }) => {
          atualizarFiltro('metas', target.value);
        }"
      >
        <option value="" />
        <option
          v-for="item in dadosParaFiltros.metas"
          :key="item.id"
          :selected="Number($route.query.metas) === item.id"
          :value="item.id"
          :title="item.titulo?.length > 36 ? item.titulo : undefined"
          :hidden="($route.query.coordenadores_cp
            && !item.pessoas.includes(Number($route.query.coordenadores_cp)))
            || ($route.query.orgaos
              && !item.órgãos.includes(Number($route.query.orgaos)))"
        >
          {{ item.codigo }} - {{ truncate(item.titulo, 36) }}
        </option>
      </select>
    </div>
    <div class="mb1">
      <label
        for="filtro-de-orgaos"
        class="label tc300"
      >Órgão</label>
      <select
        id="filtro-de-orgaos"
        class="inputtext light mb1"
        name="filtro-de-orgaos"
        :disabled="!dadosParaFiltros.órgãos.length || $route.query.meta"
        @change="({ target }) => {
          atualizarFiltro('orgaos', target.value);
        }"
      >
        <option value="" />
        <option
          v-for="item in dadosParaFiltros.órgãos"
          :key="item.id"
          :selected="Number($route.query.orgaos) === item.id"
          :value="item.id"
          :hidden="$route.query.coordenadores_cp
            && !item.pessoas.includes($route.query.coordenadores_cp)"
          :title="item.descricao?.length > 36 ? item.descricao : undefined"
        >
          {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
        </option>
      </select>
    </div>
    <div class="mb1">
      <label
        for="filtro-de-coordenadores-cp"
        class="label tc300"
      >Responsável</label>
      <select
        id="filtro-de-coordenadores-cp"
        class="inputtext light mb1"
        name="filtro-de-coordenadores-cp"
        :disabled="!dadosParaFiltros.coordenadoresCp.length || $route.query.meta"
        @change="({ target }) => {
          atualizarFiltro('coordenadores_cp', target.value);
        }"
      >
        <option value="" />
        <option
          v-for="item in dadosParaFiltros.coordenadoresCp"
          :key="item.id"
          :selected="Number($route.query.coordenadores_cp) === item.id"
          :value="item.id"
          :hidden="$route.query.orgaos
            && !item.órgãosEnvolvidosEmMetas.includes($route.query.orgaos)"
        >
          {{ item.nome_exibicao }}
        </option>
      </select>
    </div>
  </form>
</template>
