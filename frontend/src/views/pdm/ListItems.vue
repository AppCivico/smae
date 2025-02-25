<script setup>
import {
  onMounted,
  onUpdated,
  reactive,
  ref,
} from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import {
  useAlertStore,
  useAuthStore,
  useEditModalStore,
  usePdMStore,
} from '@/stores';
import { default as AddEditArquivos } from '@/views/pdm/AddEditArquivos.vue';
import { default as AddEditMacrotemas } from '@/views/pdm/AddEditMacrotemas.vue';
import { default as AddEditSubtemas } from '@/views/pdm/AddEditSubtemas.vue';
import { default as AddEditTags } from '@/views/pdm/AddEditTags.vue';
import { default as AddEditTemas } from '@/views/pdm/AddEditTemas.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const alertStore = useAlertStore();
const editModalStore = useEditModalStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const props = defineProps(['group', 'type', 'parentPage']);

const PdMStore = usePdMStore();
const { tempPdM, arquivos } = storeToRefs(PdMStore);
PdMStore.filterPdM();

const filters = reactive({
  textualSearch: '',
});
const itemsFiltered = ref(tempPdM);

function filterItems() {
  PdMStore.filterPdM(filters);
}
function toggleAccordeon(t) {
  t.target.closest('.tzaccordeon').classList.toggle('active');
}
function start() {
  if (props.group === 'macrotemas') editModalStore.modal(AddEditMacrotemas, props);
  if (props.group === 'subtemas') editModalStore.modal(AddEditSubtemas, props);
  if (props.group === 'temas') editModalStore.modal(AddEditTemas, props);
  if (props.group === 'tags') editModalStore.modal(AddEditTags, props);
  if (props.group === 'arquivos') editModalStore.modal(AddEditArquivos, props);
}
onMounted(() => { start(); });
onUpdated(() => { start(); });
function deleteArquivo(pdmid, id) {
  alertStore.confirmAction('Deseja remover o arquivo?', () => {
    PdMStore.deleteArquivo(pdmid, id);
  }, 'Remover');
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Programa de Metas</h1>
      <hr class="ml2 f1">
      <router-link
        v-if="perm?.CadastroPdm?.inserir"
        :to="{ name: 'novoPdm' }"
        class="btn big ml2"
      >
        Novo PdM
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
          <th style="width: 35%">
            Nome
          </th>
          <th style="width: 35%">
            Descrição
          </th>
          <th style="width: 15%">
            Prefeito
          </th>
          <th style="width: 10%">
            Ativo
          </th>
          <th style="width: 82px" />
        </tr>
      </thead>
      <tbody>
        <template v-if="itemsFiltered.length">
          <template
            v-for="item in itemsFiltered"
            :key="item.id"
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
                  ><use xlink:href="#i_down" /></svg><span>{{ item.nome }}</span>
                </div>
              </td>
              <td>{{ item.descricao }}</td>
              <td>{{ item.prefeito }}</td>
              <td>{{ item.ativo ? 'Sim' : 'Não' }}</td>
              <td class="tr">
                <SmaeLink
                  class="tprimary mr1 tipinfo left"
                  :to="{
                    name: 'pdm.permissoes-orcamento',
                    params: {
                      pdm_id: item.id
                    }
                  }"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_calendar" /></svg>
                  <div>Permissões para edições no orçamento</div>
                </SmaeLink>

                <SmaeLink
                  class="tprimary tipinfo"
                  :to="{
                    name: 'editarPdm',
                    params: {
                      pdm_id: item.id
                    }
                  }"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg><div>Editar</div>
                </SmaeLink>
              </td>
            </tr>
            <tz>
              <td
                colspan="56"
                style="padding-left: 2rem;"
              >
                <router-link
                  v-if="item.ativo"
                  :to="`/metas`"
                  class="tlink"
                >
                  <span>Visualizar programa de metas ativo</span> <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_link" /></svg>
                </router-link>
                <template v-if="item.possui_macro_tema">
                  <table class="tablemain mb1">
                    <thead>
                      <tr>
                        <th style="width: 90%">
                          {{ item.rotulo_macro_tema ?? 'Macrotema' }}
                        </th>
                        <th style="width: 10%" />
                      </tr>
                    </thead>
                    <tbody>
                      <template
                        v-for="subitem in item.macrotemas"
                        :key="subitem.id"
                      >
                        <tr>
                          <td>{{ subitem.descricao }}</td>
                          <td style="white-space: nowrap; text-align: right;">
                            <template v-if="perm?.CadastroMacroTema?.editar">
                              <router-link
                                :to="{
                                  name: 'editarMacroTemaEmPdm',
                                  params: {
                                    pdm_id: item.id,
                                    id: subitem.id
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
                    v-if="perm?.CadastroMacroTema?.inserir"
                    :to="{
                      name: 'criarMacroTemaEmPdm',
                      params: {
                        pdm_id: item.id
                      }
                    }"
                    class="addlink mb2"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_+" /></svg>
                    <span>Adicionar {{ item.rotulo_macro_tema ?? 'Macrotema' }}</span>
                  </router-link>
                  <br>
                </template>
                <template v-if="item.possui_tema">
                  <table class="tablemain mb1">
                    <thead>
                      <tr>
                        <th style="width: 90%">
                          {{ item.rotulo_tema ?? "Tema" }}
                        </th>
                        <th style="width: 10%" />
                      </tr>
                    </thead>
                    <tbody>
                      <template
                        v-for="subitem in item.temas"
                        :key="subitem.id"
                      >
                        <tr>
                          <td>{{ subitem.descricao }}</td>
                          <td style="white-space: nowrap; text-align: right;">
                            <template v-if="perm?.CadastroTema?.editar">
                              <router-link
                                :to="{
                                  name: 'editarTemaEmPdm',
                                  params: {
                                    pdm_id: item.id,
                                    id: subitem.id,
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
                    v-if="perm?.CadastroTema?.inserir"
                    :to="{
                      name: 'criarTemaEmPdm',
                      params: {
                        pdm_id: item.id
                      }
                    }"
                    class="addlink mb2"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_+" /></svg>
                    <span>Adicionar {{ item.rotulo_tema ?? "Tema" }}</span>
                  </router-link>
                  <br>
                </template>
                <template v-if="item.possui_sub_tema">
                  <table class="tablemain mb1">
                    <thead>
                      <tr>
                        <th style="width: 90%">
                          {{ item.rotulo_sub_tema ?? "Subtema" }}
                        </th>
                        <th style="width: 10%" />
                      </tr>
                    </thead>
                    <tbody>
                      <template
                        v-for="subitem in item.subtemas"
                        :key="subitem.id"
                      >
                        <tr>
                          <td>{{ subitem.descricao }}</td>
                          <td style="white-space: nowrap; text-align: right;">
                            <template v-if="perm?.CadastroSubTema?.editar">
                              <router-link
                                :to="{
                                  name: 'editarSubtemaEmPdm',
                                  params: {
                                    pdm_id: item.id,
                                    id: subitem.id,
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
                    v-if="perm?.CadastroSubTema?.inserir"
                    :to="{
                      name: 'criarSubtemaEmPdm',
                      params: {
                        pdm_id: item.id
                      }
                    }"
                    class="addlink mb2"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_+" /></svg>
                    <span>Adicionar {{ item.rotulo_sub_tema ?? "Subtema" }}</span>
                  </router-link>
                  <br>
                </template>

                <table class="tablemain mb1">
                  <thead>
                    <tr>
                      <th style="width: 40%">
                        Tag
                      </th>
                      <th style="width: 30%">
                        Categoria
                      </th>
                      <th style="width: 30%">
                        Icone
                      </th>
                      <th style="width: 10%" />
                    </tr>
                  </thead>
                  <tbody>
                    <template
                      v-for="subitem in item.tags"
                      :key="subitem.id"
                    >
                      <tr>
                        <td>{{ subitem.descricao }}</td>
                        <td>{{ subitem.ods.titulo }}</td>
                        <td>
                          <a
                            v-if="subitem.icone"
                            :href="baseUrl + '/download/' + subitem?.icone"
                            download
                          >
                            <img
                              :src="`${baseUrl}/download/${subitem.icone}?inline=true`"
                              width="15"
                              class="ib mr1"
                            >
                          </a>
                        </td>
                        <td style="white-space: nowrap; text-align: right;">
                          <template v-if="perm?.CadastroTag?.editar">
                            <router-link
                              :to="{
                                name: 'editarTagEmPdm',
                                params: {
                                  pdm_id: item.id,
                                  id: subitem.id
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
                  v-if="perm?.CadastroTag?.inserir"
                  :to="{
                    name: 'criarTagEmPdm',
                    params: {
                      pdm_id: item.id
                    }
                  }"
                  class="addlink mb1"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_+" /></svg> <span>Adicionar Tag</span>
                </router-link>

                <table class="tablemain mb1">
                  <thead>
                    <tr>
                      <th style="width: 30%">
                        Arquivos
                      </th>
                      <th style="width: 60%">
                        Descrição
                      </th>
                      <th style="width: 10%" />
                    </tr>
                  </thead>
                  <tbody>
                    <template
                      v-for="subitem in arquivos[item.id]"
                      :key="subitem.id"
                    >
                      <tr>
                        <td>
                          <a
                            :href="baseUrl + '/download/' + subitem?.arquivo?.download_token"
                            download
                          >{{ subitem?.arquivo?.nome_original ?? '-' }}</a>
                        </td>
                        <td>
                          <a
                            :href="baseUrl + '/download/' + subitem?.arquivo?.download_token"
                            download
                          >{{ subitem?.descricao ?? '-' }}</a>
                        </td>
                        <td style="white-space: nowrap; text-align: right;">
                          <a
                            v-if="perm?.CadastroPdm?.editar"
                            class="tprimary"
                            @click="deleteArquivo(item.id, subitem.id)"
                          ><svg
                            width="20"
                            height="20"
                          ><use xlink:href="#i_remove" /></svg></a>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
                <router-link
                  v-if="perm?.CadastroPdm?.editar"
                  :to="{
                    name: 'novoArquivoEmPdm',
                    params: {
                      pdm_id: item.id
                    }
                  }"
                  class="addlink mb1"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_+" /></svg> <span>Adicionar arquivo</span>
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
  </Dashboard>
</template>
