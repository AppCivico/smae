<script setup>
import { Dashboard } from '@/components';
import { usuário as schema } from '@/consts/formSchemas';
import { router } from '@/router';
import {
  useAlertStore, useOrgansStore, usePaineisGruposStore, useUsersStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { useRoute } from 'vue-router';

const usersStore = useUsersStore();
usersStore.clear();
const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const organsStore = useOrgansStore();
const { organs } = storeToRefs(organsStore);
organsStore.getAll();

const PaineisGruposStore = usePaineisGruposStore();
const { PaineisGrupos } = storeToRefs(PaineisGruposStore);
PaineisGruposStore.getAll();

let title = 'Cadastro de Usuário';
const { user, accessProfiles } = storeToRefs(usersStore);
usersStore.getProfiles();
if (id) {
  title = 'Editar Usuário';
  usersStore.getById(id);
}

async function onSubmit(values) {
  try {
    let msg;
    let r;

    if (id && user) {
      r = await usersStore.update(user.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await usersStore.register(values);
      msg = 'Usuário adicionado com sucesso!';
    }
    if (r == true) {
      await router.push('/usuarios');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/usuarios');
}
</script>

<template>
  <Dashboard>
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
    <template v-if="!(user?.loading || user?.error)">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        :initial-values="user"
        @submit="onSubmit"
      >
        <div
          v-if="user&&id"
          class="flex g2 mb2"
        >
          <div class="">
            <label class="block mb1">
              <Field
                name="desativado"
                class="inputcheckbox"
                type="checkbox"
                value="1"
                :checked="desativado"
              /><span>Inativar cadastro</span>
            </label>
          </div>
          <div class="f1">
            <label class="label">Motivo <span class="tvermelho">*</span></label>
            <Field
              name="desativado_motivo"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.desativado_motivo }"
            />
            <div class="error-msg">
              {{ errors.desativado_motivo }}
            </div>
          </div>
        </div>

        <div class="flex g2">
          <div class="f1">
            <label class="label">E-mail <span class="tvermelho">*</span></label>
            <Field
              name="email"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.email }"
            />
            <div class="error-msg">
              {{ errors.email }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Nome Completo <span class="tvermelho">*</span></label>
            <Field
              name="nome_completo"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.nome_completo }"
            />
            <div class="error-msg">
              {{ errors.nome_completo }}
            </div>
          </div>
        </div>

        <div class="flex g2 mb2">
          <div class="f1">
            <label class="label">Nome Social <span class="tvermelho">*</span></label>
            <Field
              name="nome_exibicao"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.nome_exibicao }"
            />
            <div class="error-msg">
              {{ errors.nome_exibicao }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Lotação <span class="tvermelho">*</span></label>
            <Field
              name="lotacao"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.lotacao }"
            />
            <div class="error-msg">
              {{ errors.lotacao }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Órgão <span class="tvermelho">*</span></label>
            <Field
              name="orgao_id"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.orgao_id }"
            >
              <option value="">
                Selecionar
              </option>
              <template v-if="organs.length">
                <option
                  v-for="organ in organs"
                  :key="organ.id"
                  :value="organ.id"
                  :selected="orgao_id && organ.id == orgao_id"
                >
                  {{ organ.sigla }}
                </option>
              </template>
            </Field>
            <div class="error-msg">
              {{ errors.orgao_id }}
            </div>
          </div>
        </div>

        <div class="mb2">
          <div class="label">
            Perfil de acesso
          </div>
          <template v-if="accessProfiles?.loading">
            <span class="spinner">Carregando</span>
          </template>
          <template v-if="accessProfiles.length">
            <label
              v-for="profile in accessProfiles"
              :key="profile.id"
              class="block mb1"
            >
              <Field
                name="perfil_acesso_ids"
                class="inputcheckbox"
                type="checkbox"
                :class="{ 'error': errors.perfil_acesso_ids }"
                :value="profile.id"
                :checked="perfil_acesso_ids && perfil_acesso_ids.includes(profile.id)"
              /><span>
                {{ profile.nome }}
                <span class="qtipitem">i <div class="qtip">
                  <p class="label">Privilegios</p>
                  <ul>
                    <li
                      v-for="privilegio in profile.perfil_privilegio"
                      :key="privilegio.privilegio.nome"
                    >{{ privilegio.privilegio.nome }}</li>
                  </ul>
                </div></span></span>

              <small class="block tc300">
                {{ profile.descricao }}
              </small>
            </label>
            <div class="error-msg">
              {{ errors.perfil_acesso_ids }}
            </div>
          </template>
        </div>

        <div class="mb2">
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
                class="inputcheckbox"
                type="checkbox"
                :class="{ 'error': errors.grupos }"
                :value="p.id"
                :checked="grupos && grupos.includes(p.id)"
              /><span>{{ p.nome }}</span>
            </label>
            <div class="error-msg">
              {{ errors.grupos }}
            </div>
          </template>
        </div>

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
      </Form>
    </template>
    <template v-if="user?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="user?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ user.error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
