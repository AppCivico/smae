<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
  </div>
  <FormularioQueryString
    v-slot="{ aplicarQueryStrings }"
    :valores-iniciais="valoresIniciais"
  >
    <form
      class="flex flexwrap bottom mb2 g1"
      @submit.prevent="aplicarQueryStrings"
    >
      <div class="f0">
        <label
          for="avaliacao"
          class="label tc300"
        >Avaliação</label>
        <select
          class="inputtext mb1"
          name="avaliacao"
          as="select"
        >
          <option value="" />
          <option
            v-for="(item, id) in avaliacoes"
            :key="id"
            :selected="$route.query.avaliacao === item.value"
            :value="item.value"
          >
            {{ item.name }}
          </option>
        </select>
      </div>
      <div class="f0">
        <label
          for="ano"
          class="label tc300"
        >Ano</label>
        <input
          id="ano"
          :value="Number(route.query.ano)"
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
          class="inputtext mb1"
          name="tipo"
          as="select"
        >
          <option value="" />
          <option
            v-for="(item, id) in tipos"
            :key="id"
            :value="item.value"
            :selected="$route.query.tipo === item.value"
          >
            {{ item.name }}
          </option>
        </select>
      </div>

      <div class="f0">
        <label
          for="palavras_chave"
          class="label tc300"
        >Palavra-chave</label>
        <input
          id="palavras_chave"
          :value="$route.query.palavra_chave"
          class="inputtext"
          name="palavras_chave"
          type="text"
        >
      </div>
      <button
        class="btn outline bgnone tcprimary mtauto mb1"
        type="submit"
      >
        Filtrar
      </button>
    </form>
  </FormularioQueryString>
  <h2>Transferências disponíveis</h2>
  <table class="tablemain mb1">
    <colgroup>
      <col>
      <col>
      <col>
      <col class="col--number">
      <col>
      <col class="col--data">
      <col class="col--data">
      <col class="col--data">
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
    </colgroup>
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
          Ação orçamentária
        </th>
        <th>
          Finalidades
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
        <td class="cell--number">
          {{ item.cod_programa || ' - ' }}
        </td>
        <td>
          {{ item.sit_programa || ' - ' }}
        </td>
        <td class="cell--data">
          {{ dateToField(item.data_disponibilizacao) || ' - ' }}
        </td>
        <td class="cell--data">
          {{ dateToField(item.dt_ini_receb) || ' - ' }}
        </td>
        <td class="cell--data">
          {{ dateToField(item.dt_fim_receb) || ' - ' }}
        </td>
        <td>
          {{ item.modalidade_programa || ' - ' }}
        </td>
        <td>
          {{ item.acao_orcamentaria || ' - ' }}
        </td>
        <td>
          {{ item.finalidades || ' - ' }}
        </td>
        <td>
          <span class="avaliacao">
            {{ avaliacoes.find(a => a.value === item.avaliacao)?.name || ' Não avaliada ' }}
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
            value="NaoSeAplica"
          >
            Não se aplica
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
            type="submit"
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
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import SmallModal from '@/components/SmallModal.vue';
import { oportunidadeFiltros as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAlertStore } from '@/stores/alert.store';
import { useOportunidadesStore } from '@/stores/oportunidades.store';
import { storeToRefs } from 'pinia';
import { Field, useForm } from 'vee-validate';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const oportunidades = useOportunidadesStore();
const alertStore = useAlertStore();

const valoresIniciais = {
  avaliacao: 'NaoAvaliada',
};

const oportunidadeID = ref(null);
const oportunidadeAvaliacao = ref(null);
const showModal = ref(false);

const {
  setFieldValue, handleSubmit,
} = useForm({
  initialValues: route.query,
  validationSchema: schema,
});

const {
  lista, chamadasPendentes, erro, paginação,
} = storeToRefs(oportunidades);

const tipos = [
  {
    value: 'Emenda',
    name: 'Emenda',
  },
  {
    value: 'Especial',
    name: 'Especial',
  },
  {
    value: 'Especifica',
    name: 'Específica',
  },
  {
    value: 'Voluntaria',
    name: 'Voluntária',
  },
];

const avaliacoes = [
  {
    value: 'Selecionada',
    name: 'Selecionada',
  },
  {
    value: 'NaoSeAplica',
    name: 'Não se aplica',
  },
  {
    value: 'NaoAvaliada',
    name: 'Não avaliada',
  },
];

function editarOportunidade(id, avaliacaoOportunidade) {
  showModal.value = true;
  oportunidadeID.value = id;
  oportunidadeAvaliacao.value = avaliacaoOportunidade;
}

function buscarOportunidades() {
  oportunidades.$reset();
  oportunidades.buscarTudo(
    route.query,
  );
}

const editAvaliacao = handleSubmit.withControlled(async (values) => {
  try {
    const msg = 'Dados salvos com sucesso!';
    const resposta = await oportunidades.salvarItem(
      oportunidadeID.value,
      { avaliacao: values.avaliacao },
    );
    if (resposta) {
      alertStore.success(msg);
      buscarOportunidades();
      showModal.value = false;
    }
  } catch (error) {
    alertStore.error(error);
  }
});

onMounted(() => {
  // PRA-FAZER: Isso aqui dará problema se quem usar abrir essa rota por um link compartilhado
  if (route.query.avaliacao === undefined) {
    router.replace({
      query: {
        ...route.query,
        avaliacao: valoresIniciais.avaliacao,
      },
    });
  } else {
    buscarOportunidades();
  }
});

watch(oportunidadeID, () => {
  setFieldValue('avaliacao', oportunidadeAvaliacao.value);
});

watch(
  () => route.query,
  buscarOportunidades,
);
</script>
<style lang="less" scoped>
.avaliacao {
  background-color: @cinza-claro-azulado;
  padding: 5px 10px;
  border-radius: 12px;
  display: inline-block;
}
</style>
