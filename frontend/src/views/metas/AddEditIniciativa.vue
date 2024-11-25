<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDeEquipesComBuscaPorOrgao from '@/components/CampoDeEquipesComBuscaPorOrgao.vue';
import SimplificadorDeOrigem from '@/helpers/simplificadorDeOrigem';
import CampoDePlanosMetasRelacionados from '@/components/CampoDePlanosMetasRelacionados.vue';
import CampoDeTagsComBuscaPorCategoria from '@/components/CampoDeTagsComBuscaPorCategoria.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import truncate from '@/helpers/truncate';
import { router } from '@/router';
import {
  useAlertStore, useIniciativasStore, useMetasStore, useTagsStore,
} from '@/stores';
import { useEquipesStore } from '@/stores/equipes.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import {
  computed, defineOptions, ref, unref,
} from 'vue';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';

defineOptions({
  inheritAttrs: false,
});

const alertStore = useAlertStore();
const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const oktogo = ref(0);

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
IniciativasStore.clearEdit();

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);

const orgaos_participantes = ref([
  {
    orgao_id: null, responsavel: true, participantes: [], busca: '',
  },
]);
const coordenadores_cp = ref({ participantes: [], busca: '' });
const m_tags = ref({ participantes: [], busca: '' });

const TagsStore = useTagsStore();
const { tempTags } = storeToRefs(TagsStore);

const EquipesStore = useEquipesStore();
EquipesStore.buscarTudo();

Promise.all([
  MetasStore.getPdM(),
]).then(() => {
  TagsStore.filterByPdm(activePdm.value.id);
  oktogo.value = true;
});

let title = 'Cadastro de';
const organsAvailable = ref([]);
const usersAvailable = ref({});
const coordsAvailable = ref([]);

const valoresIniciais = computed(() => ({
  ...singleIniciativa.value,

  origens_extra: Array.isArray(singleIniciativa.value?.origens_extra)
    ? singleIniciativa.value.origens_extra.map((origem) => SimplificadorDeOrigem(origem))
    : [],

  ps_ponto_focal: {
    equipes: singleIniciativa.value?.ps_ponto_focal?.equipes || [],
  },

  tags: Array.isArray(singleIniciativa.value?.tags)
    ? singleIniciativa.value.tags.map((tag) => tag.id)
    : [],
}));

if (iniciativa_id) {
  title = 'Editar';
}
(async () => {
  await MetasStore.getById(meta_id);
  if (iniciativa_id) await IniciativasStore.getByIdReal(iniciativa_id);
  singleMeta.value.orgaos_participantes?.forEach((x) => {
    x.orgao_id = x.orgao.id;
    organsAvailable.value.push(x);
    if (!usersAvailable.value[x.orgao_id]) usersAvailable.value[x.orgao_id] = [];
    usersAvailable.value[x.orgao_id] = usersAvailable.value[x.orgao_id].concat(x.participantes);
  });
  singleMeta.value.coordenadores_cp?.forEach((x) => {
    coordsAvailable.value.push(x);
  });
  if (iniciativa_id) {
    if (singleIniciativa.value.orgaos_participantes) {
      orgaos_participantes.value.splice(0);
      singleIniciativa.value.orgaos_participantes.forEach((x) => {
        const z = {};
        z.orgao_id = x.orgao.id;
        z.busca = '';
        z.participantes = x.participantes.map((y) => y?.id ?? y);
        z.responsavel = x.responsavel;
        orgaos_participantes.value.push(z);
      });
    }
    if (singleIniciativa.value.coordenadores_cp) {
      coordenadores_cp.value.participantes = singleIniciativa.value.coordenadores_cp.map((x) => x.id);
    }
  }
  oktogo.value = true;
})();

const schema = Yup.object().shape({
  codigo: Yup.string().required('Preencha o código'),
  titulo: Yup.string().required('Preencha o titulo'),
  contexto: Yup.string().nullable(),
  complemento: Yup.string().nullable(),

  meta_id: Yup.string().nullable(),
  compoe_indicador_meta: Yup.string().nullable(),
});

async function onSubmit(_, { controlledValues: values }) {
  try {
    const er = [];
    values.orgaos_participantes = unref(orgaos_participantes);
    values.orgaos_participantes = values.orgaos_participantes.filter((x) => {
      if (x.orgao_id && !x.participantes.length) er.push('Selecione pelo menos um responsável para o órgão.');
      return x.orgao_id;
    });

    if (route.meta.entidadeMãe === 'pdm') {
      values.coordenadores_cp = coordenadores_cp.value.participantes;
      if (!values.coordenadores_cp.length) er.push('Selecione pelo menos um responsável para a coordenadoria.');
    }

    if (!values.meta_id) values.meta_id = meta_id;
    values.compoe_indicador_meta = !!values.compoe_indicador_meta;

    if (er.length) throw er.join('<br />');

    let msg;
    let r;
    let rota;
    if (iniciativa_id && singleIniciativa.value.id) {
      r = await IniciativasStore.update(singleIniciativa.value.id, values);
      msg = 'Dados salvos com sucesso!';
      rota = `/metas/${meta_id}/iniciativas/${iniciativa_id}`;
    } else {
      r = await IniciativasStore.insert(values);
      msg = 'Item adicionado com sucesso!';
      rota = `/metas/${meta_id}/iniciativas/${r}`;
    }
    if (r) {
      IniciativasStore.clear();

      if (route.meta.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      } else if (route.meta.entidadeMãe === 'pdm') {
        await router.push(rota);
      } else {
        throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
      }
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    alertStore.$reset();

    if (route.meta.rotaDeEscape) {
      router.push({
        name: route.meta.rotaDeEscape,
        query: route.query,
      });
    } else if (route.meta.entidadeMãe === 'pdm') {
      router.push({
        path: `/metas/${meta_id}`,
        query: route.query,
      });
    } else {
      throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
    }
  });
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
  const r = usersAvailable.value[orgao_id] ?? [];
  return r.length ? r : [];
}
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <header class="flex spacebetween center mb2">
    <div>
      <TítuloDePágina
        :ícone="activePdm?.logo"
      >
        {{ title }} {{ activePdm.rotulo_iniciativa }}
      </TítuloDePágina>

      <div class="t24">
        Meta: {{ singleMeta.titulo }}
      </div>
    </div>
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
  </header>
  <template
    v-if="oktogo &&
      !(singleIniciativa?.loading || singleIniciativa?.error)
      && !(singleMeta?.loading || singleMeta?.error)"
  >
    <Form
      v-slot="{ errors, isSubmitting, values }"
      :validation-schema="schema"
      :initial-values="valoresIniciais"
      @submit="onSubmit"
    >
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
            :class="{ error: errors.titulo }"
          />
          <div class="error-msg">
            {{ errors.titulo }}
          </div>
        </div>
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Contexto</label>
          <Field
            name="contexto"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ error: errors.contexto }"
          />
          <div class="error-msg">
            {{ errors.contexto }}
          </div>
        </div>
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">
            {{ activePdm.rotulo_complementacao_meta || 'Informações Complementares' }}
          </label>
          <Field
            name="complemento"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ error: errors.complemento }"
          />
          <div class="error-msg">
            {{ errors.complemento }}
          </div>
        </div>
      </div>
      <div
        v-show="route.meta.entidadeMãe === 'pdm' "
        class="mb1 mt1"
      >
        <label class="block">
          <Field
            name="compoe_indicador_meta"
            type="checkbox"
            value="1"
            class="inputcheckbox"
          /><span :class="{ error: errors.compoe_indicador_meta }">Compõe o Indicador da meta</span>
        </label>
        <div class="error-msg">
          {{ errors.compoe_indicador_meta }}
        </div>
      </div>

      <div class="fieldset mb1">
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

      <template v-if="$route.meta.entidadeMãe === 'pdm'">
        <label class="label">Órgãos participantes <span class="tvermelho">*</span></label>
        <div class="flex center g2">
          <label class="f1 label tc300">Órgão</label>
          <label class="f1 label tc300">Responsável</label>
          <div style="flex-basis: 30px;" />
        </div>
        <template
          v-for="(item, index) in orgaos_participantes"
          :key="index"
        >
          <div class="flex mb1 g2">
            <div class="f1">
              <select
                v-if="organsAvailable.length"
                v-model="item.orgao_id"
                class="inputtext light"
                @change="item.participantes=[]"
              >
                <option
                  v-for="o in organsAvailable.filter(a => a.orgao_id == item.orgao_id || !orgaos_participantes.map(b => b.orgao_id).includes(a.orgao_id))"
                  :key="o.orgao_id"
                  :value="o.orgao_id"
                  :title="o.orgao.descricao?.length > 36 ? o.orgao.descricao : null"
                >
                  {{ o.orgao.sigla }} - {{ truncate(o.orgao.descricao, 36) }}
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
                v-if="index"
                class="addlink mt1"
                @click="removeOrgao(orgaos_participantes,index)"
              ><svg
                width="20"
                height="20"
              ><use xlink:href="#i_remove" /></svg></a>
            </div>
          </div>
        </template>
        <a
          class="addlink"
          @click="addOrgao(orgaos_participantes,true)"
        ><svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg> <span>Adicionar órgão participante</span></a>
      </template>

      <fieldset v-if="$route.meta.entidadeMãe === 'planoSetorial'">
        <label class="label">Órgãos responsáveis</label>
        <div
          class="flex flexwrap g2 mb1"
        >
          <div class="f1 mb1">
            <CampoDeEquipesComBuscaPorOrgao
              v-model="values.ps_ponto_focal.equipes"
              :equipes-ids="singleMeta.ps_ponto_focal?.equipes"
              :valores-iniciais="valoresIniciais.ps_ponto_focal?.equipes"
              name="ps_ponto_focal.equipes"
              perfis-permitidos="PontoFocalPS"
            />
          </div>
        </div>
      </fieldset>

      <hr class="mt2 mb2">

      <fieldset v-if="$route.meta.entidadeMãe === 'pdm'">
        <legend class="label">
          Responsável na coordenadoria de planejamento&nbsp;<span
            class="tvermelho"
          >*</span>
        </legend>
        <div class="flex">
          <div
            v-if="coordsAvailable.length"
            class="f1"
          >
            <AutocompleteField
              :controlador="coordenadores_cp"
              :grupo="coordsAvailable"
              label="nome_exibicao"
            />
          </div>
        </div>
      </fieldset>

      <fieldset v-if="$route.meta.entidadeMãe === 'planoSetorial'">
        <legend class="label">
          Equipe Técnica de Administração do Plano
        </legend>

        <div>
          <AutocompleteField
            name="ps_tecnico_cp.equipes"
            :controlador="{
              busca: '',
              participantes: values.ps_tecnico_cp?.equipes || [],
            }"
            :grupo="EquipesStore.equipesPorIds(singleMeta.ps_tecnico_cp?.equipes)"
            label="titulo"
          />
        </div>
      </fieldset>

      <CampoDePlanosMetasRelacionados
        v-if="$route.meta.entidadeMãe === 'planoSetorial'"
        :apenas-pdms="false"
        titulo="Relacionamentos com outros compromissos"
        :model-value="values.origens_extra"
        :valores-iniciais="valoresIniciais.origens_extra"
        name="origens_extra"
        etiqueta-botao-adicao="Adicionar compromisso"
        class="mb2"
      >
        <template #rodape>
          <ErrorMessage
            class="error-msg"
            name="origens_extra"
          />
        </template>
      </CampoDePlanosMetasRelacionados>

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

  <template v-if="singleIniciativa?.loading || !oktogo">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="singleIniciativa?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ singleIniciativa.error }}
      </div>
    </div>
  </template>
</template>
