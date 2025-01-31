<script setup>
import tipoDePerfil from '@/consts/tipoDePerfil';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CONST_PERFIL_PARTICIPANTE_EQUIPE, LISTA_PRIV_ADMIN } from '@back/common/consts';
// Em 2024-10-28, o desenvolvedor responsável pelo back end orientou a usar essa variável
import { Dashboard } from '@/components';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import TransitionExpand from '@/components/TransitionExpand.vue';
import { usuário as schema } from '@/consts/formSchemas';
import módulosDoSistema from '@/consts/modulosDoSistema.ts';
import truncate from '@/helpers/truncate';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePaineisGruposStore } from '@/stores/paineisGrupos.store';
import { useUsersStore } from '@/stores/users.store';
import { kebabCase } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const usersStore = useUsersStore();
usersStore.clear();
const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const equipesStore = useEquipesStore();
const {
  equipesPorOrgaoIdPorPerfil,
  chamadasPendentes: chamadasPendentesDeEquipes,
  erro: erroDeEquipes,
} = storeToRefs(equipesStore);

const organsStore = useOrgansStore();
const { organs } = storeToRefs(organsStore);

const PaineisGruposStore = usePaineisGruposStore();
const { PaineisGrupos } = storeToRefs(PaineisGruposStore);
PaineisGruposStore.getAll();

const authStore = useAuthStore();
const { sistemaCorrente, permissions } = storeToRefs(authStore);

let title = 'Cadastro de Usuário';
const personalizarNomeParaExibição = ref(false);
const {
  user, accessProfiles, erros, chamadasPendentes,
} = storeToRefs(usersStore);

const {
  errors, handleSubmit, isSubmitting, resetForm, resetField, setFieldValue, values,
} = useForm({
  initialValues: user,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const perfilParaDetalhar = ref(0);

const perfisPorMódulo = computed(() => (Array.isArray(accessProfiles.value)
  ? accessProfiles.value.reduce((acc, cur) => {
    const modulosSistemasDessePerfil = Array.isArray(cur.modulos_sistemas)
      ? cur.modulos_sistemas
      : [cur.modulos_sistemas];

    modulosSistemasDessePerfil.forEach((módulo) => {
      if (!acc[módulo]) {
        const idDoMódulo = kebabCase(módulo);

        acc[módulo] = {
          id: idDoMódulo,
          etiqueta: módulosDoSistema[módulo]?.nome || módulo,
          nome: módulo,
          perfis: [],
          totalSelecionado: 0,
        };
      }

      acc[módulo].totalSelecionado += values.perfil_acesso_ids?.includes(cur.id) ? 1 : 0;
      acc[módulo].perfis.push(cur);
    });

    return acc;
  }, {})
  : {}));

const módulosOrdenados = computed(() => Object.values(perfisPorMódulo.value)
  .toSorted((a, b) => {
    switch ('SMAE') {
      case a.etiqueta:
        return 1;
      case b.etiqueta:
        return -1;
      default:
        return a.etiqueta.localeCompare(b.etiqueta);
    }
  }));

const handleModulosPermitidosChange = (novoValor) => {
  if (!values.sobreescrever_modulos) {
    setFieldValue('sobreescrever_modulos', true);
  }

  setFieldValue('modulos_permitidos', novoValor);
};

const módulosFiltrados = computed(() => {
  if (!values.sobreescrever_modulos) {
    return módulosOrdenados.value;
  }

  if (!values.modulos_permitidos || values.modulos_permitidos.length === 0) {
    return [];
  }

  return módulosOrdenados.value
    .filter((módulo) => values.modulos_permitidos.includes(módulo.nome));
});

const modulosPermitidosValue = computed(() => {
  const permitidos = values.sobreescrever_modulos
    ? values.modulos_permitidos
    : módulosOrdenados.value.map((m) => m.nome);

  return [...new Set([...permitidos, 'SMAE'])];
});

const modulosIds = computed(() => módulosFiltrados.value.map((módulo) => módulo.id).join('.'));

// ficou meio complexo, mas precisamos validar a lista de permissões do backend
// com o objeto de permissões que recebemos da store, dessa forma se a lista
// de admins mudar no back não precisamos atualizar nada no front
const podeEditarMódulos = computed(() => Object.entries(permissions.value || {})
  .flatMap(([modulo, permissoes]) => Object.keys(permissoes).map((permissao) => `${modulo}.${permissao}`))
  .some((permission) => LISTA_PRIV_ADMIN.includes(permission)));

usersStore.getProfiles();

if (id) {
  title = 'Editar Usuário';
  usersStore.getById(id).then(() => {
    if (user.value?.nome_completo !== user.value?.nome_exibicao) {
      personalizarNomeParaExibição.value = true;
    }
  });
}

const onSubmit = handleSubmit.withControlled(async (controlledValues) => {
  const carga = controlledValues;

  if (podeEditarMódulos.value) {
    carga.modulos_permitidos = controlledValues.modulos_permitidos;
    carga.sobreescrever_modulos = values.sobreescrever_modulos;
  }

  if (!personalizarNomeParaExibição.value) {
    carga.nome_exibicao = carga.nome_completo;
  }

  try {
    let msg;
    let r;

    if (id && user) {
      r = await usersStore.update(id, carga);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await usersStore.register(carga);
      msg = 'Usuário adicionado com sucesso!';
    }
    if (r === true) {
      await router.push({ name: 'gerenciarUsuários' });
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
});

watch(values.modulos_permitidos, (novoValor) => {
  if (novoValor.length < módulosOrdenados.value.length) {
    values.sobreescrever_modulos = true;
  }
});

watch(() => values.sobreescrever_modulos, (novoValor) => {
  if (!novoValor) {
    setFieldValue('modulos_permitidos', módulosOrdenados.value.map((módulo) => módulo.nome));
  }
});

watch(user, (novoValor) => {
  resetForm({ values: novoValor });
});

watch(accessProfiles, () => {
  resetForm();
});
</script>
<template>
  <Dashboard>
    <header class="flex flexwrap spacebetween center mb2">
      <TítuloDePágina>
        {{ title }}
      </TítuloDePágina>

      <hr class="ml2 f1">
      <CheckClose :formulario-sujo="formularioSujo" />
    </header>

    <div
      v-if="user.responsavel_pelos_projetos?.length"
      class="g2 mb1"
    >
      <hr class="mb1">
      <details
        class="fb100 mb1"
        :open="user.responsavel_pelos_projetos?.length === 1 ? true : null"
      >
        <summary>
          <h2
            class="label mb0"
            style="line-height: 1.5rem;"
          >
            <svg
              class="ib"
              width="20"
              height="20"
            ><use xlink:href="#i_valores" /></svg>
            {{ user.responsavel_pelos_projetos.length === 1
              ? 'Projeto pelo qual é responsável'
              : 'Projetos pelos quais é responsável' }}
          </h2>
        </summary>

        <div class="contentStyle">
          <ol class="pl0 mt1 mb0">
            <li
              v-for="item in user.responsavel_pelos_projetos"
              :key="item.id"
              class="mb05"
            >
              <strong v-if="item.codigo">
                {{ item.codigo }}
              </strong>

              {{ item.nome }}
            </li>
          </ol>
        </div>
      </details>
      <hr class="mb1">
    </div>

    <ErrorComponent
      v-if="erros.user"
      class="mb1"
    >
      {{ erros.user }}
    </ErrorComponent>

    <form
      @submit.prevent="onSubmit"
    >
      <div
        v-if="user && id"
        class="flex flexwrap g2 mb1"
      >
        <div class="mt1 mb3">
          <label class="block">
            <Field
              name="desativado"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
              @update:model-value="resetField(
                'desativado_motivo', { value: user.desativado_motivo }
              )"
            /><span>Inativar usuário</span>
          </label>
        </div>
        <div
          v-show="values.desativado"
          class="f1 fb15em"
        >
          <label class="label">Motivo <span class="tvermelho">*</span></label>
          <Field
            name="desativado_motivo"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.desativado_motivo }"
          />
          <ErrorMessage name="desativado_motivo" />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb15em">
          <label class="label">E-mail <span class="tvermelho">*</span></label>
          <Field
            name="email"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.email }"
          />
          <ErrorMessage name="email" />
        </div>
        <div class="f1 fb15em">
          <label class="label">Nome Completo <span class="tvermelho">*</span></label>
          <Field
            name="nome_completo"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.nome_completo }"
            @change="!personalizarNomeParaExibição
              ? setFieldValue('nome_exibicao', values.nome_completo)
              : null"
          />
          <ErrorMessage name="nome_completo" />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="mt1 mb3">
          <label class="block">
            <input
              v-model="personalizarNomeParaExibição"
              type="checkbox"
            ><span>Personalizar nome para exibição</span>
          </label>
        </div>

        <div
          v-show="personalizarNomeParaExibição"
          class="f1 fb15em"
        >
          <label class="label">Nome para exibição <span class="tvermelho">*</span></label>
          <Field
            name="nome_exibicao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.nome_exibicao }"
            @change="!personalizarNomeParaExibição
              ? setFieldValue('nome_exibicao', values.nome_completo)
              : null"
          />
          <ErrorMessage name="nome_exibicao" />
        </div>
      </div>

      <div class="flex flexwrap g2 mb1">
        <div class="f1 fb15em">
          <label class="label">Lotação <span class="tvermelho">*</span></label>
          <Field
            name="lotacao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.lotacao }"
          />
          <ErrorMessage name="lotacao" />
        </div>
        <div class="f1 fb15em">
          <label class="label">Órgão <span class="tvermelho">*</span></label>
          <Field
            name="orgao_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.orgao_id }"
            @change="resetField('equipes', { value: [] })"
          >
            <option value="">
              Selecionar
            </option>
            <template v-if="organs.length">
              <option
                v-for="organ in organs"
                :key="organ.id"
                :value="organ.id"
                :title="organ.descricao?.length > 36 ? organ.descricao : null"
              >
                {{ organ.sigla }} - {{ truncate(organ.descricao, 36) }}
              </option>
            </template>
          </Field>
          <ErrorMessage name="orgao_id" />
        </div>
      </div>

      <div role="group">
        <legend class="w900">
          Perfil de acesso
        </legend>

        <p class="tc400 mb2">
          Clique no nome do perfil para visualizar mais informações. Clique no
          checkbox para selecionar o perfil desejado.
        </p>

        <div
          v-if="podeEditarMódulos"
          class="mb2"
        >
          <p class="tc400 mb1">
            Acesso aos módulos
          </p>

          <ul class="lista-de-perfis t12">
            <li
              v-for="módulo in módulosOrdenados"
              :key="módulo.id"
              class="mb1"
            >
              <label class="block mb1 perfil">
                <Field
                  name="modulos_permitidos"
                  type="checkbox"
                  :value="módulo.nome"
                  :class="{ 'error': errors.modulos_permitidos }"
                  :model-value="modulosPermitidosValue"
                  :disabled="módulo.nome === 'SMAE'"
                  :checked="módulo.nome === 'SMAE' || modulosPermitidosValue.includes(módulo.nome)"
                  @update:model-value="handleModulosPermitidosChange($event)"
                />
                {{ módulo.etiqueta }}
              </label>
            </li>
          </ul>
        </div>

        <!--
          `v-if` em uso para contornar que não é possível ver a chegada
          atrasada de slots para aplicar a rota da aba inicial
          `:key` usado para forçar a reavaliação dos
          slots que não são reativos
        -->
        <EnvelopeDeAbas
          v-if="módulosFiltrados.length"
          :key="modulosIds"
          nome-da-chave-de-abas="modulo"
          class="mb2"
        >
          <template
            v-for="(módulo) in módulosFiltrados"
            #[`${módulo.id}__cabecalho`]
            :key="módulo.id"
          >
            {{ módulo.etiqueta }}
            <sup
              class="contador-de-perfis"
            >
              {{ perfisPorMódulo[módulo.nome]?.totalSelecionado }}
            </sup>
          </template>

          <template
            v-for="módulo in módulosFiltrados"
            #[módulo.id]="{ abaEstaAberta }"
            :key="módulo.id"
          >
            <ul class="lista-de-perfis t12">
              <li
                v-for="perfil in módulo.perfis"
                :key="perfil.id"
                class="lista-de-perfis__item mb2"
              >
                <label
                  class="block mb1 perfil"
                  :for="`${módulo.id}__${perfil.id}`"
                >
                  <Field
                    :id="`${módulo.id}__${perfil.id}`"
                    name="perfil_acesso_ids"
                    type="checkbox"
                    class="perfil__campo"
                    :class="{ 'error': errors.perfil_acesso_ids }"
                    :value="perfil.id"
                    :disabled="(!perfil.pode_editar) || undefined"
                  />
                  {{ perfil.nome }}
                  <small class="block t12 tc500 w700 mt1">
                    {{ perfil.descricao }}
                  </small>
                </label>

                <pre v-ScrollLockDebug>pode_editar:{{ perfil.pode_editar }}</pre>
                <pre v-ScrollLockDebug>modulos_sistemas:{{ perfil.modulos_sistemas }}</pre>

                <TransitionExpand
                  v-if="perfil.nome === CONST_PERFIL_PARTICIPANTE_EQUIPE"
                >
                  <ErrorComponent v-if="erroDeEquipes">
                    {{ erroDeEquipes }}
                  </ErrorComponent>
                  <ul
                    v-if="values.perfil_acesso_ids?.includes(perfil.id)
                      && equipesPorOrgaoIdPorPerfil[values.orgao_id]"
                    :aria-busy="chamadasPendentesDeEquipes"
                    class="lista-de-perfis"
                  >
                    <li
                      v-for="(perfilDeEquipe, chave) in
                        equipesPorOrgaoIdPorPerfil[values.orgao_id] "
                      :key="chave"
                      class="lista-de-perfis__item"
                    >
                      <strong class="block mb1">
                        {{ tipoDePerfil[chave].nome || chave }}
                      </strong>
                      <ul class="lista-de-perfis mb2">
                        <li
                          v-for="equipe in perfilDeEquipe"
                          :key="equipe.id"
                          class="lista-de-perfis__item"
                        >
                          <label
                            class="block mb1 perfil"
                            :for="`${módulo.id}__${perfil.id}__${chave}__${equipe.id}`"
                          >
                            <Field
                              :id="`${módulo.id}__${perfil.id}__${chave}__${equipe.id}`"
                              name="equipes"
                              type="checkbox"
                              :class="{ 'error': errors.equipes }"
                              :disabled="(!perfil.pode_editar) || undefined"
                              :value="equipe.id"
                            />
                            {{ equipe.titulo }}
                          </label>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </TransitionExpand>

                <button
                  type="button"
                  class="perfil__interruptor-de-privilegios btn bgnone uc tcprimary p0 tc600"
                  @click="perfilParaDetalhar = perfilParaDetalhar === perfil.id
                    ? 0
                    : perfil.id"
                >
                  <template v-if="perfilParaDetalhar === perfil.id">
                    ocultar
                  </template>
                  <template v-else>
                    exibir
                  </template>
                  privilégios
                </button>
                <TransitionExpand>
                  <ul
                    v-show="perfilParaDetalhar === perfil.id && abaEstaAberta"
                    :aria-label="`Privilégios de ${perfil.nome}`"
                    class="perfil__lista-de-privilegios card-shadow p2"
                  >
                    <li
                      v-for="privilegio in perfil.perfil_privilegio"
                      :key="privilegio.privilegio.nome"
                      class="lista-de-privilegios__item"
                    >
                      {{ privilegio.privilegio.nome }}

                      <pre v-ScrollLockDebug>{{ privilegio.privilegio.codigo }}</pre>
                    </li>
                  </ul>
                </TransitionExpand>
              </li>
            </ul>
          </template>
        </EnvelopeDeAbas>

        <ErrorMessage name="perfil_acesso_ids" />
      </div>

      <div
        v-if="sistemaCorrente.valueOf() === 'PDM'"
        class="mb2"
      >
        <div class="label">
          Grupos de paineis da meta
        </div>
        <template v-if="PaineisGrupos?.loading">
          <span class="spinner">Carregando</span>
        </template>
        <template v-if="PaineisGrupos.length">
          <label
            v-for="p in PaineisGrupos"
            :key="p.id"
            class="block mb1"
          >
            <Field
              name="grupos"
              type="checkbox"
              :class="{ 'error': errors.grupos }"
              :value="p.id"
            /><span>{{ p.nome }}</span>
          </label>
          <ErrorMessage name="grupos" />
        </template>
      </div>

      <FormErrorsList :errors="errors" />

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar cadastro
        </button>
        <hr class="ml2 f1">
      </div>
    </form>

    <LoadingComponent
      v-if="chamadasPendentes.user"
    />

    <ErrorComponent
      v-if="erros.user"
      class="mb1"
    >
      {{ erros.user }}
    </ErrorComponent>
  </Dashboard>
</template>
<style lang="less">
@coluna: 22.5em;

.contador-de-perfis {
  border-radius: 999em;
  background-color: @c600;
  color: @branco;
  padding: 0 0.25em;
}

.lista-de-perfis {
  position: relative;

  @media screen and(min-width: @coluna * 2) {
    padding-right: calc(@coluna + 2rem);
  }

  .lista-de-perfis {
    padding-right: 0;
  }
}

.lista-de-perfis__item {
  padding-left: 2rem;
}

.perfil {}

.perfil__campo {
  position: absolute;
  left: 0;
}

.perfil__interruptor-de-privilegios {}

.perfil__lista-de-privilegios {
  column-fill: balance;

  column-gap: 1rem;
  column-width: @coluna;
  max-width: 100%;
  margin-top: 1rem;

  overflow-x: clip;
  overflow-y: auto;

  @media screen and(min-width: @coluna * 2) {
    margin-top: 0;
    columns: auto;
    position: absolute;
    top: 0;
    right: 0;
    max-height: 100%;
    width: @coluna;
  }

  &::before {
    display: block;
    content: attr(aria-label);
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 1rem;
    column-span: all;
  }
}

.lista-de-privilegios__item {
  list-style-type: disc;
  list-style-position: outside;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
