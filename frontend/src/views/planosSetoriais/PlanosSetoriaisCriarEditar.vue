<script setup>
import { planoSetorial as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

const alertStore = useAlertStore();

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const planosSetoriaisStore = usePlanosSetoriaisStore();
const {
  chamadasPendentes, erros, itemParaEdição, emFoco,
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

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const cargaManipulada = nulificadorTotal(valoresControlados);

  const msg = props.planoSetorialId
    ? `Plano "${cargaManipulada.nome}" salvos com sucesso!`
    : `Plano "${cargaManipulada.nome}" adicionado com sucesso!`;
  const resposta = await planosSetoriaisStore.salvarItem(cargaManipulada, props.planoSetorialId);

  try {
    if (resposta) {
      const rotaApósSalvamento = props.planoSetorialId
        ? {
          name: 'planosSetoriaisListar',
          params: { planoSetorialId: resposta.id },
        }
        : {
          name: 'planosSetoriaisEditar',
          params: { planoSetorialId: resposta.id },
        };

      if (resposta.id) {
        planosSetoriaisStore.buscarItem(props.planoSetorialId || resposta.id);
      }

      alertStore.success(msg);
      emFoco.value = null;

      router.push(rotaApósSalvamento);
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const formulárioSujo = useIsFormDirty();

watch(itemParaEdição, (novoValor) => {
  resetForm({
    initialValues: novoValor,
  });
});
</script>
<template>
  <header class="flex flexwrap spacebetween center mb2 g2">
    <TítuloDePágina />

    <hr class="f1">

    <CheckClose :formulário-sujo="formulárioSujo" />
  </header>

  <form
    :aria-busy="chamadasPendentes.emFoco && !emFoco"
    @submit="onSubmit"
  >
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
            <template v-if="values.ativo">ativo</template>
            <template v-else>inativo</template>
          </LabelFromYup>
        </label>
        <p class="t13 tc500">
          Ao ativar um Programa de Metas, todos os demais programas serão inativados
        </p>
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
          maxlength="250"
        />
        <ErrorMessage name="descricao" />
      </div>
    </div>
    <!--
<div class="mt2">
  <label class="label tc300">Logo do Programa de Metas</label>

  <label
    v-if="!curfile?.loading && !curfile?.name"
    class="addlink"
  ><svg
     width="20"
     height="20"
   ><use xlink:href="#i_+" /></svg>
    <span>
      Adicionar arquivo (formatos SVG ou PNG até 2mb)&nbsp;<span class="tvermelho">*</span>
    </span>
    <input
      type="file"
      accept=".svg,.png"
      :onchange="uploadshape"
      style="display:none;"
    ></label>

  <div
    v-else-if="curfile?.loading"
    class="addlink"
  >
    <span>Carregando</span> <svg
      width="20"
      height="20"
    ><use xlink:href="#i_spin" /></svg>
  </div>

  <div v-else-if="curfile?.name">
    <img
      v-if="singlePdm.logo == curfile?.name"
      :src="`${baseUrl}/download/${singlePdm.logo}?inline=true`"
      width="100"
      class="ib mr1"
    >
    <span v-else>{{ curfile?.name?.slice(0, 30) }}</span>
    <a
      :onclick="removeshape"
      class="addlink"
    ><svg
      width="20"
      height="20"
    ><use xlink:href="#i_remove" /></svg></a>
  </div>
  <Field
    name="upload_logo"
    type="hidden"
    :value="curfile?.name"
  />
</div>
-->

    <hr class="mt2 mb2">

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
        <ErrorMessage name="data_inicio" />
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

    <hr class="mt2 mb2">

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

    <hr class="mt2 mb2">

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
    <ErrorMessage name="possui_atividade" />
    <hr class="mt2 mb2">

    <div class="flex flexwrap center g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="nivel_orcamento"
          :schema="schema"
        />
        <Field
          name="nivel_orcamento"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.nivel_orcamento }"
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
