<script setup>
import { storeToRefs } from 'pinia';
import {
  defineOptions,
  onMounted, reactive, ref, watch,
} from 'vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import truncate from '@/helpers/truncate';
import { useAuthStore } from '@/stores/auth.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useTagsStore } from '@/stores/tags.store';
import AddEditMacrotemas from '@/views/pdm/AddEditMacrotemas.vue';
import AddEditSubtemas from '@/views/pdm/AddEditSubtemas.vue';
import AddEditTags from '@/views/pdm/AddEditTags.vue';
import AddEditTemas from '@/views/pdm/AddEditTemas.vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
defineOptions({
  inheritAttrs: false,
});

const editModalStore = useEditModalStore();

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const props = defineProps(['group', 'type', 'parentPage']);

const MetasStore = useMetasStore();
const ÓrgãosStore = useOrgansStore();
const TagsStore = useTagsStore();
const { activePdm, groupedMetas } = storeToRefs(MetasStore);

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
}

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

onMounted(() => { start(); });

watch(() => props.group, (novoValor) => {
  if (novoValor === 'macrotemas') editModalStore.modal(AddEditMacrotemas, props);
  if (novoValor === 'subtemas') editModalStore.modal(AddEditSubtemas, props);
  if (novoValor === 'temas') editModalStore.modal(AddEditTemas, props);
  if (novoValor === 'tags') editModalStore.modal(AddEditTags, props);
}, { immediate: true });
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <header class="flex spacebetween center mb2 g2">
    <slot name="icone" />

    <TítuloDePágina
      :ícone="$props.icone"
      :título="activePdm.nome"
    />

    <hr class="f1">

    <SmaeLink
      v-if="temPermissãoPara('CadastroMetaPS.administrador_no_pdm') && activePdm?.pode_editar"
      class="btn big"
      to="/metas/novo"
    >
      Nova Meta
    </SmaeLink>

    <div
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMacroTema.inserir',
        'CadastroTema.inserir',
        'CadastroSubTema.inserir',
        'CadastroTag.inserir',
      ])"
      class="dropbtn"
    >
      <span class="btn">Adicionar</span>
      <ul>
        <li
          v-if="temPermissãoPara([
            'CadastroMeta.administrador_no_pdm',
          ])"
        >
          <SmaeLink
            to="/metas/novo"
          >
            Nova Meta
          </SmaeLink>
        </li>
        <li
          v-if="temPermissãoPara([
            'CadastroMacroTema.inserir',
          ]) && activePdm.possui_macro_tema"
        >
          <SmaeLink
            to="/metas/macrotemas/novo"
          >
            {{ activePdm.rotulo_macro_tema ?? 'Macrotema' }}
          </SmaeLink>
        </li>
        <li
          v-if="temPermissãoPara([
            'CadastroTema.inserir',
          ]) && activePdm.possui_tema"
        >
          <SmaeLink
            to="/metas/temas/novo"
          >
            {{ activePdm.rotulo_tema ?? 'Tema' }}
          </SmaeLink>
        </li>
        <li
          v-if="temPermissãoPara([
            'CadastroSubTema.inserir',
          ]) && activePdm.possui_sub_tema"
        >
          <SmaeLink
            to="/metas/subtemas/novo"
          >
            {{ activePdm.rotulo_sub_tema ?? 'Subtema' }}
          </SmaeLink>
        </li>
        <li
          v-if="temPermissãoPara([
            'CadastroTag.inserir',
          ])"
        >
          <SmaeLink
            to="/metas/tags/novo"
          >
            Tag
          </SmaeLink>
        </li>
      </ul>
    </div>
  </header>

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
        <template v-if="Array.isArray(TagsStore.tagsPorPlano?.[activePdm.id])">
          <option
            v-for="item in TagsStore.tagsPorPlano[activePdm.id]"
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
          </SmaeLink>
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
              <SmaeLink
                :to="{
                  name: `.meta`,
                  params: { meta_id: m.id }
                }"
                class="flex center f1"
              >
                <div class="farol" />
                <div class="t13">
                  Meta {{ m.codigo }} - {{ m.titulo }}
                </div>
              </SmaeLink>
              <SmaeLink
                v-if="temPermissãoPara([
                  'CadastroMeta.administrador_no_pdm',
                  'CadastroMetaPs.administrador_no_pdm'
                ])"
                :to="{
                  name: '.editarMeta',
                  params: { meta_id: m.id }
                }"
                class="ml1 tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </SmaeLink>
            </li>
          </ul>
          <hr class="mt1 mb1">
          <SmaeLink
            v-if="temPermissãoPara([
              'CadastroMeta.administrador_no_pdm',
              'CadastroMetaPs.administrador_no_pdm'
            ])
              && filters.groupBy != 'todas'"
            :to="`/metas/${groupSlug(filters.groupBy)}/${item.id}/novo`"
            class="addlink"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg> <span>Adicionar meta</span>
          </SmaeLink>
          <SmaeLink
            v-else-if="temPermissãoPara([
              'CadastroMeta.administrador_no_pdm',
              'CadastroMetaPs.administrador_no_pdm'
            ])"
            :to="`/metas/novo`"
            class="addlink"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg> <span>Adicionar meta</span>
          </SmaeLink>
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
</template>
