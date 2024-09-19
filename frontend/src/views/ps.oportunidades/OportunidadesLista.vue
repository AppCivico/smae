<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
  </div>

  <form
    class="flex flexwrap bottom mb2 g1"
    @submit.prevent="atualizarUrl"
  >
    <div class="f0">
      <label
        for="ano"
        class="label tc300"
      >Ano</label>
      <input
        id="ano"
        v-model.number="ano"
        inputmode="numeric"
        class="inputtext mb1"
        name="ano"
        type="number"
        min="2003"
        max="9999"
      >
    </div>
    <div class="f0">
      <label
        for="tipo"
        class="label tc300"
      >Modalidade</label>
      <select
        id="tipo"
        v-model.trim="tipo"
        class="inputtext mb1"
        name="tipo"
      >
        <option value="" />
        <option
          v-for="(tipo, id) in tipos"
          :key="id"
          :value="tipo.value"
        >
          {{ tipo.name }}
        </option>
      </select>
    </div>

    <div class="f0">
      <label
        for="palavra_chave"
        class="label tc300"
      >Palavra-chave</label>
      <input
        id="palavra_chave"
        v-model.trim="palavraChave"
        class="inputtext"
        name="palavra_chave"
        type="text"
      >
    </div>
    <button class="btn outline bgnone tcprimary mtauto mb1">
      Filtrar
    </button>
  </form>
  <h2>Transferências disponíveis</h2>
  <table class="tablemain mb1">
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>
          Órgão
        </th>
        <th>
          Modalidade
        </th>
        <th>
          Programa
        </th>
        <th>
          Código do programa
        </th>
        <th>
          Situação
        </th>
        <th>
          Data de disponibilização
        </th>
        <th>
          Início das propostas
        </th>
        <th>
          Fim das propostas
        </th>
        <th>
          Modalidade do programa
        </th>
        <th>
          Ação Orçamentária
        </th>
        <th>
          Avaliação
        </th>
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>
          {{ item.desc_orgao_sup_programa || ' - ' }}
        </td>
        <td>
          {{ item.tipo || ' - ' }}
        </td>
        <td>
          {{ item.nome_programa || ' - ' }}
        </td>
        <td>
          {{ item.cod_programa || ' - ' }}
        </td>
        <td>
          {{ item.sit_programa || ' - ' }}
        </td>
        <td>
          {{ dateToField(item.data_disponibilizacao) || ' - ' }}
        </td>
        <td>
          {{ dateToField(item.dt_ini_receb) || ' - ' }}
        </td>
        <td>
          {{ dateToField(item.dt_fim_receb) || ' - ' }}
        </td>
        <td>
          {{ item.modalidade_programa || ' - ' }}
        </td>
        <td>
          {{ item.acao_orcamentaria || ' - ' }}
        </td>
        <td>
          <span class="avaliacao">
            {{ item.avaliacao || ' Não avaliada' }}
          </span>
        </td>
        <td>
          <button
            class="like-a__text"
            arial-label="editar"
            title="editar"
            @click="editarOportunidade(item.id, item.avaliacao )"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
          </button>
        </td>
        <td />
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="12">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="12">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="12">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>

  <button
    v-if="paginação.temMais && paginação.tokenDaPróximaPágina"
    :disabled="chamadasPendentes.lista"
    class="btn bgnone outline center"
    @click="oportunidades.buscarTudo({
      ...route.query,
      token_proxima_pagina: paginação.tokenDaPróximaPágina
    })"
  >
    carregar mais
  </button>

  <SmallModal v-if="showModal">
    <div class="flex spacebetween center mb2">
      <h2>
        Editar Avaliação
      </h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-modal="true"
        :formulario-sujo="false"
        @close="showModal = false"
      />
    </div>
    <div class="f0">
      <form @submit.prevent="editAvaliacao">
        <label
          for="avaliacao"
          class="label tc300"
        >Avaliação</label>
        <Field
          name="avaliacao"
          as="select"
          class="inputtext light mb1"
        >
          <option value="" />
          <option
            value="Inadequada"
          >
            Inadequada
          </option>
          <option
            value="Selecionada"
          >
            Selecionada
          </option>
        </Field>
        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button
            class="btn big"
          >
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </form>
    </div>
  </SmallModal>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { Field, useForm } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useOportunidadesStore } from '@/stores/oportunidades.store';
import SmallModal from '@/components/SmallModal.vue';
import dateToField from '@/helpers/dateToField';

const route = useRoute();
const router = useRouter();
const oportunidades = useOportunidadesStore();

const alertStore = useAlertStore();

const oportundiadeID = ref(null);
const oportunidadeAvaliacao = ref(null);
const showModal = ref(false);
const ano = ref(route.query.ano);
const tipo = ref(route.query.tipo);
const palavraChave = ref(route.query.palavra_chave);

const {
  setFieldValue, handleSubmit,
} = useForm({
  initialValues: {
    avaliacao: oportunidadeAvaliacao.value,
  },
});

const {
  lista, chamadasPendentes, erro, paginação,
} = storeToRefs(oportunidades);

const tipos = [
  {
    value: 'Voluntaria',
    name: 'Voluntária',
  },
  {
    value: 'Especifica',
    name: 'Específica',
  },
  {
    value: 'Emenda',
    name: 'Emenda',
  },
];

function editarOportunidade(id, avaliacao) {
  showModal.value = true;
  oportundiadeID.value = id;
  oportunidadeAvaliacao.value = avaliacao;
}

function atualizarUrl() {
  router.push({
    query: {
      ...route.query,
      ano: ano.value || undefined,
      tipo: tipo.value || undefined,
      palavras_chave: palavraChave.value || undefined,
    },
  });
}

const editAvaliacao = handleSubmit.withControlled(async (values) => {
  try {
    const msg = 'Dados salvos com sucesso!';
    const resposta = await oportunidades.salvarItem(
      oportundiadeID.value,
      { avaliacao: values.avaliacao },
    );
    if (resposta) {
      alertStore.success(msg);

      let {
        ano: anoParaBusca,
        tipo: tipoParaBusca,
        palavras_chave: palavraChaveParaBusca,
      } = route.query;
      if (typeof anoParaBusca === 'string') {
        anoParaBusca = anoParaBusca.trim();
      }
      if (typeof tipoParaBusca === 'string') {
        tipoParaBusca = tipoParaBusca.trim();
      }
      if (typeof palavraChaveParaBusca === 'string') {
        palavraChaveParaBusca = palavraChaveParaBusca.trim();
      }
      oportunidades.$reset();
      oportunidades.buscarTudo({
        ano: anoParaBusca,
        tipo: tipoParaBusca,
        palavras_chave: palavraChaveParaBusca,
      });
      showModal.value = false;
    }
  } catch (error) {
    alertStore.error(error);
  }
});

watch(oportundiadeID, () => {
  setFieldValue('avaliacao', oportunidadeAvaliacao.value);
});

watch([
  () => route.query.ano,
  () => route.query.tipo,
  () => route.query.palavras_chave,
], () => {
  let {
    ano: anoParaBusca,
    tipo: tipoParaBusca,
    palavras_chave: palavraChaveParaBusca,
  } = route.query;
  if (typeof anoParaBusca === 'string') {
    anoParaBusca = anoParaBusca.trim();
  }
  if (typeof tipoParaBusca === 'string') {
    tipoParaBusca = tipoParaBusca.trim();
  }
  if (typeof palavraChaveParaBusca === 'string') {
    palavraChaveParaBusca = palavraChaveParaBusca.trim();
  }
  oportunidades.$reset();
  oportunidades.buscarTudo({
    ano: anoParaBusca,
    tipo: tipoParaBusca,
    palavras_chave: palavraChaveParaBusca,
  });
}, { immediate: true });

</script>
<style lang="less" scoped>
.avaliacao {
  background-color: @cinza-claro-azulado;
  padding: 5px 10px;
  border-radius: 12px;
  display: inline-block;
}
</style>
