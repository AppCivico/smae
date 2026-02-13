<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import SmaeStatusPills from '@/components/SmaeStatusPills/SmaeStatusPills.vue';
import SmaeStatusPillsItem from '@/components/SmaeStatusPills/SmaeStatusPillsItem.vue';
import DeleteButton from '@/components/SmaeTable/partials/DeleteButton.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { FiltroDemandaSchema } from '@/consts/formSchemas/demanda';
import dinheiro from '@/helpers/dinheiro';
import filtrarObjetos from '@/helpers/filtrarObjetos';
import truncate from '@/helpers/texto/truncate';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';
import { useDemandasStore } from '@/stores/demandas.store';
import { useOrgansStore } from '@/stores/organs.store';

import MapaStatus from './MapaStatus';

const route = useRoute();
const router = useRouter();

const statusInicial = (() => {
  const { status, situacao } = route.query;
  if (!status) return null;
  return situacao ? `${status}_${situacao}` : String(status);
})();
const statusSelecionados = ref<string | null>(statusInicial);

const itemsStatusDemanda = [
  { valor: 'Registro', label: 'Em registro', cor: '#E885BE' },
  { valor: 'Validacao', label: 'Em validação', cor: '#F2890D' },
  { valor: 'Publicado', label: 'Publicada', cor: '#4074BF' },
  { valor: 'Encerrado_Cancelada', label: 'Encerrada (Cancelada)', cor: '#EE3B2B' },
  { valor: 'Encerrado_Concluido', label: 'Encerrada (Atendida)', cor: '#8EC122' },
];

const demandasStore = useDemandasStore();
const organsStore = useOrgansStore();
const areasTematicasStore = useAreasTematicasStore();

const { lista } = storeToRefs(demandasStore);
const { orgaosComNome: listaOrgaos } = storeToRefs(organsStore);
const { lista: listaAreasTematicas } = storeToRefs(areasTematicasStore);

const opcoesOrgaos = computed(() => listaOrgaos.value.map((o) => ({
  id: o.id,
  label: o.nome_completo,
})));

const opcoesAreasTematicas = computed(() => (listaAreasTematicas.value as any[]).map((a) => ({
  id: a.id,
  label: a.nome,
})));

const camposDeFiltro = computed<import('@/components/FiltroParaPagina.vue').Formulario>(() => [
  {
    campos: {
      orgao_id: {
        tipo: 'select' as const,
        opcoes: opcoesOrgaos.value,
      },
      area_tematica_id: {
        tipo: 'select' as const,
        opcoes: opcoesAreasTematicas.value,
      },
      palavra_chave: {
        tipo: 'search',
      },
    },
  },
]);

function buscarTudo() {
  demandasStore.$reset();
  demandasStore.buscarTudo(route.query);
}

function corDoStatus({ status, situacao_encerramento }): string | undefined {
  let nomeStatus = status;
  if (nomeStatus === 'Encerrado' && situacao_encerramento) {
    nomeStatus += `_${situacao_encerramento}`;
  }

  return itemsStatusDemanda.find((l) => l.valor === nomeStatus)?.cor;
}

async function excluirItem({ id }) {
  await demandasStore.excluirItem(id);

  buscarTudo();
}

const demandasFiltradas = computed(() => filtrarObjetos(lista.value, route.query.palavra_chave));

onMounted(() => {
  Promise.all([
    organsStore.getAll(),
    areasTematicasStore.buscarTudo(),
    buscarTudo(),
  ]).then();
});

watch(statusSelecionados, (valorStatusSelecionado) => {
  let status = valorStatusSelecionado;
  let situacao;

  if (valorStatusSelecionado?.includes('_')) {
    const [valorStatus, valorSituacao] = valorStatusSelecionado.split('_');
    status = valorStatus;
    situacao = valorSituacao;
  }

  router.replace({
    query: Object.assign(
      structuredClone(route.query),
      {
        status: status || undefined,
        situacao: situacao || undefined,
      },
    ),
  });
});

watch(
  [
    () => route.query.status,
    () => route.query.situacao,
    () => route.query.orgao_id,
    () => route.query.area_tematica_id,
    () => route.query.palavra_chave,
  ],
  () => {
    buscarTudo();
  },
);
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">

    <SmaeLink
      :to="{ name: 'demandas.criar' }"
      class="btn big ml1"
    >
      Nova Demanda
    </SmaeLink>
  </div>

  <FiltroParaPagina
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="FiltroDemandaSchema"
  />

  <SmaeStatusPills
    v-model="statusSelecionados"
    class="mb2"
    :items="itemsStatusDemanda"
  />

  <SmaeTable
    class="relative"
    :dados="demandasFiltradas"
    :colunas="[
      { chave: 'orgao.nome_exibicao', label: 'gestor municipal' },
      { chave: 'nome_projeto', label: 'Nome do Projeto' },
      { chave: 'area_tematica.nome', label: 'Área Temática' },
      { chave: 'valor', label: 'Valor', formatador: v => dinheiro(v, { style: 'currency' }) },
      { chave: 'localizacao', label: 'Localizacao', formatador: v => truncate(v, 110) },
      { chave: 'status', label: '' },
    ]"
  >
    <template #celula:status="{linha}">
      <SmaeStatusPillsItem
        ativo
        :cor="corDoStatus(linha)"
      >
        <template v-if="linha.situacao_encerramento">
          {{ linha.situacao_encerramento }}
        </template>

        <template v-else>
          {{ MapaStatus[linha.status] }}
        </template>
      </SmaeStatusPillsItem>
    </template>

    <template #acoes="{ linha }">
      <div class="flex g1 justifyleft wfull">
        <SmaeLink
          :to="{
            name: 'demandas.editar',
            params: { demandaId: linha.id },
          }"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_edit" />
          </svg>
        </SmaeLink>

        <DeleteButton
          v-if="linha.permissoes.pode_remover"
          :linha="linha"
          parametro-no-objeto-para-excluir="nome_projeto"
          @deletar="(item) => excluirItem(item)"
        />
      </div>
    </template>
  </SmaeTable>
</template>

<style lang="less" scoped>
:deep(.smae-table__linha) {
  position: relative;
}

.status {
  width: fit-content;
  color: #fff;
  display: block;
  padding: 0.5rem;
  margin-right: auto;
  border-radius: 10px;
  align-self: center;
  white-space: nowrap;
  text-align: center;
}
</style>
