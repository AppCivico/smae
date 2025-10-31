<script setup>
import { storeToRefs } from 'pinia';
import { computed, defineProps } from 'vue';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';

const alertStore = useAlertStore();
const parlamentaresStore = useParlamentaresStore();

const { emFoco } = storeToRefs(parlamentaresStore);

const props = defineProps({
  exibirEdição: {
    type: Boolean,
    default: false,
  },
});

const temMandato = computed(() => emFoco?.value?.mandatos?.length);
const temMandatoSP = computed(() => emFoco?.value?.mandatos?.some((mandato) => mandato.uf === 'SP'));
const habilitarBotaoDeRepresentatividade = computed(() => temMandato.value && temMandatoSP.value);

const representatividade = computed(() => {
  const representatividades = { capital: [], interior: [] };

  if (!emFoco.value?.mandatos || !Array.isArray(emFoco.value?.mandatos)) {
    return representatividades;
  }

  const mandatos = emFoco.value?.mandatos.reduce((agrupado, mandato) => {
    mandato.representatividade.forEach((item) => {
      const itemComEleicao = {
        ...item,
        eleicao: {
          cargo: cargosDeParlamentar[mandato.cargo].nome || mandato.cargo,
          ano: mandato.eleicao.ano,
        },
      };

      if (itemComEleicao.municipio_tipo === 'Capital') {
        agrupado.capital.push(itemComEleicao);
      }

      if (itemComEleicao.municipio_tipo === 'Interior') {
        agrupado.interior.push(itemComEleicao);
      }
    });

    return agrupado;
  }, representatividades);

  mandatos.interior.sort((a, b) => a.ranking - b.ranking);
  mandatos.capital.sort((a, b) => a.ranking - b.ranking);

  return mandatos;
});

function excluirRepresentatividade(representatividadeId, parlamentarId = emFoco.value.id) {
  alertStore.confirmAction('Deseja excluir essa representividade?', async () => {
    if (await parlamentaresStore.excluirRepresentatividade(representatividadeId, parlamentarId)) {
      alertStore.success('Representatividade removida.');
      parlamentaresStore.buscarItem(parlamentarId);
    }
  }, 'Remover');
}

</script>
<template>
  <div>
    <div class="mb4">
      <div class="flex spacebetween center">
        <h3 class="c500">
          Representatividade na Capital
        </h3>
        <hr class="ml2 f1">
      </div>

      <SmaeTable
        v-if="representatividade?.capital?.length"
        class="mb1"
        titulo-rolagem-horizontal="Tabela representatividade - capital"
        :dados="representatividade.capital"
        :colunas="[
          {
            chave: 'ranking',
            label: 'Ranking na Capital',
            atributosDaCelula: { class: 'col--number'}
          },
          {
            chave: 'municipio_tipo',
            label: 'Município/Subprefeitura'
          },
          {
            chave: 'eleicao',
            label: 'Cargo/Eleição',
            formatador: (val) => {
              return `${val.cargo} - ${val.ano}`
            }
          },
          {
            chave: 'regiao.descricao',
            label: 'Região'
          },
          {
            chave: 'numero_votos',
            label: 'Votos nominais do candidato',
            atributosDaCelula: { class: 'col--number'}
          },
          {
            chave: 'regiao.comparecimento',
            label: 'Quantidade de Comparecimento',
            atributosDaCelula: { class: 'col--number'},
            formatador: v => v ? v.valor : '-'
          },
          {
            chave: 'pct_participacao',
            label: 'Porcentagem do candidato',
            atributosDaCelula: { class: 'col--number'},
            formatador: v => v ? `${Number(v).toFixed(1)}%` : '-'
          },
          exibirEdição && { chave: 'editar', atributosDaCelula: { class: 'col--number'} },
          exibirEdição && { chave: 'excluir', atributosDaCelula: { class: 'col--number'} },
        ]"
      >
        <template #celula:editar="{ linha }">
          <SmaeLink
            :to="{
              name: 'parlamentaresEditarRepresentatividade',
              params: { parlamentarId: emFoco?.id, representatividadeId: linha.id },
              query: { tipo: 'capital' }
            }"
            class="tprimary"
            aria-label="Editar representatividade"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </template>

        <template #celula:excluir="{ linha }">
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            type="button"
            @click="excluirRepresentatividade(linha.id, emFoco.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
          </button>
        </template>
      </SmaeTable>

      <p v-else>
        <template v-if="!temMandato">
          É necessário ao menos um mandato para cadastrar representatividade na capital
        </template>
        <template v-else-if="!temMandatoSP">
          É necessário ao menos um mandato em SP para cadastrar representatividade na capital
        </template>
        <template v-else>
          Sem representatividade cadastrada na capital
        </template>
      </p>

      <component
        :is="!habilitarBotaoDeRepresentatividade ? 'span' : 'SmaeLink'"
        v-if="exibirEdição && emFoco?.id"
        :class="{ disabled: !habilitarBotaoDeRepresentatividade }"
        :to="{
          name: 'parlamentaresEditarRepresentatividade',
          params: { parlamentarId: emFoco.id },
          query: { tipo: 'capital' }
        }"
        class="like-a__text addlink"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>Registrar representatividade
      </component>
    </div>

    <div class="mb4">
      <div class="flex spacebetween center">
        <h3 class="c500">
          Representatividade no Interior
        </h3>
        <hr class="ml2 f1">
      </div>

      <SmaeTable
        v-if="representatividade?.interior?.length"
        class="mb1"
        titulo-rolagem-horizontal="Tabela representatividade - interior"
        :dados="representatividade.interior"
        :colunas="[
          {
            chave: 'ranking',
            label: 'Ranking no Interior',
            atributosDaCelula: { class: 'col--number'}
          },
          {
            chave: 'municipio_tipo',
            label: 'Município/Subprefeitura'
          },
          {
            chave: 'eleicao',
            label: 'Cargo/Eleição',
            formatador: (val) => {
              return `${val.cargo} - ${val.ano}`
            }
          },
          {
            chave: 'regiao.descricao',
            label: 'Região'
          },
          {
            chave: 'numero_votos',
            label: 'Votos nominais do candidato',
            atributosDaCelula: { class: 'col--number'}
          },
          {
            chave: 'regiao.comparecimento',
            label: 'Quantidade de comparecimento',
            atributosDaCelula: { class: 'col--number'},
            formatador: v => v ? v.valor : '-'
          },
          {
            chave: 'pct_participacao',
            label: 'Porcentagem do candidato',
            atributosDaCelula: { class: 'col--number'},
            formatador: v => v ? `${Number(v).toFixed(1)}%` : '-'
          },
          exibirEdição && { chave: 'editar', atributosDaCelula: { class: 'col--number'} },
          exibirEdição && { chave: 'excluir', atributosDaCelula: { class: 'col--number'} },
        ]"
      >
        <template #celula:editar="{ linha }">
          <SmaeLink
            :to="{
              name: 'parlamentaresEditarRepresentatividade',
              params: { parlamentarId: emFoco?.id, representatividadeId: linha.id },
              query: { tipo: 'interior' }
            }"
            class="tprimary"
            aria-label="Editar representatividade"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </template>

        <template #celula:excluir="{ linha }">
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            type="button"
            @click="excluirRepresentatividade(linha.id, emFoco.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
          </button>
        </template>
      </SmaeTable>

      <p v-else>
        <template v-if="!temMandato">
          É necessário ao menos um mandato para cadastrar representatividade na capital
        </template>
        <template v-else-if="!temMandatoSP">
          É necessário ao menos um mandato em SP para cadastrar representatividade no interior
        </template>
        <template v-else>
          Sem representatividade cadastrada no Interior
        </template>
      </p>

      <component
        :is="!habilitarBotaoDeRepresentatividade ? 'span' : 'SmaeLink'"
        v-if="exibirEdição && emFoco?.id"
        :class="{ disabled: !habilitarBotaoDeRepresentatividade }"
        :to="{
          name: 'parlamentaresEditarRepresentatividade',
          params: { parlamentarId: emFoco.id },
          query: { tipo: 'interior' }
        }"
        class="like-a__text addlink"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>
        Registrar representatividade
      </component>
    </div>
  </div>
</template>
<style scoped ang="less">
h3{
  color: #607A9F;
  font-weight: 700;
  font-size: 24px;
}
table{
  max-width: 1000px;
}
</style>
