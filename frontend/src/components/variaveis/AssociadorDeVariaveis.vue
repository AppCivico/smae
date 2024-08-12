<template>
  <div class="flex spacebetween center mb2">
    <h2>Escolher variáveis para {{ $props.indicador?.titulo }}</h2>
    <hr class="ml2 f1">
    <CheckClose
      :apenas-emitir="true"
      :formulário-sujo="!!variaveisSelecionadas.length"
      @close="emit('close')"
    />
  </div>

  <FiltroDeDeVariaveis
    :aria-busy="chamadasPendentes.lista"
    :valores-iniciais="{
      ipp: 100,
      ordem_coluna: 'codigo',
      ordem_direcao: 'crescente',
    }"
    @submit="($v) => dispararBuscaDeVariaveis($v)"
  />

  <LoadingComponent v-if="chamadasPendentes.lista" />
  <p v-else>
    Exibindo <strong>{{ lista.length }}</strong> resultados de {{ paginacao.totalRegistros }}.
  </p>

  <form
    ref="formularioDeAssociacao"
    @submit.prevent="associar(false)"
  >
    <div
      role="region"
      aria-labelledby="titulo-da-pagina"
      tabindex="0"
      class="mb2"
    >
      <table
        class="tablemain"
      >
        <col class="col--botão-de-ação">
        <col class="col--minimum">
        <col>
        <col>
        <col class="col--minimum">
        <col class="col--minimum">
        <col>
        <thead>
          <tr>
            <th />
            <th>
              Código
            </th>
            <th>
              {{ schema.fields.titulo?.spec.label }}
            </th>
            <th>
              {{ schema.fields.fonte_id?.spec.label }}
            </th>
            <th class="cell--nowrap">
              {{ schema.fields.periodicidade?.spec.label }}
            </th>
            <th>
              {{ schema.fields.orgao_id?.spec.label }}
            </th>
            <th>
              Planos
            </th>
          </tr>
        </thead>

        <tr
          v-for="item in lista"
          :key="item.id"
        >
          <td>
            <input
              v-model="variaveisSelecionadas"
              type="checkbox"
              title="selecionar"
              :value="item.id"
              name="variavel_ids"
            >
          </td>

          <td class="cell--nowrap">
            {{ item.codigo }}
          </td>
          <th>
            <router-link
              v-if="item.pode_editar"
              :to="{ name: 'variaveisEditar', params: { variavelId: item.id } }"
              class="tprimary"
              target="_blank"
            >
              {{ item.titulo }}
            </router-link>
          </th>
          <td>
            {{ item.fonte?.nome || item.fonte || '-' }}
          </td>
          <td class="cell--nowrap">
            {{ item.periodicidade }}
          </td>
          <td class="cell--nowrap">
            <abbr
              v-if="item.orgao"
              :title="item.orgao.descricao"
            >
              {{ item.orgao.sigla || item.orgao }}
            </abbr>
          </td>
          <td class="contentStyle">
            <ul v-if="Array.isArray(item.planos)">
              <li
                v-for="plano in item.planos"
                :key="plano.id"
              >
                <component
                  :is="temPermissãoPara([
                    'CadastroPS.administrador',
                    'CadastroPS.administrador_no_orgao'
                  ])
                    ? 'router-link'
                    : 'span'"
                  :to="{
                    name: 'planosSetoriaisResumo', params: {
                      planoSetorialId:
                        plano.id
                    }
                  }"
                  target="_blank"
                  :title="plano.nome?.length > 36 ? plano.nome : null"
                >
                  {{ truncate(plano.nome, 36) }}
                </component>
              </li>
            </ul>
          </td>
        </tr>

        <tr v-if="chamadasPendentes.lista">
          <td colspan="7">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erros.lista">
          <td colspan="7">
            Erro: {{ erros.lista }}
          </td>
        </tr>
        <tr v-else-if="!lista.length">
          <td colspan="7">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </table>
    </div>

    <p class="mb1">
      <strong>
        {{ variaveisSelecionadas.length }}
      </strong>
      <template v-if="variaveisSelecionadas.length === 1">
        variável selecionada
      </template>
      <template v-else>
        variáveis selecionadas
      </template>
      de {{ paginacao.totalRegistros }}.
    </p>

    <LoadingComponent
      v-if="envioPendente"
      class="mb1"
    />
    <ErrorComponent
      :erro="erro"
      class="mb1"
    />

    <div class="flex spacebetween g1 center mb2">
      <hr class="mr2 f1">
      <button
        type="button"
        class="btn outline bgnone tcprimary big"
        :aria-disabled="!variaveisSelecionadas.length || envioPendente"
        @click="associar(true)"
      >
        Associar e fechar
      </button>
      <button
        type="submit"
        class="btn big"
        :aria-disabled="!variaveisSelecionadas.length || envioPendente"
      >
        Associar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
<script setup lang="ts">
import type { Indicador } from '@/../../backend/src/indicador/entities/indicador.entity';
import FiltroDeDeVariaveis from '@/components/variaveis/FiltroDeDeVariaveis.vue';
import { variavelGlobal as schema } from '@/consts/formSchemas';
import EnvioParaObjeto from '@/helpers/EnvioParaObjeto.ts';
import requestS from '@/helpers/requestS.ts';
import truncate from '@/helpers/truncate';
import { useAuthStore } from '@/stores/auth.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import { storeToRefs } from 'pinia';
import type { PropType } from 'vue';
import { ref } from 'vue';
import LoadingComponent from '../LoadingComponent.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  indicador: {
    type: Object as PropType<Indicador>,
    required: true,
  },
});

const emit = defineEmits(['close']);

const variaveisGlobaisStore = useVariaveisGlobaisStore();
const {
  lista, chamadasPendentes, erros, paginacao,
} = storeToRefs(variaveisGlobaisStore);

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const formularioDeAssociacao = ref<HTMLFormElement | null>(null);
const variaveisSelecionadas = ref<number[]>([]);
const envioPendente = ref<boolean>(false);
const erro = ref<string | null>(null);

function dispararBuscaDeVariaveis(evento: SubmitEvent) {
  const params = EnvioParaObjeto(evento, true);

  variaveisGlobaisStore.buscarTudo({
    ...params,
    not_indicador_id: props.indicador?.id,
  }).then(() => {
    variaveisSelecionadas.value.splice(0);
  });
}

async function associar(encerrar = false) {
  if (envioPendente.value) {
    return;
  }

  console.debug('associar', encerrar);

  erro.value = null;
  envioPendente.value = true;

  await new Promise((resolve) => { setTimeout(resolve, 5000); });

  requestS.patch(`${baseUrl}/plano-setorial-indicador/${props.indicador.id}/associar-variavel`, {
    variavel_ids: variaveisSelecionadas.value,
  }).then(() => {
    if (encerrar) {
      emit('close');
    }

    // formularioDeAssociacao.value?.reset();
    variaveisSelecionadas.value.splice(0);
  }).catch((err) => {
    erro.value = err.message;
  }).finally(() => {
    envioPendente.value = false;
  });
}

variaveisGlobaisStore.buscarTudo();
</script>
