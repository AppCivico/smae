<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import { acompanhamento as schema } from '@/consts/formSchemas';
import dateToField from '@/helpers/dateToField';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, defineOptions, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ inheritAttrs: false });

const acompanhamentosStore = useAcompanhamentosStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(acompanhamentosStore);
const projetosStore = useProjetosStore();
const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

const route = useRoute();
const router = useRouter();
const projetoId = route?.params?.projetoId;
const listaFiltradaPorTermoDeBusca = ref([]);
const grauVisível = ref(0);
const statusVisível = ref(0);

async function iniciar() {
  acompanhamentosStore.$reset();

  if (!route.query.ordenar_por) {
    router.replace({
      query: {
        ...route.query,
        ordenar_por: 'data_registro',
        ordem: 'decrescente',
      },
    });
  }

  await acompanhamentosStore.buscarTudo();
}

const listaFiltrada = computed(() => (!statusVisível.value && !grauVisível.value
  ? listaFiltradaPorTermoDeBusca.value
  : listaFiltradaPorTermoDeBusca.value
    .filter((x) => (!grauVisível.value || x.grau === grauVisível.value)
      && (!statusVisível.value || x.status_acompanhamento === statusVisível.value))
));

const opçõesDeOrdenação = {
  data_registro: {
    valor: 'data_registro',
    nome: 'Data do acompanhamento',
  },
  criado_em: {
    valor: 'criado_em',
    nome: 'Data de inclusão',
  },
  atualizado_em: {
    valor: 'atualizado_em',
    nome: 'Data de alteração',
  },
  acompanhamento_tipo: {
    valor: 'acompanhamento_tipo',
    nome: 'Tipo',
  },
};

const parâmetroDeOrdenação = computed(() => route.query.ordenar_por?.toLowerCase().trim());
const ordemDeOrdenação = computed(() => route.query.ordem?.toLowerCase().trim());

const listaOrdenada = computed(() => {
  switch (parâmetroDeOrdenação.value) {
    case 'atualizado_em':
    case 'criado_em':
    case 'data_registro':
      return ordemDeOrdenação.value === 'decrescente'
        ? listaFiltrada.value.toSorted((a, b) => {
          if (a[parâmetroDeOrdenação.value] > b[parâmetroDeOrdenação.value]) {
            return -1;
          }
          if (a[parâmetroDeOrdenação.value] < b[parâmetroDeOrdenação.value]) {
            return 1;
          }
          return 0;
        })
        : listaFiltrada.value.toSorted((a, b) => {
          if (a[parâmetroDeOrdenação.value] > b[parâmetroDeOrdenação.value]) {
            return 1;
          }
          if (a[parâmetroDeOrdenação.value] < b[parâmetroDeOrdenação.value]) {
            return -1;
          }
          return 0;
        });

    case 'acompanhamento_tipo':
      return ordemDeOrdenação.value === 'crescente'
        ? listaFiltrada.value
          .toSorted((a, b) => a?.acompanhamento_tipo?.nome
            .localeCompare(b?.acompanhamento_tipo?.nome))
        : listaFiltrada.value
          .toSorted((a, b) => b?.acompanhamento_tipo?.nome
            .localeCompare(a?.acompanhamento_tipo?.nome));

    default:
      return listaFiltrada.value;
  }
});

function aplicarOrdenação(nome, valor) {
  const valoresParaAplicar = {
    [nome]: valor || undefined,
  };

  if (nome === 'ordenar_por') {
    switch (valor) {
      case 'atualizado_em':
      case 'criado_em':
      case 'data_registro':
        if (!ordemDeOrdenação.value) {
          valoresParaAplicar.ordem = 'decrescente';
        }
        break;
      case 'acompanhamento_tipo':
        if (!ordemDeOrdenação.value) {
          valoresParaAplicar.ordem = 'crescente';
        }
        break;
      default:
        valoresParaAplicar.ordem = undefined;
        break;
    }
  }

  router.replace({
    query: {
      ...route.query,
      ...valoresParaAplicar,
    },
  });
}

iniciar();
</script>
<template>
  <!-- eslint-disable-next-line max-len -->
  <!-- eslint-disable vue/multiline-html-element-content-newline
vue/singleline-html-element-content-newline -->
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Acompanhamentos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <div
      v-if="!permissõesDoProjetoEmFoco.apenas_leitura
        || permissõesDoProjetoEmFoco.sou_responsavel"
      class="ml2"
    >
      <router-link
        :to="{ name: 'acompanhamentosCriar' }"
        class="btn"
      >
        Novo registro de acompanhamento
      </router-link>
    </div>
  </div>

  <div class="flex center g2 mb1 flexwrap">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="f1"
    />
    <div class="f0">
      <label class="label tc300">
        Ordenar por
      </label>
      <select
        class="inputtext light mb1"
        :disabled="!listaFiltrada.length"
        name="ordenar_por"
        @change="($e) => aplicarOrdenação($e.target.name, $e.target.value)"
      >
        <option value="">Número</option>
        <option
          v-for="item in Object.values(opçõesDeOrdenação)"
          :key="item.valor"
          :value="item.valor"
          :selected="parâmetroDeOrdenação === item.valor"
        >
          {{ item.nome }}
        </option>
      </select>
    </div>

    <div class="f0">
      <label class="label tc300">
        Ordem
      </label>
      <select
        class="inputtext light mb1"
        :disabled="!listaFiltrada.length || !parâmetroDeOrdenação"
        name="ordem"
        @change="($e) => aplicarOrdenação($e.target.name, $e.target.value)"
      >
        <option
          value=""
          :disabled="!!parâmetroDeOrdenação"
          :selected="!!ordemDeOrdenação"
        />
        <option
          value="crescente"
          :selected="ordemDeOrdenação === 'crescente'"
        >
          crescente
        </option>
        <option
          value="decrescente"
          :selected="ordemDeOrdenação === 'decrescente'"
        >
          decrescente
        </option>
      </select>
    </div>
  </div>

  <table
    v-if="listaFiltrada.length"
    class="tabela-de-etapas"
  >
    <colgroup>
      <col class="col--number">
      <col class="col--data">
      <col>
      <col>
      <col class="col--number">
      <col>
      <col class="col--botão-de-ação">
      <col
        v-if="!permissõesDoProjetoEmFoco.apenas_leitura
          || permissõesDoProjetoEmFoco.sou_responsavel"
        class="col--botão-de-ação"
      >
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th class="cell-number">
          Número
        </th>
        <th class="cell--data">
          {{ schema.fields.data_registro.spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields.acompanhamento_tipo_id.spec.label }}
        </th>
        <th class="tl">
          {{ schema.fields.pauta.spec.label }}
        </th>
        <th class="cell--number">
          {{ schema.fields.acompanhamentos.spec.label }}
        </th>
        <th :aria-label="schema.fields.apresentar_no_relatorio.spec.label" />
        <th
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
        />
      </tr>
    </thead>

    <tbody
      class="tablemain"
    >
      <tr
        v-for="linha in listaOrdenada"
        :key="linha.id"
      >
        <th class="cell--number">
          {{ linha.ordem }}
        </th>
        <th class="cell--data">
          {{ dateToField(linha.data_registro) }}
        </th>
        <td>
          {{ linha.acompanhamento_tipo?.nome ? linha.acompanhamento_tipo.nome : '-' }}
        </td>
        <td>
          {{ linha.pauta }}
        </td>
        <td class="cell--number">
          {{ linha.acompanhamentos.length ?? 0 }}
        </td>
        <td>
          <span
            v-if="linha.apresentar_no_relatorio"
            class="tipinfo tprimary"
          >
            <svg
              width="16"
              height="16"
            >
              <use xlink:href="#i_i" />
            </svg>
            <div>
              {{ schema.fields.apresentar_no_relatorio.spec.label }}
            </div>
          </span>
        </td>
        <td>
          <router-link
            :to="{
              name: 'acompanhamentosResumo',
              params: {
                projetoId: projetoId,
                acompanhamentoId: linha.id,
              }
            }"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_eye" /></svg>
          </router-link>
        </td>
        <td
          v-if="!permissõesDoProjetoEmFoco.apenas_leitura
            || permissõesDoProjetoEmFoco.sou_responsavel"
          class="center"
        >
          <router-link
            :to="{
              name: 'acompanhamentosEditar',
              params: {
                projetoId: projetoId,
                acompanhamentoId: linha.id,
              }
            }"
            title="Editar acompanhamento"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
    </tbody>
  </table>

  <span
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
