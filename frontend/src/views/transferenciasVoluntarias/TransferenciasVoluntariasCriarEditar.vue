<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import cargosDeParlamentar from '@/consts/cargosDeParlamentar';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import { transferenciasVoluntarias as schema } from '@/consts/formSchemas';
import interfacesDeTransferências from '@/consts/interfacesDeTransferências';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/truncate';

import { useAlertStore } from '@/stores/alert.store';
import { useClassificacaoStore } from '@/stores/classificacao.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import CampoComBuscaRemota from '@/components/campoComBuscaRemota/CampoComBuscaRemota.vue';

const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const TipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const classificacaoStore = useClassificacaoStore();
const partidoStore = usePartidosStore();
const ÓrgãosStore = useOrgansStore();
const ParlamentaresStore = useParlamentaresStore();

const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(TransferenciasVoluntarias);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const {
  lista: parlamentarComoLista,
  parlamentaresPorId,
  paginação: paginaçãoDeParlamentares,
} = storeToRefs(ParlamentaresStore);
const { lista: tipoTransferenciaComoLista } = storeToRefs(TipoDeTransferenciaStore);
const { lista: classificacaoComoLista } = storeToRefs(classificacaoStore);
const { lista: partidoComoLista } = storeToRefs(partidoStore);

const router = useRouter();
const props = defineProps({
  transferenciaId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

const alertStore = useAlertStore();

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const tipoIdInicial = ref(itemParaEdicao?.value?.tipo_id);
const esferaSelecionada = ref('');
// const partidosDisponíveis = computed(() => (partidoComoLista));
/* const outrosPartidos = computed(() => (
  partidoComoLista.value.filter((x) => !partidosDisponíveis.value.find((y) => y.id === x.id)) || []
)); */

const tiposDisponíveis = computed(() => (values.esfera
  ? tipoTransferenciaComoLista.value.filter((x) => x.esfera === values.esfera)
  : []));

const classificacoesDisponiveis = computed(() => (values.tipo_id
  ? classificacaoComoLista.value.filter((x) => x.transferencia_tipo_id === values.tipo_id)
  : []));

async function salvarTransferencia(cargaManipulada) {
  try {
    let r;
    const msg = props.transferenciaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.transferenciaId) {
      r = await TransferenciasVoluntarias.salvarItem(cargaManipulada, props.transferenciaId);
    } else {
      r = await TransferenciasVoluntarias.salvarItem(cargaManipulada);
    }
    if (r) {
      TransferenciasVoluntarias.buscarItem(r.id);

      alertStore.success(msg);

      if (!props.transferenciaId) {
        router.push({
          name: 'RegistroDeTransferenciaEditar',
          params: {
            transferenciaId: r.id,
          },
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  const cargaManipulada = nulificadorTotal(controlledValues);
  if (tipoIdInicial.value && values?.tipo_id !== tipoIdInicial.value) {
    alertStore.confirmAction(`A troca de tipo irá excluir todo workflow e cronograma da transferência ${itemParaEdicao?.value.identificador}. Deseja continuar?`, async () => {
      await salvarTransferencia(cargaManipulada);
    }, 'Continuar');
  } else {
    await salvarTransferencia(cargaManipulada);
  }
});

const formularioSujo = useIsFormDirty();

function iniciar() {
  if (props.transferenciaId) {
    TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  }

  ÓrgãosStore.getAll();
  // Discutir uma implementação melhor
  ParlamentaresStore.buscarTudo({ ipp: 500, possui_mandatos: true });
  TipoDeTransferenciaStore.buscarTudo();
  classificacaoStore.buscarTudo();
  partidoStore.buscarTudo();
}

function sugerirCargoEPartido(idx, parlamentar) {
  const {
    cargo_mais_recente: cargoMaisRecente,
    partido: { id: partidoMaisRecente },
  } = parlamentar;

  if (cargoMaisRecente) {
    setFieldValue(`parlamentares[${idx}].cargo`, cargoMaisRecente);
  }
  if (partidoMaisRecente) {
    setFieldValue(`parlamentares[${idx}].partido_id`, partidoMaisRecente);
  }
}

iniciar();

watch(itemParaEdicao, (novosValores) => {
  if (novosValores && novosValores.tipo_id !== undefined) {
    tipoIdInicial.value = novosValores.tipo_id;
  }
  resetForm({ values: novosValores });
});
</script>
<template>
  <div class="flex spacebetween center mb2 mt2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <CheckClose
      :formulario-sujo="formularioSujo"
    />
  </div>

  <form @submit.prevent="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="ano"
          :schema="schema"
        />
        <Field
          name="ano"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="ano"
        />
      </div>
      <div
        v-if="props.transferenciaId"
        class="f1"
      >
        <label class="label tc300">
          Identificador
        </label>
        <input
          name="identificador"
          type="text"
          class="inputtext light mb1"
          :disabled="props.transferenciaId"
          :value="itemParaEdicao?.identificador"
        >
      </div>

      <div class="f1">
        <LabelFromYup
          name="esfera"
          :schema="schema"
        />
        <Field
          v-model="esferaSelecionada"
          name="esfera"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.esfera }"
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
        </Field>
        <div class="error-msg">
          {{ errors.esfera }}
        </div>
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="tipo_id"
          :schema="schema"
        />
        <Field
          name="tipo_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.tipo_id,
            loading: TipoDeTransferenciaStore.chamadasPendentes?.lista,
          }"
          :disabled="!tiposDisponíveis.length"
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
          name="tipo_id"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="classificacao_id"
          :schema="schema"
        />
        <Field
          name="classificacao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.classificacao_id,
          }"
          :disabled="!values.tipo_id || !classificacoesDisponiveis.length"
        >
          <option value="">
            Selecionar
          </option>

          <option
            v-for="item in classificacoesDisponiveis"
            :key="item"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="classificacao_id"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="interface"
          :schema="schema"
        />
        <Field
          name="interface"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.interface }"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(interfacesDeTransferências)"
            :key="item.nome"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.interface }}
        </div>
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="emenda"
          :schema="schema"
        />
        <Field
          name="emenda"
          type="text"
          class="inputtext light mb1"
          placeholder="000.000.000.000/ AAAA.0000000.00000 / AAAA.000.00000"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="emenda"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="emenda_unitaria"
          :schema="schema"
        />
        <Field
          name="emenda_unitaria"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="emenda_unitaria"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="halfInput f1">
        <LabelFromYup
          name="demanda"
          :schema="schema"
        />
        <Field
          name="demanda"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="demanda"
        />
      </div>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Origem
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="orgao_concedente_id"
          :schema="schema"
        />
        <Field
          name="orgao_concedente_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.orgao_concedente_id,
            loading: ÓrgãosStore.chamadasPendentes?.lista,
          }"
          :disabled="!órgãosComoLista?.length"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in órgãosComoLista"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>
        <ErrorMessage
          name="orgao_concedente_id"
          class="error-msg"
        />
      </div>
      <div
        class="f1"
      >
        <LabelFromYup
          name="secretaria_concedente"
          :schema="schema"
        />
        <Field
          name="secretaria_concedente"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="secretaria_concedente"
        />
      </div>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Parlamentares
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="mb1">
      <FieldArray
        v-slot="{ fields, push, remove }"
        name="parlamentares"
      >
        <div
          v-for="(field, idx) in fields"
          :key="field.key"
          class="flex flexwrap center g2 mb2"
        >
          <div class="f1">
            <Field
              :name="`parlamentares[${idx}].id`"
              type="hidden"
              class="inputtext light"
            />

            <LabelFromYup
              name="parlamentar_id"
              :schema="schema.fields.parlamentares.innerType"
            />

            <Field
              v-slot="{ handleChange, value }"
              :name="`parlamentares[${idx}].parlamentar_id`"
              type="text"
              class="f1 inputtext light"
            >
              <CampoComBuscaRemota
                :model-value="value"
                :valor-inicial="field.value.parlamentar"
                url-requisicao="parlamentar"
                chave-de-busca="palavra_chave"
                chave-de-valor="id"
                chave-de-exibicao="nome_popular"
                texto-do-botao="Selecionar"
                texto-de-instrucoes="Pesquisar por parlamentar ou partido"
                @update:model-value="handleChange"
                @item-selecionado="sugerirCargoEPartido(idx, $event)"
              >
                <template #TableHeader>
                  <th> Nome de urna </th>
                  <th> Nome </th>
                  <th> Partido </th>
                </template>

                <template #TableData="{item}">
                  <td>{{ item.nome_popular }}</td>
                  <td>{{ item.nome }}</td>
                  <td>{{ item.partido.sigla }}</td>
                </template>

                <template #ValorExibido="{item}">
                  {{ item ? item.nome_popular : field.value.parlamentar?.nome_popular }}
                </template>
              </CampoComBuscaRemota>
            </Field>

            <ErrorMessage
              :name="`parlamentares[${idx}].parlamentar_id`"
              class="error-msg"
            />
          </div>

          <div class="f1">
            <LabelFromYup
              name="parlamentares.partido_id"
              :schema="schema"
            />
            <Field
              :name="`parlamentares[${idx}].partido_id`"
              as="select"
              class="inputtext light mb1"
              :class="{
                error: errors.partido_id,
                loading: partidoStore.chamadasPendentes?.lista,
              }"
              :disabled="!partidoComoLista.length"
            >
              <option value="">
                Selecionar
              </option>

              <option
                v-for="item in partidoComoLista"
                :key="item"
                :value="item.id"
              >
                {{ item.sigla }}
              </option>
            </Field>
            <ErrorMessage
              :name="`parlamentares[${idx}].partido_id`"
              class="error-msg"
            />
          </div>

          <div class="f1">
            <LabelFromYup
              name="parlamentares.cargo"
              :schema="schema"
            />
            <Field
              :name="`parlamentares[${idx}].cargo`"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.cargo }"
            >
              <option value="">
                Selecionar
              </option>

              <option
                v-for="(cargo, i) in cargosDeParlamentar"
                :key="i"
                :value="cargo.valor || cargo"
              >
                {{ cargo.nome || cargo }}
              </option>
            </Field>
            <div class="error-msg">
              {{ errors.cargo }}
            </div>
          </div>

          <div class="align-center">
            <button
              class="like-a__text addlink"
              arial-label="excluir"
              title="excluir"
              @click="remove(idx)"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg>
            </button>
          </div>
        </div>

        <button
          class="like-a__text addlink"
          type="button"
          @click="push({ nome: '', processo_sei: '' })"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar parlamentar
        </button>
      </FieldArray>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">
        Transferência
      </h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="programa"
          :schema="schema"
        />
        <Field
          name="programa"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="programa"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="nome_programa"
          :schema="schema"
        />
        <Field
          name="nome_programa"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome_programa"
        />
      </div>
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        name="objeto"
        :schema="schema"
      />
      <Field
        name="objeto"
        as="textarea"
        class="inputtext light mb1"
        rows="5"
        maxlength="1000"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="objeto"
      />
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        name="detalhamento"
        :schema="schema"
      />
      <Field
        name="detalhamento"
        as="textarea"
        class="inputtext light mb1"
        rows="5"
        maxlength="250"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="detalhamento"
      />
    </div>

    <div class="flex g1 mb1">
      <div class="f1">
        <LabelFromYup
          name="clausula_suspensiva"
          :schema="schema"
        />
        <Field
          name="clausula_suspensiva"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva }"
        >
          <option :value="true">
            Sim
          </option>
          <option :value="false">
            Não
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.clausula_suspensiva }}
        </div>
      </div>
      <div
        v-if="values.clausula_suspensiva"
        class="f1"
      >
        <LabelFromYup
          name="clausula_suspensiva_vencimento"
          :schema="schema"
          :required="true"
        />
        <Field
          name="clausula_suspensiva_vencimento"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva_vencimento }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => {
            setFieldValue('clausula_suspensiva_vencimento', $v || null);
          }"
        />
        <ErrorMessage
          name="clausula_suspensiva_vencimento"
          class="error-msg"
        />
      </div>
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        name="normativa"
        :schema="schema"
      />
      <Field
        name="normativa"
        type="text"
        class="inputtext light mb1"
        placeholder="Lei, IN, Portaria"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="normativa"
      />
    </div>

    <div class="f1 mb3">
      <LabelFromYup
        name="observacoes"
        :schema="schema"
      />
      <Field
        name="observacoes"
        as="textarea"
        class="inputtext light mb1"
        rows="5"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="observacoes"
      />
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

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
