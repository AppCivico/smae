<template>
  <FormularioQueryString
    :aria-busy="props.ariaBusy || !pronto"
    :valores-padrao="{
      ordem_coluna: 'id',
      ordem_direcao: 'asc',
      ipp: gblIpp,
      pagina: 1,
    }"
  >
    <div class="flex flexwrap end g2 mb1 fb100">
      <div class="f1 fb10em">
        <label
          class="label"
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
          class="label"
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
          class="label"
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
          class="label"
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
          class="label"
          for="regiao-ids"
        >
          {{ schema.fields.regiao_ids.spec.label }}
        </label>
        <select
          id="regiao-ids"
          name="regioes"
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
          class="label"
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
    <div class="f1 fb25em">
      <label
        class="label"
        for="palavra-chave"
      >Palavra-chave</label>
      <input
        id="palavra-chave"
        class="inputtext light"
        name="palavra_chave"
        type="search"
        :value="$route.query.palavra_chave"
      >
    </div>
    <div class="f1 fb10em">
      <label
        class="label"
        for="ordem-coluna"
      >Ordenar por</label>
      <select
        id="ordem-coluna"
        class="inputtext light"
        name="ordem_coluna"
      >
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
        class="label"
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
          :selected="$route.query.ordem_direcao === direcao.valor"
        >
          {{ direcao.nome || direcao.valor }}
        </option>
      </select>
    </div>
    <div class="f1 fb10em">
      <label
        class="label"
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
          :selected="Number($route.query.ipp) === quantidade"
        >
          {{ quantidade }}
        </option>
      </select>
    </div>
  </FormularioQueryString>
</template>
<script setup>
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import direcoesDeOrdenacao from '@/consts/direcoesDeOrdenacao';
import { obras as schema } from '@/consts/formSchemas';
import statusObras from '@/consts/statusObras';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { storeToRefs } from 'pinia';
import { onUnmounted, ref } from 'vue';

const props = defineProps({
  ariaBusy: {
    type: Boolean,
    default: false,
  },
});

const colunasParaOrdenacao = {
  id: {
    valor: 'id',
    nome: '',
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
  erro: errosDePortfolios,
} = storeToRefs(portfolioMdoStore);
const {
  regions, regiõesPorNível,
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

iniciar();

onUnmounted(() => {
  ÓrgãosStore.$reset();
  equipamentosStore.$reset();
  gruposTematicosStore.$reset();
  portfolioMdoStore.$reset();
  regionsStore.$reset();
});
</script>
