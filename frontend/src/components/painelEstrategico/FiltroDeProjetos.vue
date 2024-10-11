<template>
  <form
    class="flex flexwrap bottom mb2 g1"
    @submit.prevent="emit('enviado', dados)"
  >
    <div class="f1 fb15em">
      <label
        class="label"
        for="portfolio-id"
      >
        Portfolios
      </label>

      <AutocompleteField
        id="portfolio-id"
        name="portfolio_id"
        :class="{ error: errosDePortfolios }"
        :controlador="{
          busca: '',
          participantes: portfolioId || [],
        }"
        :grupo="listaDePortfolios"
        label="titulo"
        :aria-busy="chamadasPendentesDePortfolios.lista"
      />
    </div>

    <div class="f1 fb15em">
      <label
        class="label"
        for="projeto-id"
      >
        Projetos
      </label>

      <AutocompleteField
        id="projeto-id"
        name="projeto_id"
        :controlador="{
          busca: '',
          participantes: projetoId
        }"
        :grupo="listaDeProjetos"
        label="nome"
        :aria-busy="chamadasPendentesDeProjetos.lista"
        :class="{ error: errosDeProjetos }"
      />
    </div>

    <div class="f1 fb15em">
      <label
        class="label"
        for="orgao-responsavel-id"
      >
        Órgãos
      </label>

      <AutocompleteField
        id="orgao-responsavel-id"
        name="orgao_responsavel_id"
        :controlador="{
          busca: '',
          participantes: orgaoResponsavelId
        }"
        :grupo="listaDeOrgaos"
        label="sigla"
        :aria-busy="listaDeOrgaos.loading"
        :class="{ error: listaDeOrgaos.error }"
      />
    </div>
    <button
      class="btn outline bgnone tcprimary align-start mt2"
      type="submit"
    >
      Filtrar
    </button>
  </form>
</template>
<script setup lang="ts">
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { useOrgansStore } from '@/stores';
import { usePortfolioStore } from '@/stores/portfolios.store';
import { useProjetosStore } from '@/stores/projetos.store';
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { computed, ref } from 'vue';
import type { LocationQueryValue } from 'vue-router';
import { useRoute } from 'vue-router';

const rota = useRoute();
const orgaosStore = useOrgansStore();
const portfoliosStore = usePortfolioStore();
const projetosStore = useProjetosStore();

const {
  lista: listaDePortfolios,
  chamadasPendentes: chamadasPendentesDePortfolios,
  erro: errosDePortfolios,
} = storeToRefs(portfoliosStore);

const {
  lista: listaDeProjetos,
  chamadasPendentes: chamadasPendentesDeProjetos,
  erro: errosDeProjetos,
} = storeToRefs(projetosStore);

const { organs } = storeToRefs(orgaosStore);

const orgaoResponsavelId: Ref<(number | string)[]> = ref([]);
const portfolioId: Ref<(number | string)[]> = ref([]);
const projetoId: Ref<(number | string)[]> = ref([]);

const dados = computed(() => ({
  orgao_responsavel_id: orgaoResponsavelId.value,
  portfolio_id: portfolioId.value,
  projeto_id: projetoId.value,
}));

const listaDeOrgaos = computed(() => (Array.isArray(organs.value) ? organs.value : []));

defineProps({
  ariaBusy: {
    type: Boolean,
    default: false,
  },
  valoresIniciais: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['enviado']);

function prepararValoresComoNumeros(valor: LocationQueryValue | LocationQueryValue[]): number[] {
  const lista = Array.isArray(valor) ? valor : [valor];

  return lista.reduce((acc, cur) => {
    const numeroConvertido = parseInt(cur as string, 10);
    if (Number.isNaN(numeroConvertido)) {
      return acc;
    }
    acc.push(numeroConvertido);
    return acc;
  }, [] as number[]);
}

function iniciar() {
  if (!listaDePortfolios.value.length && !chamadasPendentesDePortfolios.value.lista) {
    portfoliosStore.buscarTudo();
  }

  if (!listaDeProjetos.value.length && !chamadasPendentesDeProjetos.value.lista) {
    projetosStore.buscarTudo();
  }

  if (
    (!Array.isArray(organs.value) || !organs.value.length)
    && !organs.value?.loading
  ) {
    orgaosStore.getAll();
  }

  if (rota.query) {
    Object.keys(rota.query).forEach((chave) => {
      switch (chave) {
        case 'orgao_responsavel_id':
          orgaoResponsavelId.value = prepararValoresComoNumeros(rota.query.orgao_responsavel_id);
          break;

        case 'portfolio_id':
          portfolioId.value = prepararValoresComoNumeros(rota.query.portfolio_id);
          break;

        case 'projeto_id':
          projetoId.value = prepararValoresComoNumeros(rota.query.projeto_id);
          break;

        default:
          break;
      }
    });
  }
}

iniciar();
</script>
