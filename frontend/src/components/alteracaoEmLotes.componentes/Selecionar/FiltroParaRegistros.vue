<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import { useObrasStore } from '@/stores/obras.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useTiposDeIntervencaoStore } from '@/stores/tiposDeIntervencao.store';
import prepararParaSelect from '@/helpers/prepararParaSelect';
import statusObras from '@/consts/statusObras';
import {
  alteracaoEmLoteNovoFiltro as schema,
  obras as obrasSchema,
} from '@/consts/formSchemas';
import type { Formulario } from '@/components/FiltroParaPagina.vue';

const route = useRoute();

const obrasStore = useObrasStore();
const organsStore = useOrgansStore();
const regionsStore = useRegionsStore();
const equipamentosStore = useEquipamentosStore();
const portfolioObraStore = usePortfolioObraStore();
const gruposTematicosStore = useGruposTematicosStore();
const tiposDeIntervencaoStore = useTiposDeIntervencaoStore();
const portfolioMdoStore = usePortfolioObraStore();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);

const { chamadasPendentes } = storeToRefs(obrasStore);
const { lista: portfolioObrasLista } = storeToRefs(portfolioObraStore);
const { órgãosComoLista: orgaosLista, organs } = storeToRefs(organsStore);

const { lista: listaDePortfolios } = storeToRefs(portfolioObraStore);
const { lista: listaDeEquipamentos } = storeToRefs(equipamentosStore);
const { lista: listaDeGruposTematicos } = storeToRefs(gruposTematicosStore);
const { regions, regiõesPorNível: regioesPorNivel } = storeToRefs(regionsStore);
const { lista: listaDeTiposDeIntervencao } = storeToRefs(tiposDeIntervencaoStore);

const valoresIniciais = ({
  ipp: 30,
  ordem_coluna: 'registrado_em',
  ordem_direcao: 'desc',
});

const formularioSujo = ref<boolean>(false);

const colunasParaOrdenacao = {
  orgao_origem_id: {
    id: 'orgao_origem_nome',
    label: obrasSchema.fields.orgao_origem_id.spec.label,
  },
  portfolio_id: {
    id: 'portfolio_titulo',
    label: obrasSchema.fields.portfolio_id.spec.label,
  },
  nome: {
    id: 'nome',
    label: obrasSchema.fields.nome.spec.label,
  },
  grupo_tematico_id: {
    id: 'grupo_tematico_nome',
    label: obrasSchema.fields.grupo_tematico_id.spec.label,
  },
  tipo_intervencao_id: {
    id: 'tipo_intervencao_nome',
    label: obrasSchema.fields.tipo_intervencao_id.spec.label,
  },
  equipamento_id: {
    id: 'equipamento_nome',
    label: obrasSchema.fields.equipamento_id.spec.label,
  },
  regiao_ids: {
    id: 'regioes',
    label: obrasSchema.fields.regiao_ids.spec.label,
  },
  status: {
    id: 'status',
    label: obrasSchema.fields.status.spec.label,
  },
  registrado_em: {
    id: 'registrado_em',
    label: 'Data de registro',
  },
};

const camposFiltro = computed<Formulario>(() => [
  {
    campos: {
      portfolio_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(portfolioObrasLista.value, { id: 'id', label: 'titulo' }),
      },
      orgao_origem_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(orgaosLista.value, { id: 'id', label: 'sigla' }),
      },
      regioes: {
        tipo: 'select',
        opcoes: prepararParaSelect(regioesPorNivel.value[3], { id: 'id', label: 'descricao' }),
      },
      status: {
        tipo: 'select',
        opcoes: prepararParaSelect(statusObras, { id: 'valor', label: 'nome' }),
      },
    },
  },
  {
    campos: {
      grupo_tematico_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(listaDeGruposTematicos.value, { id: 'id', label: 'nome' }),
      },
      tipo_intervencao_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(listaDeTiposDeIntervencao.value, { id: 'id', label: 'nome' }),
      },
      equipamento_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(listaDeEquipamentos.value, { id: 'id', label: 'nome' }),
      },
      registros_sei: { tipo: 'text' },
    },
  },
  {
    campos: {
      palavra_chave: { tipo: 'search', class: 'fb33' },
      ordem_coluna: { tipo: 'select', opcoes: Object.values(colunasParaOrdenacao) },
      ordem_direcao: {
        tipo: 'select',
        opcoes: [
          { id: 'asc', label: 'Crescente' },
          { id: 'desc', label: 'Decrescente' },
        ],
      },
      ipp: { tipo: 'select', opcoes: [10, 30, 50, 100] },
    },
  },
]);

function limparSelecao() {
  edicoesEmLoteStore.limparIdsSelecionados();
}

onMounted(() => {
  if (!listaDePortfolios.value.length) {
    portfolioMdoStore.buscarTudo();
  }

  if (!listaDeEquipamentos.value.length) {
    equipamentosStore.buscarTudo();
  }

  if (!listaDeGruposTematicos.value.length) {
    gruposTematicosStore.buscarTudo();
  }

  if (!listaDeTiposDeIntervencao.value.length) {
    tiposDeIntervencaoStore.buscarTudo();
  }

  if (!Array.isArray(organs.value)) {
    organsStore.getAll();
  }

  if (!Array.isArray(regions.value)) {
    regionsStore.getAll();
  }
});

</script>

<template>
  <section>
    <FiltroParaPagina
      v-model:formulario-sujo="formularioSujo"
      :formulario="camposFiltro"
      :schema="schema"
      :valores-iniciais="valoresIniciais"
      :carregando="chamadasPendentes.lista"
      @filtro="limparSelecao"
    />

    <div :class="{'filtro-sujo': formularioSujo}">
      <slot />
    </div>
  </section>
</template>
