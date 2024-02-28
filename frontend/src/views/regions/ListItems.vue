<script setup>
import { useAuthStore, useEditModalStore, useRegionsStore } from '@/stores';
import { default as AddEditRegions } from '@/views/regions/AddEdit.vue';
import { storeToRefs } from 'pinia';
import {
  onMounted, onUpdated, reactive, ref,
} from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const editModalStore = useEditModalStore();
const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const RegionsStore = useRegionsStore();
const { tempRegions, regions } = storeToRefs(RegionsStore);
RegionsStore.filterRegions();

const props = defineProps(['type']);

const filters = reactive({
  textualSearch: '',
});
const itemsFiltered = ref(tempRegions);

function filterItems() {
  RegionsStore.filterRegions(filters);
}
function toggleAccordeon(t) {
  t.target.closest('.tzaccordeon').classList.toggle('active');
}
function start() {
  if (props.type) {
    editModalStore.modal(AddEditRegions, props, 'tamarelo');
  }
}
onMounted(() => { start(); });
onUpdated(() => { start(); });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Regiões, Subprefeituras e Distritos</h1>
    <hr class="ml2 f1">

    <router-link
      v-if="perm?.CadastroRegiao?.inserir && Array.isArray(regions) && !regions.length"
      :to="{
        name: 'novaRegião'
      }"
      class="btn big ml2"
    >
      Novo Município
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

  <table class="tablemain">
    <thead>
      <tr>
        <th style="width: 45%">
          Município
        </th>
        <th style="width: 45%">
          Shapefile
        </th>
        <th style="width: 10%" />
      </tr>
    </thead>
    <tbody>
      <template v-if="itemsFiltered.length">
        <template
          v-for="item in itemsFiltered"
          :key="item.id"
        >
          <tr class="tzaccordeon active">
            <td><span>{{ item.descricao }}</span></td>
            <td>
              <a
                v-if="item.shapefile"
                :href="baseUrl + '/download/' + item.shapefile"
                download
              >Download</a>
            </td>
            <td style="white-space: nowrap; text-align: right;">
              <template v-if="perm?.CadastroRegiao?.editar">
                <router-link
                  :to="{
                    name: 'editarRegião',
                    params: {
                      id: item.id
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
          <tz>
            <td colspan="56">
              <table
                v-if="item.children.length"
                class="tablemain mb1"
              >
                <thead>
                  <tr>
                    <th style="width: 45%">
                      Região
                    </th>
                    <th style="width: 45%">
                      Shapefile
                    </th>
                    <th style="width: 10%" />
                  </tr>
                </thead>
                <tbody>
                  <template
                    v-for="item2 in item.children"
                    :key="item2.id"
                  >
                    <tr
                      class="tzaccordeon"
                      @click="toggleAccordeon"
                    >
                      <td>
                        <svg
                          class="arrow"
                          width="13"
                          height="8"
                        ><use xlink:href="#i_down" /></svg> <span>{{ item2.descricao }}</span>
                      </td>
                      <td>
                        <a
                          v-if="item2.shapefile"
                          :href="baseUrl + '/download/' + item2.shapefile"
                          download
                        >Download</a>
                      </td>
                      <td style="white-space: nowrap; text-align: right;">
                        <template v-if="perm?.CadastroRegiao?.editar">
                          <router-link
                            :to="{
                              name: 'editarRegião2',
                              params: {
                                id: item.id,
                                id2: item2.id,
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
                    <tz>
                      <td colspan="56">
                        <table
                          v-if="item2.children.length"
                          class="tablemain mb1"
                        >
                          <thead>
                            <tr>
                              <th style="width: 45%">
                                Subprefeitura
                              </th>
                              <th style="width: 45%">
                                Shapefile
                              </th>
                              <th style="width: 10%" />
                            </tr>
                          </thead>
                          <tbody>
                            <template
                              v-for="item3 in item2.children"
                              :key="item3.id"
                            >
                              <tr
                                class="tzaccordeon"
                                @click="toggleAccordeon"
                              >
                                <td>
                                  <svg
                                    class="arrow"
                                    width="13"
                                    height="8"
                                  ><use xlink:href="#i_down" /></svg> <span>{{ item3.descricao }}</span>
                                </td>
                                <td>
                                  <a
                                    v-if="item3.shapefile"
                                    :href="baseUrl + '/download/' + item3.shapefile"
                                    download
                                  >Download</a>
                                </td>
                                <td style="white-space: nowrap; text-align: right;">
                                  <template v-if="perm?.CadastroRegiao?.editar">
                                    <router-link
                                      :to="{
                                        name: 'editarRegião3',
                                        params: {
                                          id: item.id,
                                          id2: item2.id,
                                          id3: item3.id,
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
                              <tz>
                                <td colspan="56">
                                  <table
                                    v-if="item3.children.length"
                                    class="tablemain mb1"
                                  >
                                    <thead>
                                      <tr>
                                        <th style="width: 45%">
                                          Distrito
                                        </th>
                                        <th style="width: 45%">
                                          Shapefile
                                        </th>
                                        <th style="width: 10%" />
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <template
                                        v-for="item4 in item3.children"
                                        :key="item4.id"
                                      >
                                        <tr>
                                          <td><span>{{ item4.descricao }}</span></td>
                                          <td>
                                            <a
                                              v-if="item4.shapefile"
                                              :href="baseUrl + '/download/' + item4.shapefile"
                                              download
                                            >Download</a>
                                          </td>
                                          <td style="white-space: nowrap; text-align: right;">
                                            <template v-if="perm?.CadastroRegiao?.editar">
                                              <router-link
                                                :to="{
                                                  name: 'editarRegião4',
                                                  params: {
                                                    id: item.id,
                                                    id2: item2.id,
                                                    id3: item3.id,
                                                    id4: item4.id,
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
                                    </tbody>
                                  </table>
                                  <router-link
                                    :to="{
                                      name: 'novaRegião3',
                                      params: {
                                        id: item.id,
                                        id2: item2.id,
                                        id3: item3.id,
                                      }
                                    }"
                                    class="addlink"
                                  >
                                    <svg
                                      width="20"
                                      height="20"
                                    ><use xlink:href="#i_+" /></svg> <span>Adicionar distrito</span>
                                  </router-link>
                                </td>
                              </tz>
                            </template>
                          </tbody>
                        </table>
                        <router-link
                          :to="{
                            name: 'novaRegião2',
                            params: {
                              id: item.id,
                              id2: item2.id,
                            }
                          }"
                          class="addlink"
                        >
                          <svg
                            width="20"
                            height="20"
                          ><use xlink:href="#i_+" /></svg> <span>Adicionar Subprefeitura</span>
                        </router-link>
                      </td>
                    </tz>
                  </template>
                </tbody>
              </table>
              <router-link
                :to="{
                  name: 'novaRegião',
                  params: {
                    id: item.id,
                  }
                }"
                class="addlink"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_+" /></svg> <span>Adicionar Região</span>
              </router-link>
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
    </tbody>
  </table>
</template>
