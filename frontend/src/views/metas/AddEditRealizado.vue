<script setup>
import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { storeToRefs } from 'pinia';
import { nextTick, ref, toRaw } from 'vue';
import { useRoute } from 'vue-router';

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

const Realizado = ref(null);
const RealizadoAcumulado = ref(null);
const decimais = ref(0);

const envelopeDeValores = ref(null);
const modoDePreenchimento = ref('valor_nominal'); // ou `valor_acumulado`
const valorPadrão = ref(0);

(async () => {
  await VariaveisStore.getValores(var_id);
  Realizado.value = Valores.value[var_id]?.ordem_series.indexOf('Realizado');
  RealizadoAcumulado.value = Valores.value[var_id]?.ordem_series.indexOf('RealizadoAcumulado');
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
        valor: !isNaN(parseFloat(x.value))
          ? String(parseFloat(x.value.replace(',', '.')))
          : '',
      });
    });

    if (var_id) {
      r = await VariaveisStore.updateValores(values);
      if (r) {
        msg = 'Valores salvos com sucesso!';
        VariaveisStore.getValores(var_id);
        alertStore.success(msg);
        editModalStore.clear();

        if (route.meta.rotaDeEscape) {
          router.push({ name: route.meta.rotaDeEscape });
        } else if (route.meta.entidadeMãe === 'pdm') {
          router.push(`${currentEdit}`);
        } else {
          throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
        }
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
    router.go(-1);
  });
}
function acumular(períodoAComparar, valorDoMês) {
  if (valorDoMês === '') {
    return '';
  }

  let s = Number.parseFloat(singleVariaveis?.value?.valor_base) || 0;

  VariaveisStore.valoresEmFoco.every((x) => {
    const v = x.series[Realizado.value]?.valor_nominal ?? '0';
    const n = !isNaN(parseFloat(v))
      ? parseFloat(String(v).replace(',', '.'))
      : 0;
    if (n) s += n;

    return períodoAComparar !== x.periodo;
  });

  return s.toFixed(decimais.value);
}
async function soma(event, a, j) {
  const x = event.target.value;

  if (modoDePreenchimento.value === 'valor_nominal') {
    a[j].series[Realizado.value].valor_nominal = x;
  } else {
    const acumuladoAnterior = a[j - 1]?.series[RealizadoAcumulado.value];
    const valorDoAcumuladoAnterior = !acumuladoAnterior?.data_valor
      ? 0
      : acumular(acumuladoAnterior.data_valor.substring(0, 7)) || 0;

    a[j].series[Realizado.value].valor_nominal = x - valorDoAcumuladoAnterior;

    // necessário para prevenir o cálculo do acúmulo antes da redefinição do valor
    await nextTick();
    // necessário porque não há reatividade real em uso
    event.target.value = x;
    a[j].series[RealizadoAcumulado.value].valor_nominal = x;
  }
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

function preencherVaziosCom() {
  envelopeDeValores.value.querySelectorAll('[name]').forEach((x) => {
    if (!x.value && !x.disabled) {
      x.closest('.accordeon').classList.add('active');
      x.value = Number(toRaw(valorPadrão.value));
      x.dispatchEvent(new Event('input'));
    }
  });
}

function limparFormulário() {
  envelopeDeValores.value.querySelectorAll('[name]').forEach((x) => {
    if (!x.disabled) {
      x.closest('.accordeon').classList.add('active');
      x.value = '';
      x.dispatchEvent(new Event('input'));
    }
  });
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
      Valores realizados e realizados acumulados para cada período <span class="tvermelho">*</span>
    </div>
    <hr class="mb2">

    <auxiliarDePreenchimento>
      <div class="flex g2 end mb1">
        <div class="f1">
          <label class="label">Valor a aplicar</label>
          <input
            v-model="valorPadrão"
            type="number"
            min="0"
            class="inputtext light mb1"
          >
        </div>
        <button
          type="button"
          class="f0 mb1 btn bgnone outline tcprimary"
          :disabled="valorPadrão === ''"
          @click="preencherVaziosCom"
        >
          Preencher vazios
        </button>

        <button
          type="reset"
          form="form"
          class="f0 mb1 pl0 pr0 btn bgnone"
          @click="limparFormulário"
        >
          &times; limpar tudo
        </button>
      </div>

      <hr class="mb2 f1">

      <div class="flex">
        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_nominal"
            :disabled="!singleVariaveis.acumulativa"
          ><span>Preencher por valor nominal</span></label>
        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_acumulado"
            :disabled="!singleVariaveis.acumulativa"
          ><span>Preencher por valor acumulado</span></label>
      </div>
    </auxiliarDePreenchimento>

    <hr class="mb2 f1">

    <form
      id="form"
      @submit.prevent="onSubmit"
    >
      <div
        v-if="Valores[var_id]?.linhas"
        ref="envelopeDeValores"
      >
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
                <label class="label tc300">Realizado</label>
              </div>
              <div
                v-if="Valores[var_id].variavel.acumulativa"
                class="f1"
              >
                <label class="label tc300">Realizado Acumulado</label>
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
                  :name="v.series[Realizado]?.referencia"
                  :value="v.series[Realizado]?.valor_nominal"
                  class="inputtext light mb1"
                  :disabled="!v.series[Realizado]?.referencia
                    || modoDePreenchimento !== 'valor_nominal'"
                  @input="singleVariaveis.acumulativa
                    && modoDePreenchimento === 'valor_nominal'
                    && soma($event, k[1], i)"
                >
              </div>
              <div
                v-if="Valores[var_id].variavel.acumulativa"
                class="f1"
              >
                <label class="label">Acumulado {{ v.periodo }}</label>
                <input
                  type="number"
                  :step="'0'+(decimais? '.'+('0'.repeat(decimais-1))+'1' : '')"
                  :name="v.series[RealizadoAcumulado]?.referencia"
                  :value="singleVariaveis.acumulativa
                    ? acumular(v.periodo, v.series[Previsto]?.valor_nominal)
                    : v.series[RealizadoAcumulado]?.valor_nominal
                  "
                  :disabled="singleVariaveis.acumulativa
                    && modoDePreenchimento === 'valor_nominal'
                    || !v.series[RealizadoAcumulado]?.referencia"
                  class="inputtext light mb1"
                  @input="singleVariaveis.acumulativa
                    && modoDePreenchimento !== 'valor_nominal'
                    && soma($event, k[1], i)"
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
