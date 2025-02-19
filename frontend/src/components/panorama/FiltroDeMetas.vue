<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import truncate from '@/helpers/texto/truncate';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const panoramaStore = usePanoramaStore();
const { dadosParaFiltro, chamadasPendentes } = storeToRefs(panoramaStore);

const PdmStore = usePdMStore();
const { activePdm } = storeToRefs(PdmStore);

const route = useRoute();
const router = useRouter();

const dadosParaFiltros = computed(() => {
  const órgãos = {};
  const coordenadoresCp = {};
  const metas = {};

  if (Array.isArray(dadosParaFiltro.value)) {
    dadosParaFiltro.value.forEach((x) => {
      metas[x.id] = { ...x };
      metas[x.id].órgãos = [];
      metas[x.id].pessoas = [];
      metas[x.id].etiqueta = `${x.codigo} - ${truncate(x.titulo, 36)}`;

      x.orgaos_participantes.forEach((y) => {
        metas[x.id].órgãos.push(y.orgao.id);

        if (!órgãos[y.orgao.id]) {
          órgãos[y.orgao.id] = { ...y.orgao, pessoas: {} };
          órgãos[y.orgao.id].etiqueta = `${y.orgao.sigla} - ${truncate(y.orgao.descricao, 36)}`;
        }

        x.coordenadores_cp.forEach((z) => {
          if (!órgãos[y.orgao.id].pessoas[z.id]) {
            órgãos[y.orgao.id].pessoas[z.id] = true;
          }
        });
      });

      x.coordenadores_cp.forEach((y) => {
        metas[x.id].pessoas.push(y.id);
        if (!coordenadoresCp[y.id]) {
          coordenadoresCp[y.id] = { ...y, órgãosEnvolvidosEmMetas: {} };
        }

        x.orgaos_participantes.forEach((z) => {
          if (!coordenadoresCp[y.id].órgãosEnvolvidosEmMetas[z.orgao.id]) {
            coordenadoresCp[y.id].órgãosEnvolvidosEmMetas[z.orgao.id] = true;
          }
        });
      });
    });
  }

  return {
    metas: Object.values(metas)
      .sort((a, b) => a.codigo - b.codigo),
    órgãos: Object.values(órgãos)
      .map((x) => ({ ...x, pessoas: Object.keys(x.pessoas) }))
      .sort((a, b) => a.sigla.localeCompare(b.sigla)),
    coordenadoresCp: Object.values(coordenadoresCp)
      .map((x) => ({ ...x, órgãosEnvolvidosEmMetas: Object.keys(x.órgãosEnvolvidosEmMetas) }))
      .sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao)),
  };
});

const valoresSelecionados = computed(() => {
  const {
    coordenadores_cp: coordenadoresCp = [],
    metas = [],
    orgaos: órgãos = [],
  } = route.query;

  return {
    coordenadoresCp: (Array.isArray(coordenadoresCp)
      ? coordenadoresCp
      : [coordenadoresCp]).map((x) => Number(x)),
    metas: (Array.isArray(metas)
      ? metas
      : [metas]).map((x) => Number(x)),
    órgãos: (Array.isArray(órgãos)
      ? órgãos
      : [órgãos]).map((x) => Number(x)),
  };
});

const filtrosLimpos = computed(() => ({
  metas: dadosParaFiltros.value.metas,
  órgãos: valoresSelecionados.value.coordenadoresCp.length
    ? dadosParaFiltros.value.órgãos
      .filter((x) => x.pessoas.some((y) => valoresSelecionados.value.coordenadoresCp
        .indexOf(Number(y)) !== -1))
    : dadosParaFiltros.value.órgãos,
  coordenadoresCp: valoresSelecionados.value.órgãos.length
    ? dadosParaFiltros.value.coordenadoresCp
      .filter((x) => x.órgãosEnvolvidosEmMetas.some((y) => valoresSelecionados.value.órgãos
        .indexOf(Number(y)) !== -1))
    : dadosParaFiltros.value.coordenadoresCp,
}));

function atualizarFiltro(chave, valor) {
  router.replace({
    query: {
      ...route.query,
      [chave]: valor || undefined,
    },
  });
}

async function iniciar() {
  if (!activePdm.value.id) {
    await PdmStore.getActive();
  }

  panoramaStore.buscarFiltro({ pdm_id: activePdm.value.id });
}

iniciar();
</script>
<template>
  <LoadingComponent v-if="chamadasPendentes.filtro" />

  <form
    v-else
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
      <AutocompleteField
        id="filtro-de-metas"
        :disabled="!dadosParaFiltros.metas.length"
        class="inputtext light mb1"
        name="filtro-de-metas"
        :controlador="{ busca: '', participantes: valoresSelecionados.metas || [] }"
        :grupo="filtrosLimpos.metas"
        label="etiqueta"
        @change="(valor) => { atualizarFiltro('metas', valor); }"
      />
    </div>
    <div class="mb1">
      <label
        for="filtro-de-orgaos"
        class="label tc300"
      >Órgão</label>
      <AutocompleteField
        id="filtro-de-orgaos"
        class="inputtext light mb1"
        name="filtro-de-orgaos"
        :disabled="!dadosParaFiltros.órgãos.length || $route.query.meta"
        :controlador="{ busca: '', participantes: valoresSelecionados.órgãos || [] }"
        :grupo="filtrosLimpos.órgãos"
        label="etiqueta"
        @change="(valor) => { atualizarFiltro('orgaos', valor); }"
      />
    </div>
    <div class="mb1">
      <label
        for="filtro-de-coordenadores-cp"
        class="label tc300"
      >Coordenadores</label>
      <AutocompleteField
        id="filtro-de-coordenadores-cp"
        class="inputtext light mb1"
        name="filtro-de-coordenadores-cp"
        :disabled="!dadosParaFiltros.coordenadoresCp.length || $route.query.meta"
        :controlador="{ busca: '', participantes: valoresSelecionados.coordenadoresCp || [] }"
        :grupo="filtrosLimpos.coordenadoresCp"
        label="nome_exibicao"
        @change="(valor) => { atualizarFiltro('coordenadores_cp', valor); }"
      />
    </div>
  </form>
</template>
