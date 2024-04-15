<script setup>
// Não finalizado
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { useFluxosFasesProjetosStore } from '@/stores/fluxosFasesProjeto.store';
import { useFluxosTarefasProjetosStore } from '@/stores/fluxosTarefaProjeto.store';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { ErrorMessage, Field, Form, useForm,} from 'vee-validate';
import TarefaFluxo from '@/views/fluxosProjeto/TarefaFluxo.vue';
import EtapaFluxo from '@/views/fluxosProjeto/EtapaFluxo.vue';
import FaseFluxo from '@/views/fluxosProjeto/FaseFluxo.vue';
import { workflow as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from 'pinia';

const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const fluxosFasesProjetos = useFluxosFasesProjetosStore();
const fluxosTarefasProjetos = useFluxosTarefasProjetosStore();
const alertStore = useAlertStore();
const router = useRouter();
const route = useRoute();

const { lista: tipoTransferenciaComoLista } = storeToRefs(tipoDeTransferenciaStore);
const { lista, chamadasPendentes, erro, itemParaEdição,  emFoco} = storeToRefs(fluxosProjetoStore);
const { chamadasPendentes: fasesPendentes } = storeToRefs(fluxosFasesProjetos);
const { chamadasPendentes: tarefasPendentes } = storeToRefs(fluxosTarefasProjetos);

const esferaSelecionada = ref('');
const exibeModalTarefa = ref(false);
const idDaEtapaEmFoco = ref(-1);
const idDoRelacionamentoComFase = ref(-1);
const idDaMãeDaFase = ref(0);

const props = defineProps({
  fluxoId: {
    type: Number,
    default: 0,
  },
  item: {
    type: Object,
    required: true,
  },
});

const { errors, isSubmitting, setFieldValue, handleSubmit } = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const tiposDisponíveis = computed(() => (esferaSelecionada.value
  ? tipoTransferenciaComoLista.value
    .filter((x) => x.esfera === esferaSelecionada.value)
  : []));

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  try {
    const msg = props.fluxoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fluxosProjetoStore.salvarItem(controlledValues, props.fluxoId)
    if (resposta) {
      alertStore.success(msg);
      fluxosProjetoStore.$reset();
      fluxosProjetoStore.buscarTudo();
      router.push({ name: "fluxosListar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function carregarFluxo() {
  if (props.fluxoId) {
    // PRA-FAZER: reavaliar a necessidade desse `await`
    await fluxosProjetoStore.buscarItem(props.fluxoId);
  }
}

async function iniciar() {
  await tipoDeTransferenciaStore.buscarTudo();
  carregarFluxo();
}

function excluirFase(idDaFase) {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await fluxosFasesProjetos.excluirItem(idDaFase)) {
      alertStore.success('Fase excluída!');
      iniciar();
    }
  }, 'Excluir');
}

function excluirTarefa(idDaTarefa) {
  alertStore.confirmAction('Tem certeza?', async () => {
    if (await fluxosTarefasProjetos.excluirItem(idDaTarefa)) {
      alertStore.success('Tarefa excluída!');
      iniciar();
    }
  }, 'Excluir');
}
iniciar()

onUnmounted(() => {
  emFoco.value = null;
});

watch(itemParaEdição, (novoValor) => {
  if (novoValor.transferencia_tipo?.id) {
    esferaSelecionada.value = tipoTransferenciaComoLista.value
      .find((x) => x.id === novoValor.transferencia_tipo.id)?.esfera || '';
  }
}, { immediate: true });

</script>

<template>
  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div v-if="erro" class="error p1">
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>

  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Cadastro de Fluxo' }}</h1>
    <hr class="ml2 f1">
  </div>

  <EtapaFluxo
    v-if="idDaEtapaEmFoco > -1"
    :ordem="item?.ordem || null"
    :item="item"
    :workflow_etapa_de_id="workflow_etapa_de_id"
    :workflow_etapa_para_id="workflow_etapa_para_id"
    :etapa-id="idDaEtapaEmFoco"
    @close="idDaEtapaEmFoco = -1"
    @saved="carregarFluxo()"
  />

  <FaseFluxo
    v-if="idDoRelacionamentoComFase > -1"
    :relacionamento-id="idDoRelacionamentoComFase"
    :etapa-id="idDaMãeDaFase"
    @close="idDoRelacionamentoComFase = -1"
    @saved="carregarFluxo()"
  />

  <TarefaFluxo
      @close="exibeModalTarefa = false"
      v-if="exibeModalTarefa"
      :relacionamento-id="idDoRelacionamentoComFase"
    />
  <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit">
    <div class="flex g2 mb1 center">
      <div class="f1">
        <LabelFromYup
          name="nome"
          :schema="schema"
        />
        <Field
          name="nome"
          type="text"
          class="inputtext light mb1"
          :disabled="emFoco?.edicao_restrita"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="esfera"
          :schema="schema"
        />
        <select
          v-model="esferaSelecionada"
          name="esfera"
          class="inputtext light mb1"
          :class="{ 'error': errors.esfera }"
          :disabled="emFoco?.edicao_restrita"
          @change="setFieldValue('transferencia_tipo_id', null)"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(esferasDeTransferencia)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </select>
        <div class="error-msg">
          {{ errors.esfera }}
        </div>
      </div>
      <div class="f1">
        <LabelFromYup
          name="transferencia_tipo_id"
          :schema="schema"
        />
        <Field
          name="transferencia_tipo_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.transferencia_tipo_id,
            loading: tipoDeTransferenciaStore.chamadasPendentes?.lista,
          }"
          :disabled="!tiposDisponíveis.length || emFoco?.edicao_restrita"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in tiposDisponíveis"
            :key="item"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="transferencia_tipo_id"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1 center">
      <div class="f1">
        <LabelFromYup
          name="inicio"
          :schema="schema"
        />
        <Field
          name="inicio"
          type="date"
          class="inputtext light mb1"
          :class="{ errors: errors.inicio }"
          maxlength="10"
          :disabled="emFoco?.edicao_restrita"
        />
        <ErrorMessage
          name="inicio"
          class="error-msg"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="termino"
          :schema="schema"
        />
        <Field
          name="termino"
          type="date"
          class="inputtext light mb1"
          :class="{ errors: errors.termino }"
          maxlength="10"
        />
        <ErrorMessage
          name="termino"
          class="error-msg"
        />
      </div>
      <div class="f1 flex">
        <Field
          name="ativo"
          type="checkbox"
          :value="true"
          class="inputcheckbox mr1"
        />
        <LabelFromYup
          name="ativo"
          :schema="schema"
        />
        <ErrorMessage
          class="error-msg"
          name="ativo"
        />
      </div>
      <FormErrorsList :errors="errors" />
    </div>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div v-if="erro" class="error p1">
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>

  <div class="flex spacebetween center mb2" v-if="props.fluxoId">
    <h1>Etapas do fluxo</h1>
    <hr class="ml2 f1">
    <button
      v-if="emFoco && !emFoco?.edicao_restrita"
      class="btn ml2"
      @click="idDaEtapaEmFoco = 0"
    >
      Adicionar etapa
    </button>
  </div>

  <div class="todasTabela">
    <div class="cadaTabela" v-for="item in emFoco?.fluxo"
        :key="item.id">
      <div class="flex flexwrap center">
        <div class="flex">
          <span class="ordem">{{ item && item.ordem ? item.ordem : ''  }}</span>
          <h2 class="mb0 fb50 f1 tituloTabela flex g1 center">
            Etapa <span>{{ item.fluxo_etapa_de.etapa_fluxo }}</span>
            para <span>{{ item.fluxo_etapa_para.etapa_fluxo }}</span>
          </h2>
        </div>
        <hr class="ml2 f1">
        <div class="flex f0 spacebetween g1 center mlauto mr0">
          <button
            v-if="emFoco && !emFoco?.edicao_restrita"
            class="btn ml2"
            @click="() => {
              idDoRelacionamentoComFase = 0;
              idDaMãeDaFase = item.id;
            }"
          >
            Adicionar fase
          </button>
          <button
            v-if="emFoco && !emFoco?.edicao_restrita"
            class="btn outline bgnone tcprimary mtauto"
            :ordem="item.ordem"
            :workflow_etapa_de_id="item.workflow_etapa_de_id"
            :workflow_etapa_para_id="item.workflow_etapa_para_id"
            @click="idDaEtapaEmFoco = item.id"
          >
            Editar etapa
          </button>
        </div>
      </div>

      <table class="tablemain mb4">
        <col>
        <col>
        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
        <thead>
          <tr>
            <th>
              Fase
            </th>
            <th>
              Situação
            </th>
          </tr>
        </thead>
        <tbody v-for="fase in item.fases">
          <tr>
            <td
              :class="{
                loading: fasesPendentes?.lista
              }"
              >{{ fase.fase.fase  }}</td>
            <td>
              <span v-if="fase.situacoes && fase.situacoes.length">
                {{ fase.situacoes.map(situacao => situacao.situacao).join(', ') }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <button
                v-if="emFoco && !emFoco?.edicao_restrita"
                class="bgnone like-a__text"
                @click="exibeModalTarefa = true"
              >
                <svg width="20" height="20">
                  <use xlink:href="#i_+" />
                </svg>
              </button>
            </td>
            <td>
              <button
                v-if="emFoco && !emFoco?.edicao_restrita"
                class="like-a__text"
                arial-label="excluir"
                title="excluir"
                @click="excluirFase(fase.id)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
            <td>
              <button
                v-if="emFoco && !emFoco?.edicao_restrita"
                class="bgnone like-a__text"
                @click="() => {
                  idDoRelacionamentoComFase = fase.id;
                  idDaMãeDaFase = item.id;
                }"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </button>
            </td>
          </tr>
          <tr class="tarefaTabela" v-for="tarefa in fase.tarefas" :key="tarefa.id">
            <td
              :class="{
                loading: tarefasPendentes?.lista
              }"
            >
              <span class="tarefa pl3">Tarefa</span>
              {{ tarefa.workflow_tarefa.descricao || "-"}}
            </td>
            <td/>
            <td/>
            <td>
              <button
                v-if="emFoco && !emFoco?.edicao_restrita"
                class="like-a__text"
                arial-label="excluir"
                title="excluir"
                @click="excluirTarefa(tarefa.id)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </td>
            <td>
              <button
                v-if="emFoco && !emFoco?.edicao_restrita"
                class="bgnone like-a__text"
                @click="exibeModalTarefa = true"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </button>
            </td>
          </tr>

          <tr v-if="chamadasPendentes.lista">
            <td colspan="3">
              Carregando
            </td>
          </tr>
          <tr v-else-if="erro">
            <td colspan="3">
              Erro: {{ erro }}
            </td>
          </tr>
          <tr v-else-if="!lista.length">
            <td colspan="3">
              Nenhum resultado encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

</template>

<style scoped>
  .tituloTabela span{
    color:#607A9F;
  }

  span.ordem{
      width: 46px;
      height: 46px;
      color: #fff;
      padding: 16px;
      text-align: center;
      border-radius: 50%;
      position: relative;
      right: 25px;
  }

  .tablemain td {
    padding: 4px 1em;
  }

  .todasTabela > div:nth-child(odd) .ordem {
    background-color:#4074BF;
  }

  .todasTabela > div:nth-child(even) .ordem  {
    background-color: #F7C234;
  }

  .todasTabela > .cadaTabela:nth-child(even) {
    border-left: 4px solid #F7C234;
  }

  .todasTabela > .cadaTabela:nth-child(odd) {
    border-left: 4px solid #4074BF;
  }

  .tablemain tr:nth-of-type(even), .tablemain tz:nth-of-type(even) {
      background: transparent;
  }

  .tarefa{
    color: #4074BF;
    font-weight: 700;
  }

  .tarefaTabela span::after {
      content: '';
      display: inline-block;
      width: 40px;
      height: 1px;
      background: #4074BF;
      vertical-align: middle;
      margin: 0 24px 0 24px;

  }
</style>
