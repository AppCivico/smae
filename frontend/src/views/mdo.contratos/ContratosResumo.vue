<script setup>
import { storeToRefs } from 'pinia';
import { defineOptions, computed } from 'vue';
import { useRoute } from 'vue-router';

import LoadingComponent from '@/components/LoadingComponent.vue';
import ContratosAditivos from '@/components/obras/ContratosAditivos.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import { contratoDeObras } from '@/consts/formSchemas';
import { dateToShortDate } from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import formatProcesso from '@/helpers/formatProcesso';
import { useContratosStore } from '@/stores/contratos.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';

defineOptions({ inheritAttrs: false });

const route = useRoute();

const contratosStore = useContratosStore(route.meta.entidadeMãe);
const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(contratosStore);

const { permissõesDaObraEmFoco } = storeToRefs(useObrasStore());
const { permissõesDoProjetoEmFoco } = storeToRefs(useProjetosStore());

const permissoesDoItemEmFoco = computed(() => (route.meta.entidadeMãe === 'obras'
  ? permissõesDaObraEmFoco.value
  : permissõesDoProjetoEmFoco.value));

const schema = computed(() => contratoDeObras(route.meta.entidadeMãe));

const dadosPrincipais = computed(() => [
  { chave: 'numero', valor: emFoco.value?.numero, larguraBase: '10em' },
  { chave: 'contrato_exclusivo', valor: emFoco.value?.contrato_exclusivo ? 'Sim' : 'Não', larguraBase: '10em' },
  { chave: 'status', valor: emFoco.value?.status, larguraBase: '10em' },
  {
    chave: 'processos_sei',
    valor: emFoco.value?.processos_sei?.length ? ' ' : null,
    larguraBase: '20em',
    metadados: { lista: emFoco.value?.processos_sei },
  },
  {
    chave: 'orgao_id',
    valor: emFoco.value?.orgao?.sigla,
    larguraBase: '10em',
    metadados: { descricao: emFoco.value?.orgao?.descricao },
  },
  { chave: 'modalidade_contratacao_id', valor: emFoco.value?.modalidade_contratacao?.nome, larguraBase: '25em' },
  { chave: 'data_termino', valor: emFoco.value?.data_termino ? dateToShortDate(emFoco.value.data_termino) : null, larguraBase: '25em' },
  {
    chave: 'fontes_recurso',
    valor: emFoco.value?.fontes_recurso?.length ? ' ' : null,
    larguraBase: '25em',
    metadados: { lista: emFoco.value?.fontes_recurso },
  },
  { chave: 'objeto_resumo', valor: emFoco.value?.objeto_resumo, larguraBase: '100%' },
  {
    chave: 'objeto_detalhado',
    valor: emFoco.value?.objeto_detalhado ? ' ' : null,
    larguraBase: '100%',
    metadados: { html: emFoco.value?.objeto_detalhado },
  },
  { chave: 'contratante', valor: emFoco.value?.contratante, larguraBase: '25em' },
  { chave: 'empresa_contratada', valor: emFoco.value?.empresa_contratada, larguraBase: '25em' },
  { chave: 'cnpj_contratada', valor: emFoco.value?.cnpj_contratada, larguraBase: '25em' },
  { chave: 'data_assinatura', valor: emFoco.value?.data_assinatura ? dateToShortDate(emFoco.value.data_assinatura) : null, larguraBase: '25em' },
  {
    chave: 'prazo_numero',
    valor: emFoco.value?.prazo_numero ? `${emFoco.value.prazo_numero} ${emFoco.value.prazo_unidade || ''}` : null,
    larguraBase: '25em',
  },
  {
    chave: 'data_base',
    titulo: schema.value?.fields?.data_base_mes?.spec?.label,
    valor: emFoco.value?.data_base_mes ? `${emFoco.value.data_base_mes}/${emFoco.value.data_base_ano}` : null,
    larguraBase: '25em',
  },
  { chave: 'data_inicio', valor: emFoco.value?.data_inicio ? dateToShortDate(emFoco.value.data_inicio) : null, larguraBase: '25em' },
  { chave: 'valor', valor: emFoco.value?.valor ? `R$ ${dinheiro(emFoco.value.valor)}` : null, larguraBase: '25em' },
  {
    chave: 'total_aditivos',
    titulo: 'Valor total dos aditivos',
    valor: emFoco.value?.total_aditivos ? `R$ ${dinheiro(emFoco.value.total_aditivos)}` : 'R$ 0,00',
    larguraBase: '25em',
  },
  {
    chave: 'total_reajustes',
    titulo: 'Valor total dos reajustes',
    valor: emFoco.value?.total_reajustes ? `R$ ${dinheiro(emFoco.value.total_reajustes)}` : 'R$ 0,00',
    larguraBase: '25em',
  },
  {
    chave: 'valor_reajustado',
    titulo: 'Valor do Contrato Atualizado',
    valor: emFoco.value?.valor_reajustado ? `R$ ${dinheiro(emFoco.value.valor_reajustado)}` : 'R$ 0,00',
    larguraBase: '25em',
  },
]);

const dadosFinais = computed(() => [
  { chave: 'observacoes', valor: emFoco.value?.observacoes, larguraBase: '100%' },
]);
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Resumo de contrato
    </TítuloDePágina>

    <hr class="ml2 f1">

    <SmaeLink
      v-if="emFoco?.id
        && (!permissoesDoItemEmFoco.apenas_leitura
          || permissoesDoItemEmFoco.sou_responsavel)"
      :to="{
        name: $route.params.obraId ? 'contratosDaObraEditar' : 'contratosDoProjetoEditar',
        params: $route.params
      }"
      title="Editar contrato"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>

  <div
    v-if="emFoco"
    class="flex column g2"
  >
    <SmaeDescriptionList
      :lista="dadosPrincipais"
      :schema="schema"
    >
      <template #descricao--processos_sei="{ item }">
        <ul v-if="item.metadados?.lista?.length">
          <li
            v-for="(processo, i) in item.metadados.lista"
            :key="i"
          >
            {{ formatProcesso(processo) }}
          </li>
        </ul>
      </template>

      <template #descricao--orgao_id="{ item }">
        <abbr
          v-if="item.valor"
          :title="item.metadados?.descricao"
        >
          {{ item.valor }}
        </abbr>
        <template v-else>
          —
        </template>
      </template>

      <template #descricao--fontes_recurso="{ item }">
        <ul v-if="item.metadados?.lista?.length">
          <li
            v-for="(fonte, i) in item.metadados.lista"
            :key="i"
          >
            {{ fonte.fonte_recurso_cod_sof }} ({{ fonte.fonte_recurso_ano }})
          </li>
        </ul>
      </template>

      <template #descricao--objeto_detalhado="{ item }">
        <div
          class="contentStyle"
          v-html="item.metadados?.html"
        />
      </template>
    </SmaeDescriptionList>

    <div>
      <ContratosAditivos
        @salvo="contratosStore.buscarItem(emFoco.id)"
        @excluido="contratosStore.buscarItem(emFoco.id)"
      />
    </div>

    <SmaeDescriptionList
      :lista="dadosFinais"
      :schema="schema"
    />

    <LoadingComponent v-if="chamadasPendentes?.emFoco" />

    <ErrorComponent v-if="erro">
      {{ erro }}
    </ErrorComponent>
  </div>
</template>
