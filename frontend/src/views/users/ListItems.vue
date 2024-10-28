<script setup>
import { Dashboard } from '@/components';
import LocalFilter from '@/components/LocalFilter.vue';
import truncate from '@/helpers/truncate';
import { useAuthStore } from '@/stores/auth.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const authStore = useAuthStore();
const { temPermissãoPara } = authStore;
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const usersStore = useUsersStore();
const { accessProfiles } = storeToRefs(usersStore);
usersStore.clear();
usersStore.getProfiles();
usersStore.filterUsers();

const organsStore = useOrgansStore();
const { organs } = storeToRefs(organsStore);

const orgao = ref(0);
const perfil = ref(0);
const listaFiltradaPorTermoDeBusca = ref([]);

const usersFiltered = computed(() => listaFiltradaPorTermoDeBusca.value
  .filter((x) => (!orgao.value ? true : x.orgao_id === orgao.value))
  .filter((x) => (!perfil.value ? true : x.perfil_acesso_ids.includes(perfil.value))));

function filterOrgan(orgao_id) {
  return organs.value.length ? organs.value.find((o) => o.id === orgao_id) : '-';
}
function filterPerfil(ids) {
  let vs;
  if (ids && accessProfiles.value.length) {
    vs = accessProfiles.value.filter((o) => ids.includes(o.id));
    if (vs.length) vs = vs.map((a) => a.nome).join(', ');
  }

  return vs ?? '-';
}

const listaDeUsuáriosComNomesAlémDeIds = computed(() => (!Array.isArray(usersStore.users)
  ? []
  : usersStore.users.map((x) => ({
    ...x,
    // TODO: usar esses valores na própria tabela para poupar recursos
    siglaDoÓrgãoParaBuscaLivre: filterOrgan(x.orgao_id).sigla,
    // TODO: usar esses valores na própria tabela para poupar recursos
    nomesDosPerfisParaBuscaLivre: filterPerfil(x.perfil_acesso_ids),
  }))));
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Gerenciar usuários</h1>
      <hr class="ml2 f1">
      <router-link
        v-if="perm?.CadastroPessoa?.inserir"
        :to="{
          name: 'criarUsuários'
        }"
        class="btn big ml2"
      >
        Novo usuário
      </router-link>
    </div>
    <div class="flex flexwrap g1">
      <div class="f1">
        <label class="label tc300">Órgão</label>
        <select
          v-model.number="orgao"
          class="inputtext"
        >
          <option :value="0">
            Todos
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
        </select>
      </div>

      <div class="f1">
        <label class="label tc300">Perfil</label>
        <select
          v-model.number="perfil"
          class="inputtext"
        >
          <option :value="0">
            Todos
          </option>
          <template v-if="accessProfiles.length">
            <option
              v-for="perfil in accessProfiles"
              :key="perfil.id"
              :value="perfil.id"
            >
              {{ perfil.nome }}
            </option>
          </template>
        </select>
      </div>

      <LocalFilter
        v-model="listaFiltradaPorTermoDeBusca"
        :lista="listaDeUsuáriosComNomesAlémDeIds"
        class="f2 search"
      />
    </div>

    <table class="tablemain fix">
      <thead>
        <tr>
          <th style="width: 20%">
            E-mail
          </th>
          <th style="width: 20%">
            Nome
          </th>
          <th style="width: 20%">
            Lotação
          </th>
          <th style="width: 15%">
            Órgão
          </th>
          <th style="width: 20%">
            Perfil
          </th>
          <th style="width: 50px" />
        </tr>
      </thead>
      <tbody>
        <template v-if="usersFiltered.length">
          <tr
            v-for="user in usersFiltered"
            :key="user.id"
            :class="{
              tc400: user.desativado
            }"
          >
            <td class="cell--minimum">
              {{ user.email }}
              <span
                v-if="user.desativado"
                class="tipinfo ml05"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_i" /></svg><div>Usuário desativado</div>
              </span>
            </td>
            <td>{{ user.nome_exibicao }}</td>
            <td>{{ user.lotacao ?? '-' }}</td>
            <td>{{ user.orgao_id ? filterOrgan(user.orgao_id)?.sigla : '-' }}</td>
            <td>
              {{ user.perfil_acesso_ids?.length
                ? filterPerfil(user.perfil_acesso_ids) : '-' }}
            </td>
            <td style="white-space: nowrap; text-align: right;">
              <template
                v-if="temPermissãoPara('CadastroPessoa.administrador') ||
                  temPermissãoPara('CadastroPessoa.administrador.MDO') ||
                  (perm?.CadastroPessoa?.editar && user.orgao_id
                    == authStore.user.orgao_id)"
              >
                <router-link
                  :to="{
                    name: 'editarUsuários',
                    params: {
                      id: user.id
                    }
                  }"
                  class="tprimary"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </router-link>
              </template>
            </td>
          </tr>
        </template>
        <tr v-if="usersFiltered.loading">
          <td colspan="54">
            Carregando
          </td>
        </tr>
        <tr v-if="usersFiltered.error">
          <td colspan="54">
            Error: {{ usersFiltered.error }}
          </td>
        </tr>
      </tbody>
    </table>
  </Dashboard>
</template>
