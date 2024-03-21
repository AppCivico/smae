<script setup>
import { transferenciasVoluntarias as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import interfacesDeTransferências from '@/consts/interfacesDeTransferências';
import truncate from '@/helpers/truncate';

const TransferenciasVoluntarias = useTransferenciasVoluntariasStore();
const TipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const partidoStore = usePartidosStore();
const ÓrgãosStore = useOrgansStore();
const ParlamentaresStore = useParlamentaresStore();

const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(TransferenciasVoluntarias);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const { lista: parlamentarComoLista } = storeToRefs(ParlamentaresStore);
const { lista: tipoTransferenciaComoLista } = storeToRefs(TipoDeTransferenciaStore);
const { lista: partidoComoLista } = storeToRefs(partidoStore);

const router = useRouter();
const route = useRoute();
const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

async function onSubmit(_, { controlledValues }) {
  try {
    let r;
    const msg = props.transferenciaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.transferenciaId) {
      r = await TransferenciasVoluntarias.salvarItem(controlledValues, props.transferenciaId);
    } else {
      r = await TransferenciasVoluntarias.salvarItem(controlledValues);
    }
    if (r) {
      alertStore.success(msg);
      if( props.transferenciaId ){
        router.push({ name: 'TransferenciasVoluntariasListar' });
       } else {
         router.push({
          name: 'RegistroDeTransferenciaCriar',
          params:{
            transferenciaId: r.id,
          }
         });
       }

    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar(){
  if (props.transferenciaId) {
    TransferenciasVoluntarias.buscarItem(props.transferenciaId);
  }

  ÓrgãosStore.getAll();
  ParlamentaresStore.buscarTudo();
  TipoDeTransferenciaStore.buscarTudo();
  partidoStore.buscarTudo();
}
iniciar()

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Formulário de registro' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Identificação</h3>
    <hr class="ml2 f1">
  </div>

  <Form v-slot="{ errors, isSubmitting, setValues }" :validation-schema="schema" :initial-values="itemParaEdição"
    @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="identificador" :schema="schema" />
        <Field name="identificador" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="identificador" />
      </div>

      <div class="f1">
        <label class="label">Esfera <span class="tvermelho">*</span></label>
        <Field name="esfera" as="select" class="inputtext light mb1" :class="{ 'error': errors.esfera }">
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
        <LabelFromYup name="tipo_id" :schema="schema" />
        <Field name="tipo_id" as="select" class="inputtext light mb1" :class="{
            error: errors.tipo_id,
            loading: TipoDeTransferenciaStore.chamadasPendentes?.lista,
          }" :disabled="!tipoTransferenciaComoLista?.length">
          <option :value="0">
            Selecionar
          </option>

          <option v-for="item in tipoTransferenciaComoLista" :key="item" :value="item.id">
            {{ item.nome }} -- {{ item.esfera }}
          </option>
        </Field>
        <ErrorMessage name="tipo_id" class="error-msg" />
      </div>
      <div class="f1">
        <label class="label">Interface <span class="tvermelho">*</span></label>
        <Field name="interface" as="select" class="inputtext light mb1" :class="{ 'error': errors.interface }">
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
      <div class="f1">
        <LabelFromYup name="programa" :schema="schema" />
        <Field name="programa" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="programa" />
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="emenda" :schema="schema" />
        <Field name="emenda" type="text" class="inputtext light mb1"
          placeholder="000.000.000.000/ AAAA.0000000.00000 / AAAA.000.00000"
          @change="!$event.target.value ? setValues({emenda:null}) : null" />
        <ErrorMessage class="error-msg mb1" name="emenda" />
      </div>

      <div class="f1">
        <LabelFromYup name="emenda_unitaria" :schema="schema" />
        <Field name="emenda_unitaria" type="text" class="inputtext light mb1"
          @change="!$event.target.value ? setValues({emenda:null}) : null" />
        <ErrorMessage class="error-msg mb1" name="emenda_unitaria" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="halfInput f1">
        <LabelFromYup name="demanda" :schema="schema" />
        <Field name="demanda" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="demanda" />
      </div>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">Origem</h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="orgao_concedente_id" :schema="schema" />
        <Field name="orgao_concedente_id" as="select" class="inputtext light mb1" :class="{
            error: errors.orgao_concedente_id,
            loading: ÓrgãosStore.chamadasPendentes?.lista,
          }" :disabled="!órgãosComoLista?.length">
          <option :value="0">
            Selecionar
          </option>
          <option v-for="item in órgãosComoLista" :key="item" :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null">
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>
        <ErrorMessage name="orgao_concedente_id" class="error-msg" />
      </div>
      <div class="f1">
        <LabelFromYup name="secretaria_concedente_id" :schema="schema" />
        <Field name="secretaria_concedente_id" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="secretaria_concedente_id" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup name="parlamentar_id" :schema="schema" />
        <Field name="parlamentar_id" as="select" class="inputtext light mb1" :class="{
            error: errors.parlamentar_id,
            loading: ParlamentaresStore.chamadasPendentes?.lista,
          }" :disabled="!parlamentarComoLista?.length">
          <option :value="0">
            Selecionar
          </option>

          <option v-for="item in parlamentarComoLista" :key="item" :value="item.id">
            {{ item.nome }} - {{ item.nome_popular }}
          </option>
        </Field>
        <ErrorMessage name="parlamentar_id" class="error-msg" />
      </div>

      <div class="f1">
        <LabelFromYup name="numero_identificacao" :schema="schema" />
        <Field name="numero_identificacao" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="numero_identificacao" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup name="partido_id" :schema="schema" />
        <Field name="partido_id" as="select" class="inputtext light mb1" :class="{
            error: errors.partido_id,
            loading: ParlamentaresStore.chamadasPendentes?.lista,
          }" :disabled="!partidoComoLista?.length">
          <option :value="0">
            Selecionar
          </option>

          <option v-for="item in partidoComoLista" :key="item" :value="item.id">
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage name="partido_id" class="error-msg" />
      </div>
      <div class="f1">
        <label class="label">Cargo<span class="tvermelho">*</span></label>
        <Field name="cargo" as="select" class="inputtext light mb1" :class="{ 'error': errors.cargo }">
          <option value="">
            Selecionar
          </option>
          <option value="Senador">
            Senador
          </option>
          <option value="DeputadoEstadual">
            Deputado Estadual
          </option>
          <option value="DeputadoFederal">
            Deputado Federal
          </option>
          <option value="Vereador">
            Vereador
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.cargo }}
        </div>
      </div>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">Transferência</h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="ano" :schema="schema" />
        <Field name="ano" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="ano" />
      </div>

      <div class="f1">
        <LabelFromYup name="nome_programa" :schema="schema" />
        <Field name="nome_programa" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="nome_programa" />
      </div>
    </div>

    <div class="f1 mb2">
      <LabelFromYup name="objeto" :schema="schema" />
      <Field name="objeto" as="textarea" class="inputtext light mb1" rows="5" />
      <ErrorMessage class="error-msg mb1" name="objeto" />
    </div>

    <div class="f1 mb2">
      <LabelFromYup name="detalhamento" :schema="schema" />
      <Field name="detalhamento" as="textarea" class="inputtext light mb1" rows="5" />
      <ErrorMessage class="error-msg mb1" name="detalhamento" />
    </div>

    <div class="flex g1 end mb1">
      <div class="f1">
        <label class="label">Crítico <span class="tvermelho">*</span></label>
        <Field name="critico" as="select" class="inputtext light mb1" :class="{ 'error': errors.critico }">
          <option :value="true">
            Sim
          </option>
          <option :value="false">
            Não
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.critico }}
        </div>
      </div>
      <div class="f1">
        <label class="label">Cláusula suspensiva <span class="tvermelho">*</span></label>
        <Field name="clausula_suspensiva" as="select" class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva }">
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
      <div class="f1">
        <LabelFromYup name="clausula_suspensiva_vencimento" :schema="schema" />
        <Field name="clausula_suspensiva_vencimento" type="date" class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva_vencimento }" maxlength="10" @update:model-value="values.clausula_suspensiva_vencimento === ''
            ? values.clausula_suspensiva_vencimento = null
            : null" />
        <ErrorMessage name="clausula_suspensiva_vencimento" class="error-msg" />
      </div>
    </div>

    <div class="f1 mb2">
      <LabelFromYup name="normativa" :schema="schema" />
      <Field name="normativa" type="text" class="inputtext light mb1" placeholder="Lei, IN, Portaria" />
      <ErrorMessage class="error-msg mb1" name="normativa" />
    </div>

    <div class="f1">
      <LabelFromYup name="observacoes" :schema="schema" />
      <Field name="observacoes" as="textarea" class="inputtext light mb1" rows="5" />
      <ErrorMessage class="error-msg mb1" name="observacoes" />
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button class="btn big" :disabled="isSubmitting || Object.keys(errors)?.length" :title="Object.keys(errors)?.length
      ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
      : null">
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span v-if="chamadasPendentes?.emFoco" class="spinner">Carregando</span>

  <div v-if="erro" class="error p1">
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

