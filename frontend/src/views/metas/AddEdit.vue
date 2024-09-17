<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDeTagsComBuscaPorCategoria from '@/components/CampoDeTagsComBuscaPorCategoria.vue';
import CampoDeEquipesComBuscaPorOrgao from '@/components/CampoDeEquipesComBuscaPorOrgao.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { meta as metaSchema } from '@/consts/formSchemas';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useMacrotemasStore } from '@/stores/macrotemas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useSubtemasStore } from '@/stores/subtemas.store';
import { useTagsStore } from '@/stores/tags.store';
import { useTemasStore } from '@/stores/temas.store';
import { useUsersStore } from '@/stores/users.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import {
  computed,
  defineOptions,
  ref,
  watch,
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

const EquipesStore = useEquipesStore();
const { lista } = storeToRefs(EquipesStore);

function pegaPsTecnicoCpCompleto(idsDasEquipes) {
  const listaDeEquipes = lista.value;

  return listaDeEquipes.filter((equipe) => idsDasEquipes.includes(equipe.id));
}

(async () => {
  if (meta_id) await MetasStore.getById(meta_id);
  await MetasStore.getPdM();

  const promessas = [
    OrgansStore.getAllOrganResponsibles(),
    UserStore.buscarPessoasSimplificadas({ coordenador_responsavel_cp: true }),
    EquipesStore.buscarTudo(),
  ];

  await Promise.allSettled(promessas);

  if (singleMeta.value.id) {
    if (singleMeta.value.orgaos_participantes) {
      orgaos_participantes.value.splice(0);
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
  }

  oktogo.value = true;
})();

const schema = computed(() => metaSchema(activePdm.value));

const valoresIniciais = computed(() => ({
  ...singleMeta.value,

  macro_tema_id: singleMeta.value.macro_tema?.id || route.params.macro_tema_id,
  sub_tema_id: singleMeta.value.sub_tema?.id || route.params.sub_tema_id,
  tema_id: singleMeta.value.tema?.id || route.params.tema_id,

  tags: Array.isArray(singleMeta.value?.tags)
    ? singleMeta.value.tags.map((tag) => tag.id)
    : [],
}));

async function onSubmit(values) {
  try {
    const er = [];

    // remove orgaos_participantes pois a api gera sozinha esse valor agora
    values.orgaos_participantes = [];

    values.coordenadores_cp = coordenadores_cp.value.participantes;
    if (!values.coordenadores_cp.length) er.push('Selecione pelo menos um responsável para a coordenadoria.');

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

      if (route.meta.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      } else if (route.meta.entidadeMãe === 'pdm') {
        await router.push('/metas');
      } else {
        throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
      }
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

          if (route.meta.rotaDeEscape) {
            router.push({ name: route.meta.rotaDeEscape });
          } else if (route.meta.entidadeMãe === 'pdm') {
            await router.push('/metas');
          } else {
            throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
          }

          alertStore.success('Meta removida.');
        }
      }, 'Remover');
    }
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    alertStore.$reset();
    if (route.meta.rotaDeEscape) {
      router.push({
        name: route.meta.rotaDeEscape,
      });
    } else if (route.meta.entidadeMãe === 'pdm') {
      router.push({
        path: '/metas',
      });
    } else {
      throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
    }
  });
}

watch(() => activePdm.value.id, async (novoValor) => {
  if (novoValor) {
    // usando essa flag porque a montagem do formulário está síncrona.
    // PRA-FAZER: montar o formulário de forma assíncrona.
    oktogo.value = false;
    const promessas = [
      MacrotemaStore.filterByPdm(novoValor),
      TemaStore.filterByPdm(novoValor),
      SubtemaStore.filterByPdm(novoValor),
      TagsStore.filterByPdm(novoValor),
    ];

    await Promise.allSettled(promessas);
    oktogo.value = true;
  }
}, { immediate: true });
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <TítuloDePágina
      :ícone="activePdm?.logo"
    >
      {{ title }}
    </TítuloDePágina>
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
      :initial-values="valoresIniciais"
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
            :class="{ erro: errors.macro_tema_id }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in tempMacrotemas"
              :key="item.id"
              :value="item.id"
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
            :class="{ erro: errors.tema_id }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in tempTemas"
              :key="item.id"
              :value="item.id"
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
            :class="{ erro: errors.sub_tema_id }"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in tempSubtemas"
              :key="item.id"
              :value="item.id"
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
        <legend class="legend mb1">
          Tags
        </legend>
        <CampoDeTagsComBuscaPorCategoria
          v-model="values.tags"
          name="tags"
          :valores-iniciais="valoresIniciais.tags || []"
          :pdm-id="activePdm.id"
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
            :class="{ error: errors.codigo }"
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
            :class="{ erro: errors.titulo }"
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
            :class="{ erro: errors.contexto }"
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
            :class="{ erro: errors.complemento }"
          />
          <div class="error-msg">
            {{ errors.complemento }}
          </div>
        </div>
      </div>

      <hr class="mt2 mb2">

      <fieldset>
        <label class="label">Órgãos responsáveis <span class="tvermelho">*</span></label>
        <div
          class="flex flexwrap g2 mb1"
        >
          <div class="f1 mb1">
            <CampoDeEquipesComBuscaPorOrgao
              v-model="values.ps_ponto_focal.equipes"
              :equipes-ids="activePdm.ps_ponto_focal?.equipes || []"
              :valores-iniciais="valoresIniciais.ps_ponto_focal?.equipes"
              name="ps_ponto_focal.equipes"
              perfis-permitidos="PontoFocalPS"
            />
          </div>
        </div>
      </fieldset>

      <hr class="mt2 mb2">

      <label class="label">
        Equipes responsáveis na coordenadoria de planejamento
        <span class="tvermelho">*</span>
      </label>

      <div>
        <AutocompleteField
          name="values.ps_tecnico_cp.equipes"
          :controlador="{
            busca: '',
            participantes: values.ps_tecnico_cp.equipes,
          }"
          :grupo="pegaPsTecnicoCpCompleto(activePdm.ps_tecnico_cp.equipes)"
          label="titulo"
        />
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
