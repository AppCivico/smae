<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
} from 'vee-validate';
import {
  computed,
  defineOptions,
  ref,
  unref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import CampoDeEquipesComBuscaPorOrgao from '@/components/CampoDeEquipesComBuscaPorOrgao.vue';
import CampoDePlanosMetasRelacionados from '@/components/CampoDePlanosMetasRelacionados.vue';
import CampoDeTagsComBuscaPorCategoria from '@/components/CampoDeTagsComBuscaPorCategoria.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { meta as metaSchema } from '@/consts/formSchemas';
import simplificarOrigem from '@/helpers/simplificadorDeOrigem';
import truncate from '@/helpers/texto/truncate';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useMacrotemasStore } from '@/stores/macrotemas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useSubtemasStore } from '@/stores/subtemas.store';
import { useTagsStore } from '@/stores/tags.store';
import { useTemasStore } from '@/stores/temas.store';
import { useUsersStore } from '@/stores/users.store';

defineOptions({
  inheritAttrs: false,
});

const alertStore = useAlertStore();
const route = useRoute();
// desabilitando lint para manter comportamento legado
// eslint-disable-next-line @typescript-eslint/naming-convention
const { meta_id } = route.params;
const oktogo = ref(0);

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.clear();
// desabilitando lint para manter comportamento legado
// eslint-disable-next-line @typescript-eslint/naming-convention
const orgaos_participantes = ref([
  {
    orgao_id: null, responsavel: true, participantes: [], busca: '',
  },
  {
    orgao_id: null, responsavel: false, participantes: [], busca: '',
  },
]);
// desabilitando lint para manter comportamento legado
// eslint-disable-next-line @typescript-eslint/naming-convention
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
const { pessoasSimplificadas } = storeToRefs(UserStore);

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

    if (route.meta.entidadeMãe === 'pdm') {
      if (singleMeta.value.coordenadores_cp) {
        coordenadores_cp.value.participantes = singleMeta.value.coordenadores_cp.map((x) => x.id);
      }
    }
  }

  oktogo.value = true;
})();

const schema = computed(() => metaSchema(activePdm.value));

const valoresIniciais = computed(() => ({
  ...singleMeta.value,

  coordenadores_cp: Array.isArray(singleMeta.coordenadores_cp)
    ? singleMeta.coordenadores_cp.map((x) => x.id)
    : [],

  ps_ponto_focal: {
    equipes: singleMeta.value?.ps_ponto_focal?.equipes || [],
  },

  ps_tecnico_cp: {
    equipes: singleMeta.value?.ps_tecnico_cp?.equipes || [],
  },

  macro_tema_id: singleMeta.value.macro_tema?.id || route.params.macro_tema_id,
  sub_tema_id: singleMeta.value.sub_tema?.id || route.params.sub_tema_id,
  tema_id: singleMeta.value.tema?.id || route.params.tema_id,

  origens_extra: Array.isArray(singleMeta.value?.origens_extra)
    ? singleMeta.value.origens_extra.map((origem) => simplificarOrigem(origem))
    : [],

  tags: Array.isArray(singleMeta.value?.tags)
    ? singleMeta.value.tags.map((tag) => tag.id)
    : [],
}));

const isPlanejamentoEMonitoramento = computed(() => ['planoSetorial', 'programaDeMetas'].includes(route.meta.entidadeMãe));

async function onSubmit(_, { controlledValues: values }) {
  try {
    const er = [];

    // remove orgaos_participantes de plano setorial pois a api
    // gera sozinha esse valor agora
    if (isPlanejamentoEMonitoramento.value) {
      values.orgaos_participantes = [];
    }

    if (route.meta.entidadeMãe === 'pdm') {
      values.orgaos_participantes = unref(orgaos_participantes);
      values.orgaos_participantes = values.orgaos_participantes.filter((x) => {
        if (x.orgao_id && !x.participantes.length) er.push('Selecione pelo menos um responsável para o órgão.');
        return x.orgao_id;
      });
    }

    if (route.meta.entidadeMãe === 'pdm') {
      values.coordenadores_cp = coordenadores_cp.value.participantes;
      if (!values.coordenadores_cp.length) er.push('Selecione pelo menos um responsável para a coordenadoria.');
    }

    if (!values.pdm_id) values.pdm_id = activePdm.value.id;

    if (activePdm.value.possui_macro_tema && !values.macro_tema_id) er.push(`Selecione um(a) ${activePdm.value.rotulo_macro_tema}.`);
    if (activePdm.value.possui_tema && !values.tema_id) er.push(`Selecione um(a) ${activePdm.value.rotulo_tema}.`);
    if (activePdm.value.possui_sub_tema && !values.sub_tema_id) er.push(`Selecione um(a) ${activePdm.value.rotulo_sub_tema}.`);
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
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
    // desabilitando lint para manter comportamento legado
    // eslint-disable-next-line eqeqeq
    if (r == true) {
      MetasStore.clear();

      if (route.meta.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      } else if (route.meta.entidadeMãe === 'pdm') {
        await router.push(`/meta/${singleMeta.value.id}`);
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

          if (route.meta.entidadeMãe === 'pdm') {
            router.push({ name: 'pdm.metas' });
          } else if (isPlanejamentoEMonitoramento.value) {
            router.push({
              name: `${route.meta.entidadeMãe}.listaDeMetas`,
              params: {
                planoSetorialId: route.params.planoSetorialId,
              },
            });
          } else {
            throw new Error(`Falta configurar uma "entidadeMãe" para: "${route.path}"`);
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
  // desabilitando lint para manter comportamento legado
  // eslint-disable-next-line eqeqeq
  const v = r.length ? r.find((x) => x.id == orgao_id) : false;
  return v?.responsible ?? [];
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

  <header class="flex spacebetween center mb2">
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
  </header>
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

      <template v-if="$route.meta.entidadeMãe === 'pdm'">
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
                  v-for="o in OrgansStore.organResponsibles.filter(a => a.id == item.orgao_id
                    || !orgaos_participantes.map(b => b.orgao_id).includes(a.id))"
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
        ><use xlink:href="#i_+" /></svg> <span>Adicionar órgão participante</span></a>
      </template>

      <fieldset
        v-if="isPlanejamentoEMonitoramento"
        class="mb2"
      >
        <legend class="label">
          Órgãos responsáveis <span class="tvermelho">*</span>
        </legend>
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

      <fieldset
        v-if="$route.meta.entidadeMãe === 'pdm'"
        class="mb2"
      >
        <legend class="label">
          Responsável na coordenadoria de planejamento
          <span class="tvermelho">*</span>
        </legend>
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
      </fieldset>

      <fieldset
        v-if="isPlanejamentoEMonitoramento"
        class="mb2"
      >
        <legend class="label">
          Equipe Técnica de Monitoramento
        </legend>

        <div>
          <AutocompleteField
            name="ps_tecnico_cp.equipes"
            :controlador="{
              busca: '',
              participantes: values.ps_tecnico_cp.equipes,
            }"
            :grupo="pegaPsTecnicoCpCompleto(activePdm.ps_tecnico_cp.equipes)"
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
