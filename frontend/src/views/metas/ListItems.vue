<script setup>
import { storeToRefs } from 'pinia';
import {
  computed,
  defineOptions,
  onMounted, watch,
} from 'vue';
import { useRoute } from 'vue-router';

import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import FiltroMetasListaSchema from '@/consts/formSchemas/metasLista';
import truncate from '@/helpers/texto/truncate';
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
const route = useRoute();

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const props = defineProps(['group', 'type', 'parentPage']);

const MetasStore = useMetasStore();
const ÓrgãosStore = useOrgansStore();
const TagsStore = useTagsStore();
const { activePdm, groupedMetas } = storeToRefs(MetasStore);

const valoresIniciais = {
  group_by: localStorage.getItem('groupBy') ?? 'macro_tema',
};

const groupBy = computed(() => route.query.group_by ?? valoresIniciais.group_by);

const opcoesGroupBy = computed(() => {
  const opcoes = [];
  if (activePdm.value?.possui_macro_tema) {
    opcoes.push({ id: 'macro_tema', label: activePdm.value?.rotulo_macro_tema ?? 'Macrotema' });
  }
  if (activePdm.value?.possui_tema) {
    opcoes.push({ id: 'tema', label: activePdm.value?.rotulo_tema ?? 'Tema' });
  }
  if (activePdm.value?.possui_sub_tema) {
    opcoes.push({ id: 'sub_tema', label: activePdm.value?.rotulo_sub_tema ?? 'Subtema' });
  }
  opcoes.push({ id: 'todas', label: 'Todas as metas' });
  return opcoes;
});

const opcoesOrgaos = computed(() => ÓrgãosStore.órgãosComoLista.map((item) => ({
  id: item.id,
  label: `${item.sigla} - ${truncate(item.descricao, 36)}`,
})));

const opcoesTags = computed(() => (TagsStore.tagsPorPlano?.[activePdm.value?.id] ?? [])
  .map((item) => ({
    id: item.id,
    label: truncate(item.descricao, 36),
  })));

const camposDeFiltro = computed(() => [
  {
    campos: {
      group_by: { tipo: 'select', opcoes: opcoesGroupBy.value },
      orgao_id: {
        tipo: 'autocomplete',
        opcoes: opcoesOrgaos.value,
        autocomplete: { label: 'label', unique: true },
      },
      tag_id: { tipo: 'select', opcoes: opcoesTags.value },
    },
  },
]);

function filterItems() {
  const params = {
    groupBy: route.query.group_by ?? valoresIniciais.group_by,
    órgãoId: Number(route.query.orgao_id) || 0,
    tagId: Number(route.query.tag_id) || 0,
  };
  MetasStore.filterMetas(params);
  localStorage.setItem('groupBy', params.groupBy);
}
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

onMounted(() => {
  start();
  filterItems();
});

watch(
  () => [route.query.group_by, route.query.orgao_id, route.query.tag_id],
  filterItems,
);

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
      v-if="temPermissãoPara([
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm'
      ]) && activePdm?.pode_editar"
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

  <FiltroParaPagina
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="FiltroMetasListaSchema"
    :valores-iniciais="valoresIniciais"
    auto-submit
    @filtro="filterItems"
  />

  <div class="boards">
    <template v-if="groupedMetas.length">
      <div class="flex flexwrap g2">
        <div
          v-for="item in groupedMetas"
          :key="item.id"
          class="board"
        >
          <SmaeLink
            v-if="groupBy != 'todas' && item?.id"
            :to="`/metas/${groupSlug(groupBy)}/${item.id}`"
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
                :to="
                  $route.meta.entidadeMãe === 'pdm'
                    ? `/metas/${m.id}` : {
                      name: `.meta`,
                      params: { meta_id: m.id }
                    }
                "
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
                :to="
                  $route.meta.entidadeMãe === 'pdm' ?
                    `/metas/editar/${m.id}` : {
                      name: '.editarMeta',
                      params: { meta_id: m.id }
                    }
                "
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
              && groupBy != 'todas'"
            :to="`/metas/${groupSlug(groupBy)}/${item.id}/novo`"
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
    <template v-else-if="groupedMetas.loading">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <template v-else-if="groupedMetas.error">
      <div class="error p1">
        <p class="error-msg">
          Error: {{ groupedMetas.error }}
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
