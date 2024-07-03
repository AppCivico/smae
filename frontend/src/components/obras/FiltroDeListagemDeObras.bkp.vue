<template>
  <form
    action=""
    method="get"
    @submit.prevent="aplicarFiltros"
  >
    <div class="flex flexwrap end g2 mb2">
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="portfolio-id"
        >
          {{ schema.fields.portfolio_id.spec.label }}
        </label>
        <select
          id="portfolio-id"
          name="portfolio_id"
          class="inputtext light"
          :aria-busy="chamadasPendentesDePortfolios.lista"
          :class="{ error: errosDePortfolios.emFoco }"
        >
          <option value="" />
          <option
            v-for="portfolio in listaDePortfolios"
            :key="portfolio.id"
            :value="portfolio.id"
            :selected="Number($route.query.portfolio_id) === portfolio.id"
          >
            {{ portfolio.titulo }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="orgao-origem-id"
        >
          {{ schema.fields.orgao_origem_id.spec.label }}
        </label>
        <select
          id="orgao-origem-id"
          name="orgao_origem_id"
          class="inputtext light"
          :aria-busy="organs.loading"
          :class="{ error: organs.error }"
        >
          <option value="" />
          <option
            v-for="orgao in órgãosComoLista"
            :key="orgao.id"
            :value="orgao.id"
            :selected="Number($route.query.orgao_origem_id) === orgao.id"
          >
            {{ orgao.sigla }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="grupo-tematico-id"
        >
          {{ schema.fields.grupo_tematico_id.spec.label }}
        </label>
        <select
          id="grupo-tematico-id"
          name="grupo_tematico_id"
          class="inputtext light"
          :aria-busy="chamadasPendentesDeGruposTemáticos.lista"
          :class="{ error: erroDeGrupoTemático }"
        >
          <option value="" />
          <option
            v-for="grupoTematico in listaDeGruposTemáticos"
            :key="grupoTematico.id"
            :value="grupoTematico.id"
            :selected="Number($route.query.grupo_tematico_id) === grupoTematico.id"
          >
            {{ grupoTematico.nome }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="equipamento-id"
        >
          {{ schema.fields.equipamento_id.spec.label }}
        </label>
        <select
          id="equipamento-id"
          name="equipamento_id"
          class="inputtext light"
          :aria-busy="chamadasPendentesDeEquipamentos.lista"
          :class="{ error: erroDeEquipamentos }"
        >
          <option value="" />
          <option
            v-for="equipamento in listaDeEquipamentos"
            :key="equipamento.id"
            :value="equipamento.id"
            :selected="Number($route.query.equipamento_id) === equipamento.id"
          >
            {{ equipamento.nome }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="regiao-ids"
        >
          {{ schema.fields.regiao_ids.spec.label }}
        </label>
        <select
          id="regiao-ids"
          name="regiao_ids"
          class="inputtext light"
          :aria-busy="regions.loading"
        >
          <option value="" />
          <option
            v-for="regiao in regiõesPorNível[3]"
            :key="regiao.id"
            :value="regiao.id"
          >
            {{ regiao.descricao }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="status"
        >
          {{ schema.fields.status.spec.label }}
        </label>
        <select
          id="status"
          name="status"
          class="inputtext light"
        >
          <option value="" />

          <option
            v-for="item in statusObras"
            :key="item.valor"
            :value="item.valor"
            :disabled="!Object.keys(statusObras).length"
            :selected="$route.query.status === item.valor"
          >
            {{ item.nome }}
          </option>
        </select>
      </div>
    </div>
    <div class="flex flexwrap end g2 mb2">
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="ordem-coluna"
        >Coluna</label>
        <select
          id="ordem-coluna"
          class="inputtext light"
          name="ordem_coluna"
        >
          <option value="" />
          <option
            v-for="coluna in colunasParaOrdenacao"
            :key="coluna.valor"
            :value="coluna.valor"
            :selected="Number($route.query.ordem_coluna) === coluna.valor"
          >
            {{ coluna.nome }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="ordem-direcao"
        >Direção</label>
        <select
          id="ordem-direcao"
          class="inputtext light"
          name="ordem_direcao"
        >
          <option value="" />
          <option
            v-for="direcao in
              Object.values(direcoesDeOrdenacao)"
            :key="direcao.valor"
            :value="direcao.valor"
          >
            {{ direcao.nome || direcao.valor }}
          </option>
        </select>
      </div>
      <div class="f1 fb10em">
        <label
          class="label tc300"
          for="itens-por-pagina"
        >Itens por página</label>
        <select
          id="itens-por-pagina"
          class="inputtext light"
          name="ipp"
        >
          <option
            v-for="quantidade in itensPorPagina"
            :key="quantidade"
            :value="quantidade"
          >
            {{ quantidade }}
          </option>
        </select>
      </div>

      <button
        type="submit"
        class="btn outline bgnone tcprimary mtauto align-end"
      >
        Filtrar
      </button>
    </div>
  </form>
</template>
<script setup>
import direcoesDeOrdenacao from '@/consts/direcoesDeOrdenacao';
import { obras as schema } from '@/consts/formSchemas';
import statusObras from '@/consts/statusObras';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const colunasParaOrdenacao = {
  id: {
    valor: 'id',
    nome: 'ID',
  },
  nome: {
    valor: 'nome',
    nome: schema.fields.nome?.spec.label,
  },
  codigo: {
    valor: 'codigo',
    nome: 'Código',
  },
  portfolio_titulo: {
    valor: 'portfolio_titulo',
    nome: schema.fields.portfolio_id?.spec.label,
  },
  grupo_tematico_nome: {
    valor: 'grupo_tematico_nome',
    nome: schema.fields.grupo_tematico_id?.spec.label,
  },
  tipo_intervencao_nome: {
    valor: 'tipo_intervencao_nome',
    nome: schema.fields.tipo_intervencao_id?.spec.label,
  },
  equipamento_nome: {
    valor: 'equipamento_nome',
    nome: schema.fields.equipamento_id?.spec.label,
  },
  orgao_origem_nome: {
    valor: 'orgao_origem_nome',
    nome: schema.fields.orgao_origem_id?.spec.label,
  },
  regioes: {
    valor: 'regioes',
    nome: schema.fields.regiao_ids?.spec.label,
  },
  status: {
    valor: 'status',
    nome: schema.fields.status?.spec.label,
  },
  registrado_em: {
    valor: 'registrado_em',
    nome: 'Data de registro',
  },
};

const itensPorPagina = [
  10,
  25,
  50,
  100,
];

const props = defineProps({
  valoresPadrao: {
    type: Object,
    default: () => ({}),
  },
});

const route = useRoute();
const router = useRouter();

const ÓrgãosStore = useOrgansStore();
const equipamentosStore = useEquipamentosStore();
const gruposTematicosStore = useGruposTematicosStore();
const portfolioMdoStore = usePortfolioObraStore();
const regionsStore = useRegionsStore();

const {
  lista: listaDeEquipamentos,
  chamadasPendentes: chamadasPendentesDeEquipamentos,
  erro: erroDeEquipamentos,
} = storeToRefs(equipamentosStore);

const {
  lista: listaDeGruposTemáticos,
  chamadasPendentes: chamadasPendentesDeGruposTemáticos,
  erro: erroDeGrupoTemático,
} = storeToRefs(gruposTematicosStore);

const {
  órgãosComoLista,
  organs,
} = storeToRefs(ÓrgãosStore);
const {
  lista: listaDePortfolios,
  chamadasPendentes: chamadasPendentesDePortfolios,
  erros: errosDePortfolios,
} = storeToRefs(portfolioMdoStore);
const {
  regions, regiõesPorId, regiõesPorNível, regiõesPorMãe,
} = storeToRefs(regionsStore);

const pronto = ref(false);

function iniciar() {
  const promessas = [
    portfolioMdoStore.buscarTudo(),
    equipamentosStore.buscarTudo(),
    gruposTematicosStore.buscarTudo(),
    ÓrgãosStore.getAll(),
    regionsStore.getAll(),
  ];

  Promise.allSettled(promessas)
    .then(() => {
      pronto.value = true;
    });
}

function aplicarFiltros(event) {
  const query = {};

  let i = 0;

  while (event.target.elements[i]) {
    if (event.target.elements[i].value) {
      query[event.target.elements[i].name] = event.target.elements[i].value || props.valoresPadrao[event.target.elements[i].name];
    }
    i += 1;
  }

  // Update the route with the query strings
  router.replace({ ...route.query, query });
}

iniciar();
</script>
