<script setup>
import { useAuthStore, usePaineisGruposStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const PaineisGruposStore = usePaineisGruposStore();
const { tempPaineisGrupos } = storeToRefs(PaineisGruposStore);
PaineisGruposStore.clear();
PaineisGruposStore.filterPaineisGrupos();

const filters = ref({
  textualSearch: '',
});
const itemsFiltered = ref(tempPaineisGrupos);

function filterItems() {
  PaineisGruposStore.filterPaineisGrupos(filters.value);
}
function toggleAccordeon(t) {
  t.target.closest('.tzaccordeon').classList.toggle('active');
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Grupos de paineis</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="perm?.CadastroGrupoPaineis?.inserir"
      to="/paineis-grupos/novo"
      class="btn big ml2"
    >
      Novo Grupo
    </router-link>
  </div>
  <div class="flex center mb2">
    <div class="f2 search">
      <input
        v-model="filters.textualSearch"
        placeholder="Buscar"
        type="text"
        class="inputtext"
        @input="filterItems"
      >
    </div>
  </div>

  <table class="tablemain fix">
    <thead>
      <tr>
        <th style="width: 55%">
          Grupo
        </th>
        <th style="width: 15%">
          Painéis
        </th>
        <th style="width: 15%">
          Usuários
        </th>
        <th style="width: 15%">
          Status
        </th>
        <th style="width: 50px" />
      </tr>
    </thead>
    <template v-if="itemsFiltered.length">
      <template
        v-for="p in itemsFiltered"
        :key="p.id"
      >
        <tr
          class="tzaccordeon"
          @click="toggleAccordeon"
        >
          <td>
            <div class="flex">
              <svg
                class="arrow"
                width="13"
                height="8"
              ><use xlink:href="#i_down" /></svg><span>{{ p.nome }}</span>
            </div>
          </td>
          <td>{{ p.paineis.length }}</td>
          <td>{{ p.pessoas.length }}</td>
          <td>{{ p.ativo ? "Ativo" : "Inativo" }}</td>
          <td style="white-space: nowrap; text-align: right">
            <router-link
              v-if="perm?.CadastroGrupoPaineis?.editar"
              :to="`/paineis-grupos/${p.id}`"
              class="tprimary"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
            </router-link>
          </td>
        </tr>
        <tz>
          <td colspan="66">
            <table
              v-if="p.paineis.length"
              class="tablemain fix mb2"
            >
              <thead>
                <tr>
                  <th style="width: 65%">
                    Painéis relacionados
                  </th>
                  <th style="width: 25%">
                    Status
                  </th>
                  <th style="width: 10%" />
                </tr>
              </thead>
              <tr v-for="pp in p.paineis">
                <td>{{ pp.nome }}</td>
                <td>{{ pp.ativo ? "Ativo" : "Inativo" }}</td>
                <td style="white-space: nowrap; text-align: right">
                  <router-link
                    v-if="perm?.CadastroPainel?.editar"
                    :to="`/paineis/${pp.id}`"
                    class="tprimary"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_edit" /></svg>
                  </router-link>
                </td>
              </tr>
            </table>

            <table
              v-if="p.paineis.length"
              class="tablemain fix mb2"
            >
              <thead>
                <tr>
                  <th style="width: 90%">
                    Usuários relacionados
                  </th>
                  <th style="width: 10%" />
                </tr>
              </thead>
              <tr v-for="pp in p.pessoas">
                <td>{{ pp.nome_exibicao }}</td>
                <td style="white-space: nowrap; text-align: right">
                  <router-link
                    v-if="perm?.CadastroPessoa?.editar"
                    :to="`/usuarios/editar/${pp.id}`"
                    class="tprimary"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_edit" /></svg>
                  </router-link>
                </td>
              </tr>
            </table>
          </td>
        </tz>
      </template>
    </template>
    <tr v-else-if="itemsFiltered.loading">
      <td colspan="54">
        Carregando
      </td>
    </tr>
    <tr v-else-if="itemsFiltered.error">
      <td colspan="54">
        Error: {{ itemsFiltered.error }}
      </td>
    </tr>
    <tr v-else>
      <td colspan="54">
        Nenhum resultado encontrado.
      </td>
    </tr>
  </table>
</template>
