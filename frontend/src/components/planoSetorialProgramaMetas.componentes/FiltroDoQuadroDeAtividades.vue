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
        :aria-disabled="listaDePlanoSetoriais.length < 2"
        @change="(valor) => { emit('campoMudou', { pdm_id: valor }); }"
      >
        <option
          v-for="item in listaDePlanoSetoriais"
          :key="item.id"
          :value="item.id"
          :hidden="item.sistema === 'PDM'"
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
  onMounted,
  ref,
} from 'vue';
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

const dados = ref<Dados>({
  orgao_id: [],
  pdm_id: 0,
  equipes: [],
  visao_pessoal: true,
});

onMounted(() => {
  const valoresNaQuery = route.query as Record<string, unknown>;

  Object.keys(dados.value).forEach(async (chave) => {
    let valorNaQuery = valoresNaQuery[chave];

    if (!valorNaQuery) {
      if (chave !== 'pdm_id') {
        return;
      }

      if (!planoAtivo.value) {
        await planosSetoriaisStore.buscarTudo();
      }

      if (!planoAtivo.value) {
        return;
      }

      await router.replace({
        query: {
          ...structuredClone(route.query), // para não dar bug com propriedades com arrays
          pdm_id: planoAtivo.value.id,
        },
      });
      valorNaQuery = route.query.pdm_id;
      dados.value.pdm_id = valorNaQuery as number;
    }

    if (dados.value[chave as ChaveDeDados] !== valorNaQuery) {
      if (['orgao_id', 'equipes'].includes(chave)) {
        (dados.value[chave as ChaveDeDados] as Dados['orgao_id'] | Dados['orgao_id']) = Array.isArray(valorNaQuery)
          ? valorNaQuery as number[]
          : [valorNaQuery] as number[];
      } else if (chave === 'pdm_id') {
        dados.value.pdm_id = valorNaQuery as number;
      } else if (chave === 'visao_pessoal') {
        dados.value.visao_pessoal = typeof valorNaQuery === 'boolean'
          ? valorNaQuery
          : valorNaQuery === 'true';
      }
    }
  });

  if (!listaDePlanoSetoriais.value.length && !chamadasPendentesDePlanoSetoriais.value.lista) {
    planosSetoriaisStore.buscarTudo();
  }

  if (!listaDeEquipes.value.length && !chamadasPendentesDeEquipes.value.lista) {
    equipesStore.buscarTudo();
  }

  if (
    (!Array.isArray(organs.value) || !organs.value.length)
    && !organs.value?.loading
  ) {
    orgaosStore.getAll();
  }
});
</script>
<style lang="less" scoped></style>
