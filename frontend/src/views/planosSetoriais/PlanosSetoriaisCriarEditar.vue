<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDeArquivo from '@/components/CampoDeArquivo.vue';
import CampoDeEquipesComBuscaPorOrgao from '@/components/CampoDeEquipesComBuscaPorOrgao.vue';
import { planoSetorial as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import truncate from '@/helpers/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const equipesStore = useEquipesStore();
const {
  equipesPorOrgaoIdPorPerfil,
  chamadasPendentes: chamadasPendentesDeEquipes,
} = storeToRefs(equipesStore);

const ÓrgãosStore = useOrgansStore();
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);

const planosSetoriaisStore = usePlanosSetoriaisStore();
const {
  chamadasPendentes,
  emFoco,
  erros,
  itemParaEdicao,
  lista,
} = storeToRefs(planosSetoriaisStore);

const props = defineProps({
  planoSetorialId: {
    type: [
      Number,
    ],
    default: 0,
  },
});

const router = useRouter();
const route = useRoute();

// necessário por causa de 🤬
const montarCampoEstático = ref(false);

const {
  errors, handleSubmit, isSubmitting, resetForm, resetField, setFieldValue, values: carga,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const cargaManipulada = nulificadorTotal(valoresControlados);

  const msg = props.planoSetorialId
    ? `Plano "${cargaManipulada.nome}" salvo!`
    : `Plano "${cargaManipulada.nome}" adicionado!`;
  const resposta = await planosSetoriaisStore.salvarItem(cargaManipulada, props.planoSetorialId);

  try {
    if (resposta) {
      if (props.planoSetorialId) {
        planosSetoriaisStore.buscarItem(props.planoSetorialId || resposta.id);
      }

      alertStore.success(msg);

      if (route.meta.rotaDeEscape) {
        router.push({
          name: 'planosSetoriaisResumo',
          params: { planoSetorialId: resposta.id },
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const formularioSujo = useIsFormDirty();

async function iniciar() {
  const requisições = [
    ÓrgãosStore.getAll(),
    equipesStore.buscarTudo(),
  ];

  await Promise.allSettled(requisições);

  planosSetoriaisStore.buscarTudo();
  montarCampoEstático.value = true;
}

iniciar();

watch(itemParaEdicao, (novoValor) => {
  montarCampoEstático.value = false;
  resetForm({
    initialValues: novoValor,
  });
  montarCampoEstático.value = true;
});
</script>
<template>
  <header class="flex flexwrap spacebetween center mb2 g2">
    <TítuloDePágina />

    <hr class="f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

  <form
    :aria-busy="chamadasPendentes.emFoco && !emFoco"
    @submit="onSubmit"
  >
    <fieldset>
      <div
        v-if="planoSetorialId && temPermissãoPara([
          'CadastroPS.administrador',
          'CadastroPS.administrador_no_orgao',
        ])"
        class="flex flexwrap g2 mb1"
      >
        <div class="f1">
          <label class="block mb1">
            <Field
              name="ativo"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              class="mr1"
            />
            <LabelFromYup
              name="ativo"
              as="span"
              :schema="schema"
            >
              <template v-if="carga.ativo">ativo</template>
              <template v-else>inativo</template>
            </LabelFromYup>
          </label>
        </div>
      </div>
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="nome"
            :schema="schema"
          />
          <Field
            name="nome"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.nome }"
          />
          <ErrorMessage name="nome" />
        </div>
      </div>
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="descricao"
            :schema="schema"
          />
          <Field
            name="descricao"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.descricao }"
            maxlength="2500"
          />
          <ErrorMessage name="descricao" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb10em">
          <LabelFromYup
            name="upload_logo"
            :schema="schema"
            for="logo"
          />
          <CampoDeArquivo
            id="logo"
            v-model="carga.upload_logo"
            accept=".svg,.png"
            name="upload_logo"
            tipo="LOGO_PDM"
          >
            Adicionar arquivo (formatos SVG ou PNG até 2mb)
          </CampoDeArquivo>
          <ErrorMessage name="upload_logo" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb10em">
          <LabelFromYup
            name="data_inicio"
            :schema="schema"
          />
          <Field
            name="data_inicio"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.data_inicio }"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('data_inicio', $v || null); }"
          />
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="data_fim"
            :schema="schema"
          />
          <Field
            name="data_fim"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.data_fim }"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('data_fim', $v || null); }"
          />
          <ErrorMessage name="data_fim" />
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="data_publicacao"
            :schema="schema"
          />
          <Field
            name="data_publicacao"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.data_publicacao }"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('data_publicacao', $v || null); }"
          />
          <ErrorMessage name="data_publicacao" />
        </div>
      </div>
      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb10em">
          <LabelFromYup
            name="periodo_do_ciclo_participativo_inicio"
            :schema="schema"
          />
          <Field
            name="periodo_do_ciclo_participativo_inicio"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.periodo_do_ciclo_participativo_inicio }"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('periodo_do_ciclo_participativo_inicio', $v || null); }"
          />
          <ErrorMessage name="periodo_do_ciclo_participativo_inicio" />
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="periodo_do_ciclo_participativo_fim"
            :schema="schema"
          />
          <Field
            name="periodo_do_ciclo_participativo_fim"
            type="date"
            class="inputtext light mb1"
            :class="{ 'error': errors.periodo_do_ciclo_participativo_fim }"
            @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
            @update:model-value="($v) => { setFieldValue('periodo_do_ciclo_participativo_fim', $v || null); }"
          />
          <ErrorMessage name="periodo_do_ciclo_participativo_fim" />
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="prefeito"
            :schema="schema"
          />
          <Field
            name="prefeito"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.prefeito }"
          />
          <ErrorMessage name="prefeito" />
        </div>
      </div>
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="equipe_tecnica"
            :schema="schema"
          />
          <Field
            name="equipe_tecnica"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.equipe_tecnica }"
          />
          <p class="t13 tc500">
            Separe os membros por vírgula ou ponto-e-vírgula
          </p>
          <ErrorMessage name="equipe_tecnica" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="possui_macro_tema"
              class="inputcheckbox"
              :class="{ 'error': errors.possui_macro_tema }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <LabelFromYup
              name="possui_macro_tema"
              as="span"
              :schema="schema"
            />
          </label>
        </div>
        <div class="f1 fb15em">
          <LabelFromYup
            name="rotulo_macro_tema"
            :schema="schema"
          />
          <Field
            name="rotulo_macro_tema"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.rotulo_macro_tema }"
            :disabled="!carga.possui_macro_tema"
          />
          <ErrorMessage name="rotulo_macro_tema" />
        </div>
      </div>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="possui_tema"
              class="inputcheckbox"
              :class="{ 'error': errors.possui_tema }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <LabelFromYup
              name="possui_tema"
              as="span"
              :schema="schema"
            />
          </label>
        </div>
        <div class="f1 fb15em">
          <LabelFromYup
            name="rotulo_tema"
            :schema="schema"
          />
          <Field
            name="rotulo_tema"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.rotulo_tema }"
            :disabled="!carga.possui_tema"
          />
          <ErrorMessage name="rotulo_tema" />
        </div>
      </div>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="possui_sub_tema"
              class="inputcheckbox"
              :class="{ 'error': errors.possui_sub_tema }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <LabelFromYup
              name="possui_sub_tema"
              as="span"
              :schema="schema"
            />
          </label>
        </div>
        <div class="f1 fb15em">
          <LabelFromYup
            name="rotulo_sub_tema"
            :schema="schema"
          />
          <Field
            name="rotulo_sub_tema"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.rotulo_sub_tema }"
            :disabled="!carga.possui_sub_tema"
          />
          <ErrorMessage name="rotulo_sub_tema" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="possui_contexto_meta"
              class="inputcheckbox"
              :class="{ 'error': errors.possui_contexto_meta }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <LabelFromYup
              name="possui_contexto_meta"
              as="span"
              :schema="schema"
            />
          </label>
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="rotulo_contexto_meta"
            :schema="schema"
          />
          <Field
            name="rotulo_contexto_meta"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.rotulo_contexto_meta }"
            :disabled="!carga.possui_contexto_meta"
          />
          <ErrorMessage name="rotulo_contexto_meta" />
        </div>
      </div>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="possui_complementacao_meta"
              class="inputcheckbox"
              :class="{ 'error': errors.possui_complementacao_meta }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <LabelFromYup
              name="possui_complementacao_meta"
              as="span"
              :schema="schema"
            />
          </label>
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="rotulo_complementacao_meta"
            :schema="schema"
          />
          <Field
            name="rotulo_complementacao_meta"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.rotulo_complementacao_meta }"
            :disabled="!carga.possui_complementacao_meta"
          />
          <ErrorMessage name="rotulo_complementacao_meta" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="possui_iniciativa"
              class="inputcheckbox"
              :class="{ 'error': errors.possui_iniciativa }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <LabelFromYup
              name="possui_iniciativa"
              as="span"
              :schema="schema"
            />
          </label>
          <ErrorMessage name="possui_iniciativa" />
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="rotulo_iniciativa"
            :schema="schema"
          />
          <Field
            name="rotulo_iniciativa"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.rotulo_iniciativa }"
            :disabled="!carga.possui_iniciativa"
          />
          <ErrorMessage name="rotulo_iniciativa" />
        </div>
      </div>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="possui_atividade"
              class="inputcheckbox"
              :class="{ 'error': errors.possui_atividade }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              :disabled="!carga.possui_iniciativa"
            />
            <LabelFromYup
              name="possui_atividade"
              as="span"
              :schema="schema"
            />
          </label>
          <ErrorMessage name="possui_atividade" />
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="rotulo_atividade"
            :schema="schema"
          />
          <Field
            name="rotulo_atividade"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.rotulo_atividade }"
            :disabled="!carga.possui_iniciativa || !carga.possui_atividade"
          />
          <ErrorMessage name="rotulo_atividade" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap center g2 mb1">
        <div
          class="f0 fb15em"
        >
          <label class="block mb1">
            <Field
              name="monitoramento_orcamento"
              class="inputcheckbox"
              :class="{ 'error': errors.monitoramento_orcamento }"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              @change="resetField('nivel_orcamento', {
                value: carga.monitoramento_orcamento
                  ? emFoco.nivel_orcamento
                  : null
              })"
            />
            <LabelFromYup
              name="monitoramento_orcamento"
              as="span"
              :schema="schema"
            />
          </label>
          <ErrorMessage name="monitoramento_orcamento" />
        </div>
        <div class="f1 fb10em">
          <LabelFromYup
            name="nivel_orcamento"
            :schema="schema"
          />
          <Field
            name="nivel_orcamento"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.nivel_orcamento }"
            :disabled="!carga.monitoramento_orcamento"
          >
            <option value="Meta">
              Meta
            </option>
            <option value="Iniciativa">
              Iniciativa
            </option>
            <option value="Atividade">
              Atividade
            </option>
          </Field>
          <ErrorMessage name="nivel_orcamento" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <LabelFromYup
        :schema="schema"
        as="legend"
      >
        Administradores
      </LabelFromYup>

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="orgao_admin_id"
            :schema="schema"
          />
          <Field
            name="orgao_admin_id"
            as="select"
            class="inputtext light mb1"
            :class="{
              error: errors.orgao_admin_id,
            }"
            :disabled="!órgãosComoLista?.length"
            :aria-busy="chamadasPendentesDeEquipes.lista"
          >
            <option :value="0">
              Selecionar
            </option>
            <option
              v-for="item in órgãosComoLista"
              :key="item"
              :value="item.id"
              :disabled="!equipesPorOrgaoIdPorPerfil[item.id]?.AdminPS?.length"
              :title="item.descricao?.length > 36 ? item.descricao : null"
            >
              {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
            </option>
          </Field>
          <ErrorMessage
            name="orgao_admin_id"
          />
        </div>

        <div class="f2">
          <LabelFromYup
            name="ps_admin_cp.equipes"
            :schema="schema"
          />
          <AutocompleteField
            name="ps_admin_cp.equipes"
            :controlador="{
              busca: '',
              participantes: carga.ps_admin_cp?.equipes || []
            }"
            :grupo="equipesPorOrgaoIdPorPerfil[carga.orgao_admin_id]?.AdminPS || []"
            :aria-busy="chamadasPendentesDeEquipes.lista"
            :class="{
              error: errors['ps_admin_cp.equipes'],
            }"
            label="titulo"
          />
          <ErrorMessage
            name="ps_admin_cp.equipes"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <LabelFromYup
        name="ps_tecnico_cp.equipes"
        :schema="schema"
        as="legend"
      />
      <div
        class="flex flexwrap g2 mb1"
      >
        <div class="f1 mb1">
          <CampoDeEquipesComBuscaPorOrgao
            v-model="carga.ps_tecnico_cp.equipes"
            :valores-iniciais="emFoco?.ps_tecnico_cp?.equipes"
            name="ps_tecnico_cp.equipes"
            perfis-permitidos="TecnicoPS"
          />
          <ErrorMessage
            name="ps_tecnico_cp.equipes"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <LabelFromYup
        name="ps_ponto_focal.equipes"
        :schema="schema"
        as="legend"
      />

      <div
        class="flex flexwrap g2 mb1"
      >
        <div class="f1 mb1">
          <CampoDeEquipesComBuscaPorOrgao
            v-model="carga.ps_ponto_focal.equipes"
            :valores-iniciais="emFoco?.ps_ponto_focal?.equipes"
            name="ps_ponto_focal.equipes"
            perfis-permitidos="PontoFocalPS"
          />
          <ErrorMessage
            name="ps_ponto_focal.equipes"
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="legislacao_de_instituicao"
            :schema="schema"
          />
          <Field
            name="legislacao_de_instituicao"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.legislacao_de_instituicao }"
            maxlength="250"
          />
          <ErrorMessage name="legislacao_de_instituicao" />
        </div>
      </div>

      <div
        class="flex flexwrap g2 mb1"
      >
        <div class="f2 mb1">
          <LabelFromYup
            name="pdm_anteriores"
            :schema="schema"
          />
          <AutocompleteField
            name="pdm_anteriores"
            :controlador="{
              busca: '',
              participantes: carga.pdm_anteriores || []
            }"
            :grupo="lista || []"
            :class="{
              error: errors.pdm_anteriores,
            }"
            label="nome"
          />
          <ErrorMessage
            name="pdm_anteriores"
            class="error-msg"
          />
        </div>
      </div>
    </fieldset>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :aria-busy="chamadasPendentes.emFoco"
        :disabled="isSubmitting"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <ErrorComponent
    v-if="erros.emFoco"
    class="mb1"
  >
    {{ erros.emFoco }}
  </ErrorComponent>
</template>
