<script setup>
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useAlertStore, useEditModalStore, useVariaveisStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();

const { indicador_id } = route.params;
const { var_id } = route.params;

const currentEdit = route.path.slice(0, route.path.indexOf('/variaveis'));

const VariaveisStore = useVariaveisStore();
const { singleVariaveis, Valores } = storeToRefs(VariaveisStore);
VariaveisStore.clearEdit();
VariaveisStore.getById(indicador_id, var_id);

const Previsto = ref(null);
const PrevistoAcumulado = ref(null);
const decimais = ref(0);
(async () => {
  await VariaveisStore.getValores(var_id);
  Previsto.value = Valores.value[var_id]?.ordem_series.indexOf('Previsto');
  PrevistoAcumulado.value = Valores.value[var_id]?.ordem_series.indexOf('PrevistoAcumulado');
  decimais.value = Valores.value[var_id]?.variavel?.casas_decimais ?? 0;
})();

async function onSubmit(el) {
  event.preventDefault();
  event.stopPropagation();
  try {
    let msg;
    let r;
    const values = { valores: [] };
    el.target.querySelectorAll('[name]').forEach((x) => {
      values.valores.push({
        referencia: x.name,
        valor: !isNaN(parseFloat(x.value)) ? String(parseFloat(x.value.replace(',', '.'))) : '',
      });
    });

    if (var_id) {
      r = await VariaveisStore.updateValores(values);
      if (r) {
        msg = 'Valores salvos com sucesso!';
        VariaveisStore.getValores(var_id);
        alertStore.success(msg);
        editModalStore.clear();
        router.push(`${currentEdit}`);
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.clear();
    alertStore.clear();
  });
}
function acumular(a, j) {
  if (!a.length) return;
  let s = 0;
  for (let i = 0; i <= j; i += 1) {
    const x = a[i].series[Previsto.value]?.valor_nominal ?? '0';
    const n = !isNaN(parseFloat(x)) ? parseFloat(x.replace(',', '.')) : 0;
    if (n) s += n;
  }
  return s.toFixed(decimais.value);
}
function soma(a, j) {
  const x = event.target.value;
  a[j].series[Previsto.value].valor_nominal = x;
}
function nestLinhas(l) {
  const a = {};
  l.forEach((x) => {
    if (!a[x.agrupador]) a[x.agrupador] = [];
    a[x.agrupador].push(x);
  });
  return Object.entries(a);
}
function openParent(e) {
  e.target.closest('.accordeon').classList.toggle('active');
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>Editar valores</h2>
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
  <template v-if="!(Valores[var_id]?.loading || Valores[var_id]?.error) && var_id">
    <div class="label">
      Valores previstos e previstos acumulados para cada período <span class="tvermelho">*</span>
    </div>
    <hr class="mb2">
    <form @submit="onSubmit">
      <div v-if="Valores[var_id]?.linhas">
        <div
          v-for="k in nestLinhas(Valores[var_id].linhas)"
          :key="k[0]"
          class="accordeon"
        >
          <div
            class="flex center mb1"
            @click="openParent"
          >
            <span class="t0"><svg
              class="arrow"
              width="13"
              height="8"
            ><use xlink:href="#i_down" /></svg></span>
            <span class="w700">{{ k[0] }}</span>
          </div>
          <div class="content">
            <div class="flex g2">
              <div class="f1">
                <label class="label tc300">Previsto</label>
              </div>
              <div class="f1">
                <label class="label tc300">Previsto Acumulado</label>
              </div>
            </div>
            <div
              v-for="(v,i) in k[1]"
              :key="i"
              class="flex g2"
            >
              <div class="f1">
                <label class="label">{{ v.periodo }}</label>
                <input
                  type="number"
                  :step="'0'+(decimais? '.'+('0'.repeat(decimais-1))+'1' : '')"
                  :name="v.series[Previsto]?.referencia"
                  :value="v.series[Previsto]?.valor_nominal"
                  class="inputtext light mb1"
                  @input="singleVariaveis.acumulativa&&soma(k[1],i)"
                >
              </div>
              <div class="f1">
                <label class="label">Acumulado {{ v.periodo }}</label>
                <input
                  type="number"
                  :step="'0'+(decimais? '.'+('0'.repeat(decimais-1))+'1' : '')"
                  :name="v.series[PrevistoAcumulado]?.referencia"
                  :value="singleVariaveis.acumulativa
                    ? acumular(k[1],i)
                    : v.series[PrevistoAcumulado]?.valor_nominal"
                  :disabled="singleVariaveis.acumulativa"
                  class="inputtext light mb1"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex spacebetween center mb2 mt2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </template>
  <template v-if="Valores[var_id]?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="Valores[var_id]?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ Valores[var_id].error }}
      </div>
    </div>
  </template>
</template>
