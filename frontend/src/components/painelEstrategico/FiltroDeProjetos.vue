<template>
  <form
    class="flex flexwrap bottom mb2 g1"
    @submit.prevent="emit('enviado', dados)"
    @change="(ev) => emit('campoMudou', ev)"
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
        @change="(valor) => {
          projetoId.splice(0);
          emit('campoMudou', { portfolio_id: valor });
        }"
      />
      <ErrorComponent :erro="errosDePortfolios" />
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
        :grupo="projetosDisponiveis"
        label="nome"
        :aria-busy="chamadasPendentesDeProjetos.lista"
        :class="{ error: errosDeProjetos }"
        @change="(valor) => emit('campoMudou', { projeto_id: valor })"
      />
      <ErrorComponent :erro="errosDeProjetos" />
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
        :class="{ error: organs.error }"
        @change="(valor) => emit('campoMudou', { orgao_responsavel_id: valor })"
      />
      <ErrorComponent :erro="organs.error" />
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
import type { ProjetoDto } from '@back/pp/projeto/entities/projeto.entity';
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import { computed, onUnmounted, ref } from 'vue';
import type { LocationQueryValue } from 'vue-router';
import { useRoute } from 'vue-router';

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

const emit = defineEmits(['enviado', 'campoMudou']);

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
  projetosPorPortfolio,
  chamadasPendentes: chamadasPendentesDeProjetos,
  erro: errosDeProjetos,
} = storeToRefs(projetosStore);

const { organs } = storeToRefs(orgaosStore);

const orgaoResponsavelId: Ref<(number | string)[]> = ref([]);
const portfolioId: Ref<(number | string)[]> = ref([]);
const projetoId: Ref<(number | string)[]> = ref([]);

const projetosDisponiveis = computed((): ProjetoDto[] => {
  if (!portfolioId.value.length) {
    return listaDeProjetos.value;
  }

  return portfolioId.value.flatMap((id) => projetosPorPortfolio.value[id] || []);
});

const dados = computed(() => ({
  orgao_responsavel_id: orgaoResponsavelId.value,
  portfolio_id: portfolioId.value,
  projeto_id: projetoId.value,
}));

const listaDeOrgaos = computed(() => (Array.isArray(organs.value) ? organs.value : []));

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
  portfoliosStore.$reset();
  // Buscar os portfolios no endpoint que filtra por permissões. Por isso,
  // limpamos a lista para ter certeza.
  portfoliosStore.buscarTudo({}, true);

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

onUnmounted(() => {
  // limpando o store para evitar que os valores do endpoint alternativo fiquem salvos
  portfoliosStore.$reset();
});
</script>
