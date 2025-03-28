<template>
  <form
    class="flex flexwrap bottom mb2 g1 filtro"
    @submit.prevent="dados.pdm_id ? emit('enviado', dados) : null"
    @change="(ev) => emit('campoMudou', ev)"
  >
    <div class="f1 fb15em">
      <label
        class="label"
        for="plano-setorial-id"
      >
        {{ $route.meta.tituloPlural || 'Plano Setoriais / Programa de Metas' }}&nbsp;<span
          class="tvermelho"
        >*</span>
      </label>

      <select
        id="plano-setorial-id"
        v-model="dados.pdm_id"
        class="inputtext light"
        name="pdm_id"
        :class="{ error: errosDePlanoSetorial.lista }"
        :aria-busy="chamadasPendentesDePlanoSetoriais.lista"
        :aria-disabled="planosSetoriaisOuPdMNovos.length < 2"
        @change="(valor) => { emit('campoMudou', { pdm_id: valor }); }"
      >
        <option
          v-for="item in planosSetoriaisOuPdMNovos"
          :key="item.id"
          :value="item.id"
        >
          {{ item.nome }}
        </option>
      </select>

      <ErrorComponent :erro="errosDePlanoSetorial.lista" />
    </div>

    <div class="f1 fb10em">
      <label
        class="label"
        for="orgao-responsavel-id"
      >
        Órgãos
      </label>

      <AutocompleteField
        id="orgao-responsavel-id"
        name="orgao_id"
        :controlador="{
          busca: '',
          participantes: dados?.orgao_id
        }"
        :grupo="órgãosComoLista"
        label="sigla"
        :aria-busy="organs.loading"
        :class="{ error: organs.error }"
        @change="(valor) => emit('campoMudou', { orgao_id: valor })"
      />
      <ErrorComponent :erro="organs.error" />
    </div>

    <div class="f1 fb15em">
      <label
        class="label"
        for="equipe-id"
      >
        Equipes
      </label>

      <AutocompleteField
        id="equipe-id"
        name="equipes"
        :controlador="{
          busca: '',
          participantes: dados?.equipes
        }"
        :grupo="listaDeEquipes"
        label="titulo"
        :aria-busy="chamadasPendentesDeEquipes.lista"
        :class="{ error: erroDeEquipes }"
        @change="(valor) => emit('campoMudou', { equipes: valor })"
      />
      <ErrorComponent :erro="erroDeEquipes" />
    </div>

    <div class="f1 fb5em">
      <label
        class="label"
        for="visao-pessoal"
      >
        Visão
      </label>
      <select
        id="visao-pessoal"
        v-model="dados.visao_pessoal"
        class="inputtext light"
        name="visao_pessoal"
      >
        <option :value="true">
          pessoal
        </option>
        <option :value="false">
          administrativa
        </option>
      </select>
    </div>
    <button
      class="btn align-start mt2"
      type="submit"
      :aria-disabled="!dados.pdm_id"
    >
      Filtrar
    </button>
  </form>
</template>
<script setup lang="ts">
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { useOrgansStore } from '@/stores';
import { useEquipesStore } from '@/stores/equipes.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import { storeToRefs } from 'pinia';
import {
  computed,
  onMounted,
  ref,
  toRaw,
  watch,
} from 'vue';
import type { LocationQueryRaw } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';

defineProps({
  ariaBusy: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const route = useRoute();

const emit = defineEmits(['enviado', 'campoMudou']);

const orgaosStore = useOrgansStore();
const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
const equipesStore = useEquipesStore();

const { planoAtivo } = storeToRefs(planosSetoriaisStore);

const {
  lista: listaDePlanoSetoriais,
  chamadasPendentes: chamadasPendentesDePlanoSetoriais,
  erros: errosDePlanoSetorial,
} = storeToRefs(planosSetoriaisStore);

const {
  lista: listaDeEquipes,
  chamadasPendentes: chamadasPendentesDeEquipes,
  erro: erroDeEquipes,
} = storeToRefs(equipesStore);

const { organs, órgãosComoLista } = storeToRefs(orgaosStore);

type Dados = {
  orgao_id: number[];
  pdm_id: number;
  equipes: number[];
  visao_pessoal: boolean;
};

type ChaveDeDados = keyof Dados;

const camposObrigatorios = ['pdm_id'];

const dados = ref<Dados>({
  orgao_id: [],
  pdm_id: 0,
  equipes: [],
  visao_pessoal: true,
});

const planosSetoriaisOuPdMNovos = computed(() => listaDePlanoSetoriais.value
  .filter((item) => item.sistema !== 'PDM'));

async function iniciar() {
  const valoresNaQuery = {
    ...structuredClone(route.query),
  } as Record<string, unknown>;

  Object.keys(dados.value).forEach(async (chave) => {
    const valorNaQuery = valoresNaQuery[chave];
    const valorInicial = dados.value[chave as ChaveDeDados];

    // entre os valores _falsy_, bolleans são aceitos
    if (valorNaQuery || valorNaQuery === false) {
      if (Array.isArray(valorInicial)) {
        if (Array.isArray(valorNaQuery)) {
          dados.value[chave as keyof Dados] = structuredClone(valorNaQuery) as number[];
        } else {
          dados.value[chave as keyof Dados] = [valorNaQuery];
        }
      } else {
        dados.value[chave as keyof Dados] = structuredClone(valorNaQuery);
      }
    }
  });

  if (!listaDeEquipes.value.length && !chamadasPendentesDeEquipes.value.lista) {
    equipesStore.buscarTudo();
  }

  if (
    (!Array.isArray(organs.value) || !organs.value.length)
    && !organs.value?.loading
  ) {
    orgaosStore.getAll();
  }

  if (!listaDePlanoSetoriais.value.length && !chamadasPendentesDePlanoSetoriais.value.lista) {
    await planosSetoriaisStore.buscarTudo();
  }

  if (!dados.value.pdm_id) {
    if (planoAtivo.value?.id && planoAtivo.value?.sistema !== 'PDM') {
      dados.value.pdm_id = planoAtivo.value.id;
    } else if (planosSetoriaisOuPdMNovos.value.length === 1) {
      dados.value.pdm_id = planosSetoriaisOuPdMNovos.value[0].id;
    }
  }

  router.replace({
    query: {
      ...structuredClone(route.query),
      ...structuredClone(toRaw(dados.value)),
    } as unknown as LocationQueryRaw,
  });
}

onMounted(() => {
  iniciar();
});

camposObrigatorios.forEach((chave) => {
  watch(() => dados.value[chave as ChaveDeDados], (val) => {
    if (!val) {
      iniciar();
    }
  });
});
</script>
<style lang="less" scoped></style>
