<script setup>
import { default as AutocompleteField } from '@/components/AutocompleteField.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { meta as metaSchema } from '@/consts/formSchemas';
import truncate from '@/helpers/truncate';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useMacrotemasStore } from '@/stores/macrotemas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useSubtemasStore } from '@/stores/subtemas.store';
import { useTagsStore } from '@/stores/tags.store';
import { useTemasStore } from '@/stores/temas.store';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import {
  computed, defineOptions, ref, unref,
} from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const alertStore = useAlertStore();
const route = useRoute();
const { meta_id } = route.params;
const oktogo = ref(0);

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.clear();

const orgaos_participantes = ref([
  {
    orgao_id: null, responsavel: true, participantes: [], busca: '',
  },
  {
    orgao_id: null, responsavel: false, participantes: [], busca: '',
  },
]);
const coordenadores_cp = ref({ participantes: [], busca: '' });
const m_tags = ref({ participantes: [], busca: '' });

const virtualParent = ref({
  macro_tema_id: route.params.macro_tema_id,
  sub_tema_id: route.params.sub_tema_id,
  tema_id: route.params.tema_id,
});
let title = 'Cadastro de Meta';
if (meta_id) {
  title = 'Editar Meta';
}

const MacrotemaStore = useMacrotemasStore();
const { tempMacrotemas } = storeToRefs(MacrotemaStore);

const TemaStore = useTemasStore();
const { tempTemas } = storeToRefs(TemaStore);

const SubtemaStore = useSubtemasStore();
const { tempSubtemas } = storeToRefs(SubtemaStore);

const TagsStore = useTagsStore();
const { tempTags } = storeToRefs(TagsStore);

const OrgansStore = useOrgansStore();

const UserStore = useUsersStore();
const { pessoasSimplificadas } = storeToRefs(UserStore);

(async () => {
  if (meta_id) await MetasStore.getById(meta_id);
  await MetasStore.getPdM();

  const promessas = [
    MacrotemaStore.filterByPdm(activePdm.value.id),
    TemaStore.filterByPdm(activePdm.value.id),
    SubtemaStore.filterByPdm(activePdm.value.id),
    TagsStore.filterByPdm(activePdm.value.id),
    OrgansStore.getAllOrganResponsibles(),
    UserStore.buscarPessoasSimplificadas({ coordenador_responsavel_cp: true }),
  ];

  await Promise.allSettled(promessas);

  if (singleMeta.value.id) {
    if (singleMeta.value?.tema?.id) singleMeta.value.tema_id = singleMeta.value.tema.id;
    if (singleMeta.value?.macro_tema?.id) {
      singleMeta.value.macro_tema_id = singleMeta.value.macro_tema.id;
    }
    if (singleMeta.value?.sub_tema?.id) singleMeta.value.sub_tema_id = singleMeta.value.sub_tema.id;

    if (singleMeta.value.orgaos_participantes) {
      orgaos_participantes.value.splice(0, orgaos_participantes.value.length);
      singleMeta.value.orgaos_participantes.forEach((x) => {
        const z = {};
        z.orgao_id = x.orgao.id;
        z.busca = '';
        z.responsavel = x.responsavel;
        z.participantes = x.participantes.map((y) => y?.id ?? y);
        orgaos_participantes.value.push(z);
      });
    }
    if (singleMeta.value.coordenadores_cp) {
      coordenadores_cp.value.participantes = singleMeta.value.coordenadores_cp.map((x) => x.id);
    }
    if (singleMeta.value.tags) {
      m_tags.value.participantes = singleMeta.value.tags.map((x) => x?.id ?? x);
    }
  }

  oktogo.value = true;
})();

const schema = computed(() => metaSchema(activePdm.value));

async function onSubmit(values) {
  try {
    const er = [];
    values.orgaos_participantes = unref(orgaos_participantes);
    values.orgaos_participantes = values.orgaos_participantes.filter((x) => {
      if (x.orgao_id && !x.participantes.length) er.push('Selecione pelo menos um responsável para o órgão.');
      return x.orgao_id;
    });

    values.coordenadores_cp = coordenadores_cp.value.participantes;
    if (!values.coordenadores_cp.length) er.push('Selecione pelo menos um responsável para a coordenadoria.');

    values.tags = m_tags.value.participantes.length
      ? m_tags.value.participantes
      : null;

    if (!values.pdm_id) values.pdm_id = activePdm.value.id;

    if (activePdm.value.possui_macro_tema && !values.macro_tema_id) er.push(`Selecione um(a) ${activePdm.value.rotulo_macro_tema}.`);
    if (activePdm.value.possui_tema && !values.tema_id) er.push(`Selecione um(a) ${activePdm.value.rotulo_tema}.`);
    if (activePdm.value.possui_sub_tema && !values.sub_tema_id) er.push(`Selecione um(a) ${activePdm.value.rotulo_sub_tema}.`);

    if (er.length) throw er.join('<br />');
    let msg;
    let r;
    if (meta_id && singleMeta.value.id) {
      r = await MetasStore.update(singleMeta.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await MetasStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      MetasStore.clear();
      await router.push('/metas');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkDelete(id) {
  if (id) {
    if (singleMeta.value.id) {
      alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
        if (await MetasStore.delete(id)) {
          MetasStore.clear();
          await router.push('/metas');
          alertStore.success('Meta removida.');
        }
      }, 'Remover');
    }
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/metas');
}
function addOrgao(obj, r) {
  obj.push({
    orgao_id: null, responsavel: r ?? false, participantes: [], busca: '',
  });
}
function removeOrgao(obj, i) {
  obj.splice(i, 1);
}

function filterResponsible(orgao_id) {
  const r = OrgansStore.organResponsibles;
  const v = r.length ? r.find((x) => x.id == orgao_id) : false;
  return v?.responsible ?? [];
}
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <h1>{{ title }}</h1>
    <hr class="ml2 f1">
    <button
      class="btn round ml2"
      @click="checkClose"
    >
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <template v-if="oktogo && !(singleMeta?.loading || singleMeta?.error)">
    <Form
      v-slot="{ errors, isSubmitting, values }"
      :validation-schema="schema"
      :initial-values="meta_id ? singleMeta : virtualParent"
      @submit="onSubmit"
    >
      <div class="flex g2">
        <div class="f1">
          <label class="label">Programa de Metas <span class="tvermelho">*</span></label>
          <input
            type="text"
            class="inputtext light mb1"
            :value="activePdm.nome"
            disabled
          >
        </div>
        <div
          v-if="activePdm.possui_macro_tema && tempMacrotemas.length"
          class="f1"
        >
          <label class="label">
            {{ activePdm.rotulo_macro_tema }} <span class="tvermelho">*</span>
          </label>
          <Field
            name="macro_tema_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.macro_tema_id }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in tempMacrotemas"
              :key="item.id"
              :value="item.id"
              :selected="values.macro_tema_id && item.id == values.macro_tema_id"
            >
              {{ item['descricao'] }}
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.macro_tema_id }}
          </div>
        </div>
      </div>
      <div class="flex g2">
        <div
          v-if="activePdm.possui_tema && tempTemas.length"
          class="f1"
        >
          <label class="label">
            {{ activePdm.rotulo_tema }} <span class="tvermelho">*</span>
          </label>
          <Field
            name="tema_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.tema_id }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in tempTemas"
              :key="item.id"
              :value="item.id"
              :selected="values.tema_id && item.id == values.tema_id"
            >
              {{ item.descricao }}
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.tema_id }}
          </div>
        </div>
        <div
          v-if="activePdm.possui_sub_tema && tempSubtemas.length"
          class="f1"
        >
          <label class="label">
            {{ activePdm.rotulo_sub_tema }} <span class="tvermelho">*</span>
          </label>
          <Field
            name="sub_tema_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.sub_tema_id }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in tempSubtemas"
              :key="item.id"
              :value="item.id"
              :selected="values.sub_tema_id && item.id == values.sub_tema_id"
            >
              {{ item.descricao }}
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.sub_tema_id }}
          </div>
        </div>
      </div>

      <div v-if="tempTags.length">
        <label class="label">Tags</label>
        <AutocompleteField
          :controlador="m_tags"
          :grupo="tempTags"
          label="descricao"
        />
      </div>

      <hr class="mt2 mb2">
      <div class="flex g2">
        <div
          class="f0"
          style="flex-basis: 100px;"
        >
          <label class="label">Código <span class="tvermelho">*</span></label>
          <Field
            name="codigo"
            type="text"
            class="inputtext light mb1"
            maxlength="30"
            :class="{ 'error': errors.codigo }"
          />
          <div class="error-msg">
            {{ errors.codigo }}
          </div>
        </div>
        <div class="f2">
          <label class="label">Título <span class="tvermelho">*</span></label>
          <Field
            name="titulo"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.titulo }"
          />
          <div class="error-msg">
            {{ errors.titulo }}
          </div>
        </div>
      </div>
      <div
        v-if="activePdm.possui_contexto_meta"
        class="flex g2"
      >
        <div class="f1">
          <label class="label">
            {{ activePdm.rotulo_contexto_meta }} <span class="tvermelho">*</span>
          </label>
          <Field
            name="contexto"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.contexto }"
          />
          <div class="error-msg">
            {{ errors.contexto }}
          </div>
        </div>
      </div>
      <div
        v-if="activePdm.possui_complementacao_meta"
        class="flex g2"
      >
        <div class="f1">
          <label class="label">{{ activePdm.rotulo_complementacao_meta }}</label>
          <Field
            name="complemento"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.complemento }"
          />
          <div class="error-msg">
            {{ errors.complemento }}
          </div>
        </div>
      </div>

      <hr class="mt2 mb2">

      <label class="label">Órgãos responsáveis <span class="tvermelho">*</span></label>
      <div class="flex center g2">
        <label class="f1 label tc300">Órgão <span class="tvermelho">*</span></label>
        <label class="f1 label tc300">Responsável <span class="tvermelho">*</span></label>
        <div style="flex-basis: 30px;" />
      </div>
      <template
        v-for="(item, index) in orgaos_participantes"
        :key="index"
      >
        <div
          v-if="item.responsavel"
          class="flex mb1 g2"
        >
          <div class="f1">
            <select
              v-if="OrgansStore.organResponsibles.length"
              v-model="item.orgao_id"
              class="inputtext light"
              @change="item.participantes = []"
            >
              <option
                v-for="(o, k) in OrgansStore.organResponsibles.filter(a => a.id == item.orgao_id
                  || !orgaos_participantes.map(b => b.orgao_id).includes(a.id))"
                :key="k"
                :value="o.id"
                :title="o.descricao?.length > 36 ? o.descricao : null"
              >
                {{ o.sigla }} - {{ truncate(o.descricao, 36) }}
              </option>
            </select>
          </div>
          <div class="f1">
            <AutocompleteField
              :controlador="item"
              :grupo="filterResponsible(item.orgao_id)"
              label="nome_exibicao"
            />
          </div>
          <div style="flex-basis: 30px;">
            <a
              class="addlink mt1"
              @click="removeOrgao(orgaos_participantes, index)"
            ><svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg></a>
          </div>
        </div>
      </template>
      <a
        class="addlink"
        @click="addOrgao(orgaos_participantes, true)"
      ><svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg> <span>Adicionar orgão responsável</span></a>

      <hr class="mt2 mb2">

      <label class="label">Órgãos participantes</label>
      <div class="flex center g2">
        <label class="f1 label tc300">Órgão</label>
        <label class="f1 label tc300">Responsável</label>
        <div style="flex-basis: 30px;" />
      </div>
      <template
        v-for="(item, index) in orgaos_participantes"
        :key="index"
      >
        <div
          v-if="!item.responsavel"
          class="flex mb1 g2"
        >
          <div class="f1">
            <select
              v-if="OrgansStore.organResponsibles.length"
              v-model="item.orgao_id"
              class="inputtext light"
              @change="item.participantes = []"
            >
              <option
                v-for="o in OrgansStore.organResponsibles.filter(a => a.id == item.orgao_id || !orgaos_participantes.map(b => b.orgao_id).includes(a.id))"
                :key="o.id"
                :value="o.id"
                :title="o.descricao?.length > 36 ? o.descricao : null"
              >
                {{ o.sigla }} - {{ truncate(o.descricao, 36) }}
              </option>
            </select>
          </div>
          <div class="f1">
            <AutocompleteField
              :controlador="item"
              :grupo="filterResponsible(item.orgao_id)"
              label="nome_exibicao"
            />
          </div>
          <div style="flex-basis: 30px;">
            <a
              class="addlink mt1"
              @click="removeOrgao(orgaos_participantes, index)"
            ><svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg></a>
          </div>
        </div>
      </template>
      <a
        class="addlink"
        @click="addOrgao(orgaos_participantes, false)"
      ><svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg> <span>Adicionar orgão participante</span></a>

      <hr class="mt2 mb2">

      <label class="label">
        Responsável na coordenadoria de planejamento
        <span class="tvermelho">*</span>
      </label>
      <div class="flex">
        <div
          v-if="pessoasSimplificadas.length"
          class="f1"
        >
          <AutocompleteField
            :controlador="coordenadores_cp"
            :grupo="pessoasSimplificadas"
            label="nome_exibicao"
          />
        </div>
      </div>

      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>

  <template v-if="singleMeta?.loading || !oktogo">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="singleMeta?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ singleMeta.error }}
      </div>
    </div>
  </template>

  <template v-if="meta_id && singleMeta.id && meta_id == singleMeta.id">
    <hr class="mt2 mb2">
    <button
      class="btn amarelo big"
      @click="checkDelete(singleMeta.id)"
    >
      Remover item
    </button>
  </template>
</template>
