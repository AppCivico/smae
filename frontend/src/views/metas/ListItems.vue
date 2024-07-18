<script setup>
import { Dashboard } from '@/components';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import truncate from '@/helpers/truncate';
import { useAuthStore } from '@/stores/auth.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTagsStore } from '@/stores/tags.store';
import { default as AddEditMacrotemas } from '@/views/pdm/AddEditMacrotemas.vue';
import { default as AddEditSubtemas } from '@/views/pdm/AddEditSubtemas.vue';
import { default as AddEditTags } from '@/views/pdm/AddEditTags.vue';
import { default as AddEditTemas } from '@/views/pdm/AddEditTemas.vue';
import { storeToRefs } from 'pinia';
import {
  onMounted, onUpdated, reactive, ref,
} from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();

const { temPermissãoPara } = useAuthStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const props = defineProps(['group', 'type', 'parentPage']);

const MetasStore = useMetasStore();
const ÓrgãosStore = useOrgansStore();
const TagsStore = useTagsStore();
const { activePdm, groupedMetas } = storeToRefs(MetasStore);
MetasStore.getPdM();

const filters = reactive({
  groupBy: localStorage.getItem('groupBy') ?? 'macro_tema',
  filteredId: '',
});
const itemsFiltered = ref(groupedMetas);

function filterItems() {
  MetasStore.filterMetas(filters);
  localStorage.setItem('groupBy', filters.groupBy);
}
filterItems();
function start() {
  ÓrgãosStore.getAll();
  TagsStore.getAll();

  if (props.group == 'macrotemas') editModalStore.modal(AddEditMacrotemas, props);
  if (props.group == 'subtemas') editModalStore.modal(AddEditSubtemas, props);
  if (props.group == 'temas') editModalStore.modal(AddEditTemas, props);
  if (props.group == 'tags') editModalStore.modal(AddEditTags, props);
}
onMounted(() => { start(); });
onUpdated(() => { start(); });
function groupSlug(s) {
  let r;
  switch (s) {
    case 'macro_tema': r = 'macrotemas'; break;
    case 'tema': r = 'temas'; break;
    case 'sub_tema': r = 'subtemas'; break;
    default: r = s;
  }
  return r;
}
</script>
<template>
  <Dashboard>
    <MigalhasDeMetas class="mb1" />

    <div class="flex spacebetween center mb2">
      <img
        v-if="activePdm.logo"
        :src="`${baseUrl}/download/${activePdm.logo}?inline=true`"
        width="100"
        class="ib mr1"
      >
      <h1 v-else>
        {{ activePdm.nome }}
      </h1>
      <hr class="ml2 f1">
      <div
        v-if="temPermissãoPara([
          'CadastroMeta.inserir',
          'CadastroMacroTema.inserir',
          'CadastroTema.inserir',
          'CadastroSubTema.inserir',
          'CadastroTag.inserir'
        ])"
        class="ml2 dropbtn"
      >
        <span class="btn">Adicionar</span>
        <ul>
          <li v-if="perm?.CadastroMeta?.inserir">
            <router-link
              to="/metas/novo"
            >
              Nova Meta
            </router-link>
          </li>
          <li v-if="perm?.CadastroMacroTema?.inserir && activePdm.possui_macro_tema">
            <router-link
              to="/metas/macrotemas/novo"
            >
              {{ activePdm.rotulo_macro_tema ?? 'Macrotema' }}
            </router-link>
          </li>
          <li v-if="perm?.CadastroTema?.inserir && activePdm.possui_tema">
            <router-link
              to="/metas/temas/novo"
            >
              {{ activePdm.rotulo_tema ?? 'Tema' }}
            </router-link>
          </li>
          <li v-if="perm?.CadastroSubTema?.inserir && activePdm.possui_sub_tema">
            <router-link
              to="/metas/subtemas/novo"
            >
              {{ activePdm.rotulo_sub_tema ?? 'Subtema' }}
            </router-link>
          </li>
          <li v-if="perm?.CadastroTag?.inserir">
            <router-link
              to="/metas/tags/novo"
            >
              Tag
            </router-link>
          </li>
        </ul>
      </div>
    </div>
    <div class="flex center mb2">
      <div class="f1 mr1">
        <label class="label tc300">Agrupar por</label>
        <select
          v-model="filters.groupBy"
          class="inputtext"
          @change="filterItems"
        >
          <option
            v-if="activePdm.possui_macro_tema"
            :selected="filters.groupBy == 'macro_tema'"
            value="macro_tema"
          >
            {{ activePdm.rotulo_macro_tema ?? 'Macrotema' }}
          </option>
          <option
            v-if="activePdm.possui_tema"
            :selected="filters.groupBy == 'tema'"
            value="tema"
          >
            {{ activePdm.rotulo_tema ?? 'Tema' }}
          </option>
          <option
            v-if="activePdm.possui_sub_tema"
            :selected="filters.groupBy == 'sub_tema'"
            value="sub_tema"
          >
            {{ activePdm.rotulo_sub_tema ?? 'Subtema' }}
          </option>
          <option
            :selected="filters.groupBy == 'todas'"
            value="todas"
          >
            Todas as metas
          </option>
        </select>
      </div>
      <div class="f1 mr1">
        <label class="label tc300">Filtrar por órgão</label>
        <select
          v-model.number="filters.órgãoId"
          class="inputtext"
          @change="filterItems"
        >
          <option :value="0" />

          <option
            v-for="item in ÓrgãosStore.órgãosComoLista"
            :key="item.id"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </select>
      </div>
      <div class="f1 mr1">
        <label class="label tc300">Filtrar por tag</label>
        <select
          v-model.number="filters.tagId"
          class="inputtext"
          @change="filterItems"
        >
          <option :value="0" />
          <template v-if="Array.isArray(TagsStore.Tags)">
            <option
              v-for="item in TagsStore.Tags"
              :key="item.id"
              :value="item.id"
              :title="item.descricao?.length > 36 ? item.descricao : null"
            >
              {{ truncate(item.descricao, 36) }}
            </option>
          </template>
        </select>
      </div>
      <hr class="f2 ml1">
    </div>

    <div class="boards">
      <template v-if="itemsFiltered.length">
        <div class="flex flexwrap g2">
          <div
            v-for="item in itemsFiltered"
            :key="item.id"
            class="board"
          >
            <SmaeLink
              v-if="filters.groupBy != 'todas' && item?.id"
              :to="`/metas/${groupSlug(filters.groupBy)}/${item.id}`"
            >
              <h2>{{ item.descricao }}</h2>
            </router-link>
            <h2 v-else>
              {{ item.descricao }}
            </h2>

            <div class="t11 tc300 mb2">
              {{ item.children.length }} meta(s)
            </div>
            <ul class="metas">
              <li
                v-for="m in item.children"
                :key="m.id"
                class="meta flex center mb1"
              >
                <router-link
                  :to="`/metas/${m.id}`"
                  class="flex center f1"
                >
                  <div class="farol" />
                  <div class="t13">
                    Meta {{ m.codigo }} - {{ m.titulo }}
                  </div>
                </router-link>
                <router-link
                  v-if="perm?.CadastroMeta?.editar"
                  :to="`/metas/editar/${m.id}`"
                  class="ml1 tprimary"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </router-link>
              </li>
            </ul>
            <hr class="mt1 mb1">
            <SmaeLink
              v-if="perm?.CadastroMeta?.inserir && filters.groupBy != 'todas'"
              :to="`/metas/${groupSlug(filters.groupBy)}/${item.id}/novo`"
              class="addlink"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg> <span>Adicionar meta</span>
            </router-link>
            <router-link
              v-else-if="perm?.CadastroMeta?.inserir"
              :to="`/metas/novo`"
              class="addlink"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg> <span>Adicionar meta</span>
            </router-link>
          </div>
        </div>
      </template>
      <template v-else-if="itemsFiltered.loading">
        <div class="p1">
          <span>Carregando</span> <svg
            class="ml1 ib"
            width="20"
            height="20"
          ><use xlink:href="#i_spin" /></svg>
        </div>
      </template>
      <template v-else-if="itemsFiltered.error">
        <div class="error p1">
          <p class="error-msg">
            Error: {{ itemsFiltered.error }}
          </p>
        </div>
      </template>
      <template v-else>
        <div class="error p1">
          <p class="error-msg">
            Nenhum item encontrado.
          </p>
        </div>
      </template>
    </div>
  </Dashboard>
</template>
