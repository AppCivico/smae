<script setup>
import { storeToRefs } from 'pinia';
import { computed, defineProps } from 'vue';
import { useAlertStore } from '@/stores/alert.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import SmaeTable from '../SmaeTable/SmaeTable.vue';

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

// eslint-disable-next-line max-len
const representatividade = computed(() => (Array.isArray(emFoco?.value?.ultimo_mandato?.representatividade)
  ? emFoco.value.ultimo_mandato.representatividade.reduce((acc, cur) => {
    if (cur.municipio_tipo === 'Capital') {
      acc.capital.push(cur);
    }
    if (cur.municipio_tipo === 'Interior') {
      acc.interior.push(cur);
    }
    return acc;
  }, { capital: [], interior: [] })
  : { capital: [], interior: [] }));

function excluirRepresentatividade(representatividadeId, parlamentarId = emFoco.value.id) {
  alertStore.confirmAction('Deseja mesmo remover a pessoa nessa suplência?', async () => {
    if (await parlamentaresStore.excluirRepresentatividade(representatividadeId, parlamentarId)) {
      alertStore.success('Representatividade removida.');
      parlamentaresStore.buscarItem(parlamentarId);
    }
  }, 'Remover');
}

function formatarNumero(numero) {
  if (!numero) {
    return '';
  }
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
            label: 'Município/Subprefeitur'
          },
          {
            chave: 'regiao.descricao',
            label: 'Regiã'
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
            formatador: v => v ? `${v}%` : '-'
          },
          exibirEdição && { chave: 'editar', atributosDaCelula: { class: 'col--number'} },
          exibirEdição && { chave: 'excluir', atributosDaCelula: { class: 'col--number'} },
        ]"
      >
        <template #celula:editar="{ linha }">
          <SmaeLink
            :to="{
              name: 'parlamentaresEditarRepresentatividade',
              params: { parlamentarId: emFoco?.id, representatividadeId: linha.id }
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
            arial-label="excluir"
            title="excluir"
            type="button"
            @click="excluirRepresentatividade(linha.id, emFoco.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
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
        v-if="representatividade.interior.length"
        class="mb1"
        titulo-rolagem-horizontal="Tabela representatividade - capital"
        :dados="representatividade.interior"
        :colunas="[
          {
            chave: 'ranking',
            label: 'Ranking no Interior',
            atributosDaCelula: { class: 'col--number'}
          },
          {
            chave: 'municipio_tipo',
            label: 'Município/Subprefeitur'
          },
          {
            chave: 'regiao.descricao',
            label: 'Regiã'
          },
          {
            chave: 'numero_votos',
            label: 'Votos nominais do candidato',
            atributosDaCelula: { class: 'col--number'}
          },
          {
            chave: 'regiao.comparecimento.valor',
            label: 'Quantidade de Comparecimento',
            atributosDaCelula: { class: 'col--number'},
            formatador: v => v ? v.valor : '-'
          },
          {
            chave: 'pct_participacao',
            label: 'Porcentagem do candidato',
            atributosDaCelula: { class: 'col--number'},
            formatador: v => v ? `${v}%` : '-'
          },
          exibirEdição && { chave: 'editar', atributosDaCelula: { class: 'col--number'} },
          exibirEdição && { chave: 'excluir', atributosDaCelula: { class: 'col--number'} },
        ]"
      >
        <template #celula:editar="{ linha }">
          <SmaeLink
            :to="{
              name: 'parlamentaresEditarRepresentatividade',
              params: { parlamentarId: emFoco?.id, representatividadeId: linha.id }
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
            arial-label="excluir"
            title="excluir"
            type="button"
            @click="excluirRepresentatividade(linha.id, emFoco.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
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
        ><use xlink:href="#i_+" /></svg>Registrar representatividade
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
