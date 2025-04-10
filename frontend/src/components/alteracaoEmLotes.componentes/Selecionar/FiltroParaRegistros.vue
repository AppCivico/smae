<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import FiltroParaPagina, { Formulario } from '@/components/FiltroParaPagina.vue';
import { useOrgansStore } from '@/stores/organs.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store';
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useTiposDeIntervencaoStore } from '@/stores/tiposDeIntervencao.store';
import prepararParaSelect from '@/helpers/prepararParaSelect';
import statusObras from '@/consts/statusObras';
import { alteracaoEmLoteNovoFiltro as schema } from '@/consts/formSchemas';

const route = useRoute();

const organsStore = useOrgansStore();
const regionsStore = useRegionsStore();
const equipamentosStore = useEquipamentosStore();
const portfolioObraStore = usePortfolioObraStore();
const gruposTematicosStore = useGruposTematicosStore();
const tiposDeIntervencaoStore = useTiposDeIntervencaoStore();
const portfolioMdoStore = usePortfolioObraStore();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);

const { lista: portfolioObrasLista } = storeToRefs(portfolioObraStore);
const { órgãosComoLista: orgaosLista, organs } = storeToRefs(organsStore);

const { lista: listaDePortfolios } = storeToRefs(portfolioObraStore);
const { lista: listaDeEquipamentos } = storeToRefs(equipamentosStore);
const { lista: listaDeGruposTematicos } = storeToRefs(gruposTematicosStore);
const { regions, regiõesPorNível: regioesPorNivel } = storeToRefs(regionsStore);
const { lista: listaDeTiposDeIntervencao } = storeToRefs(tiposDeIntervencaoStore);

const valoresIniciais = ({
  ipp: 30,
});

const colunasParaOrdenacao = {
  id: {
    id: 'id',
    label: '',
  },
  nome: {
    id: 'nome',
    label: schema.fields.nome?.spec.label,
  },
  codigo: {
    id: 'codigo',
    label: 'Código',
  },
  portfolio_titulo: {
    id: 'portfolio_titulo',
    label: schema.fields.portfolio_id?.spec.label,
  },
  grupo_tematico_nome: {
    id: 'grupo_tematico_nome',
    label: schema.fields.grupo_tematico_id?.spec.label,
  },
  tipo_intervencao_nome: {
    id: 'tipo_intervencao_nome',
    label: schema.fields.tipo_intervencao_id?.spec.label,
  },
  equipamento_nome: {
    id: 'equipamento_nome',
    label: schema.fields.equipamento_id?.spec.label,
  },
  orgao_origem_nome: {
    id: 'orgao_origem_nome',
    label: schema.fields.orgao_origem_id?.spec.label,
  },
  regioes: {
    id: 'regioes',
    label: schema.fields.regiao_ids?.spec.label,
  },
  status: {
    id: 'status',
    label: schema.fields.status?.spec.label,
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
      subprefeitura_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(regioesPorNivel.value[3], { id: 'id', label: 'descricao' }),
      },
      status_obra: {
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
      tipo_obra_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(listaDeTiposDeIntervencao.value, { id: 'id', label: 'nome' }),
      },
      equipamento_id: {
        tipo: 'select',
        opcoes: prepararParaSelect(listaDeEquipamentos.value, { id: 'id', label: 'nome' }),
      },
      processo_sei: { tipo: 'text' },
    },
  },
  {
    campos: {
      palavra_chave: { tipo: 'search', class: 'fb33' },
      ordenar_por: { tipo: 'select', opcoes: Object.values(colunasParaOrdenacao) },
      direcao: {
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
      :formulario="camposFiltro"
      :schema="schema"
      :valores-iniciais="valoresIniciais"
      @filtro="limparSelecao"
    />
  </section>
</template>
