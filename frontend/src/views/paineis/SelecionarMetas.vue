<script setup>
import { router } from '@/router';
import {
  useAlertStore,
  useEditModalStore,
  useMetasStore, usePaineisStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { reactive, ref, unref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { painel_id } = route.params;
const alertStore = useAlertStore();
const editModalStore = useEditModalStore();

const selMetas = ref({});
const selAll = ref(false);

const PaineisStore = usePaineisStore();
const { singlePainel } = storeToRefs(PaineisStore);
(async () => {
  if (singlePainel.id != painel_id) await PaineisStore.getById(painel_id);
  singlePainel?.value?.painel_conteudo.forEach((x) => {
    selMetas.value[x.meta_id] = true;
  });
})();

const MetasStore = useMetasStore();
const { activePdm, tempMetas, groupedMetas } = storeToRefs(MetasStore);
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
function openParent(e) {
  e.target.closest('.accordeon').classList.toggle('active');
}
function selectAll(e) {
  const check = e.target.checked;
  const els = e.target.closest('.group').querySelectorAll('.metasselect .inputcheckbox');
  if (check) {
    tempMetas.value.forEach((x) => selMetas.value[x.id] = true);
  } else {
    selMetas.value = {};
  }
}
function checkSelect(e) {
  if (!e.target.checked) selAll.value = false;
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    router.go(-1);
    editModalStore.clear();
    alertStore.clear();
  });
}
async function submitMetas() {
  try {
    let msg;
    let r;
    const values = {
      metas: Object.keys(unref(selMetas.value)).map((x) => Number(x)).filter((x) => !!x),
    };

    r = await PaineisStore.selectMetas(painel_id, values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      PaineisStore.clear();
      PaineisStore.getById(painel_id);
      await router.push(`/paineis/${painel_id}`);
      editModalStore.clear();
      alertStore.success(msg);
    } else {
      throw r;
    }
  } catch (error) {
    alertStore.error(error);
  }
}

</script>
<template>
  <h2>Selecionar metas do Painel</h2>

  <label class="label tc300">Agrupar por</label>
  <select
    v-model="filters.groupBy"
    class="inputtext"
    @change="filterItems"
  >
    <option
      :selected="filters.groupBy == 'todas'"
      value="todas"
    >
      Todas as metas
    </option>
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
  </select>

  <div
    v-if="itemsFiltered.length"
    class="group"
  >
    <label class="block t14 w400 mb2 mt2"><input
      v-model="selAll"
      type="checkbox"
      class="inputcheckbox"
      @change="selectAll"
    ><span>Selecionar todas as metas</span></label>
    <div
      v-for="item in itemsFiltered"
      :key="item.id"
      class="accordeon metasselect"
    >
      <div
        class="flex"
        @click="openParent"
      >
        <span class="t0"><svg
          class="arrow"
          width="13"
          height="8"
        ><use xlink:href="#i_down" /></svg></span><h4 class="t1">
          {{ item.descricao }}
        </h4>
      </div>
      <ul class="content">
        <li
          v-for="m in item.children"
          :key="m.id"
          class="mb1"
        >
          <label class="t14 w700"><input
            v-model="selMetas[m.id]"
            type="checkbox"
            class="inputcheckbox"
            :value="m.id"
            @change="checkSelect"
          ><span>Meta {{ m.codigo }} - {{ m.titulo }}</span></label>
        </li>
      </ul>
    </div>
    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <a
        class="btn outline bgnone tcprimary"
        @click="checkClose"
      >Cancelar</a>
      <a
        class="btn ml2"
        :disabled="isSubmitting"
        @click="submitMetas"
      >Salvar</a>
      <hr class="ml2 f1">
    </div>
  </div>
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
</template>
