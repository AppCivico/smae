<script setup>
import ItensRealizado from '@/components/orcamento/ItensRealizado.vue';
import ListaDeCompartilhamentos from '@/components/orcamento/ListaDeCompartilhamentos.vue';
import patterns from '@/consts/patterns';
import formatProcesso from '@/helpers/formatProcesso';
import { useAlertStore } from '@/stores/alert.store';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import {
  defineOptions, ref, toRaw, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as Yup from 'yup';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  parametrosParaValidacao: {
    type: Object,
    required: true,
  },
});

const alertStore = useAlertStore();
const route = useRoute();
const router = useRouter();
const DotaçãoStore = useDotaçãoStore();
const { meta_id } = route.params;
const { ano } = route.params;
const { seiOuSinproc: regprocesso } = patterns;

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado } = storeToRefs(OrcamentosStore);

const validando = ref(false);

const currentEdit = ref({
  itens: [],
});
const dota = ref('');
const respostasof = ref({});

const schema = Yup.object().shape({
  processo: Yup.string().required('Preencha o processo.').matches(regprocesso, 'Formato inválido'),
  dotacao: Yup.string(),
});

const {
  errors, handleSubmit, isSubmitting, resetForm, values, validateField,
} = useForm({
  initialValues: currentEdit.value,
  validationSchema: schema,
});

const onSubmit = handleSubmit(async () => {
  if (validando.value) return;

  try {
    let msg;
    let r;

    values.ano_referencia = Number(ano);

    if (values.location) {
      values.atividade_id = null;
      values.iniciativa_id = null;
      values.meta_id = null;

      if (values.location[0] == 'a') {
        values.atividade_id = Number(values.location.slice(1));
      } else if (values.location[0] == 'i') {
        values.iniciativa_id = Number(values.location.slice(1));
      } else if (values.location[0] == 'm') {
        values.meta_id = Number(values.location.slice(1));
      }
    }

    r = await OrcamentosStore.insertOrcamentoRealizado(values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      alertStore.success(msg);
      if (route.meta?.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          query: route.query,
        });
      } else {
        await router.push({
          path: `${parentlink}/orcamento/realizado`,
          query: route.query,
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await OrcamentosStore.deleteOrcamentoRealizado(id, route.params)) {
      if (parentlink) {
        router.push({
          path: `${parentlink}/orcamento`,
          query: route.query,
        });
      } else if (route.meta?.rotaDeEscape) {
        router.push({
          name: route.meta.rotaDeEscape,
          query: route.query,
        });
      }
    }
  }, 'Remover');
}

function dinheiro(v) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(Number(v));
}

function maskProcesso(el) {
  el.target.value = formatProcesso(el.target.value);
}

async function validarProcesso() {
  validando.value = true;
  try {
    respostasof.value = { loading: true };
    const { valid } = await validateField('processo');
    if (valid) {
      const r = await DotaçãoStore
        .getDotaçãoRealizadoProcesso(dota.value, ano, props.parametrosParaValidacao);
      respostasof.value = r;
    } else {
      respostasof.value = {};
    }
  } catch (error) {
    respostasof.value = error;
  } finally {
    validando.value = false;
  }
}

watch(currentEdit, (novosValores) => {
  resetForm({ values: toRaw(novosValores) });
});
</script>
<template>
  <div class="flex spacebetween center">
    <h1>Empenho/Liquidação</h1>
    <hr class="ml2 f1">

    <CheckClose />
  </div>
  <h3 class="mb2">
    <strong>{{ ano }}</strong> - {{ parent_item.codigo }} - {{ parent_item.titulo }}
  </h3>
  <template v-if="!(OrcamentoRealizado[ano]?.loading || OrcamentoRealizado[ano]?.error)">
    <form
      @submit.prevent="onSubmit"
      @keyup.enter.stop.prevent
    >
      <div class="flex center g2 mb2">
        <div class="f1">
          <label class="label">Processo SEI ou SINPROC <span class="tvermelho">*</span></label>
          <Field
            v-model="dota"
            name="processo"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.processo }"
            :aria-busy="respostasof.loading || validando"
            placeholder="DDDD.DDDD/DDDDDDD-D (SEI) ou AAAA-D.DDD.DDD-D (SINPROC)"
            @keyup.stop.prevent="maskProcesso"
            @keyup.enter.stop.prevent="validarProcesso"
          />

          <ErrorMessage name="processo" />

          <div
            v-if="respostasof.loading"
            class="t13 mb1 tc300"
          >
            Aguardando resposta do SOF
          </div>
        </div>
        <div class="f0">
          <button
            type="button"
            class="btn outline bgnone tcprimary"
            :aria-disabled="validando"
            :aria-busy="validando"
            @click="validarProcesso()"
          >
            Validar via SOF
          </button>
        </div>
      </div>
      <div
        v-if="respostasof.length"
        class="mb2"
      >
        <label class="label mb2">Dotação vinculada* <span class="tvermelho">*</span></label>

        <div class="flex g2">
          <div
            class="f0"
            style="flex-basis:30px"
          />
          <div class="f1">
            <label class="label tc300">Dotação</label>
          </div>
          <div class="f1">
            <label class="label tc300">Nome do Projeto/Atividade</label>
          </div>
          <div
            class="f0"
            style="flex-basis:90px"
          >
            <label class="label tc300">Valor Empenho</label>
          </div>
          <div
            class="f0"
            style="flex-basis:90px"
          >
            <label class="label tc300">Valor Liquidação</label>
          </div>
        </div>
        <hr class="mb05">
        <label
          v-for="(d) in respostasof"
          :key="d.id"
          class="flex g2 center mb1"
        >
          <div
            class="f0"
            style="flex-basis:30px"
          ><Field
            name="dotacao"
            type="radio"
            :value="d.dotacao"
            class="inputcheckbox"
          /><span /></div>
          <div class="f1">{{ d.dotacao }}</div>
          <div class="f1">{{ d.projeto_atividade }}</div>
          <div
            class="f0"
            style="flex-basis:90px"
          >{{ dinheiro(d.empenho_liquido) }}</div>
          <div
            class="f0"
            style="flex-basis:90px"
          >{{ dinheiro(d.valor_liquidado) }}</div>
        </label>
      </div>

      <ListaDeCompartilhamentos
        v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)
          && respostasof.length && values.dotacao"
        :ano="ano"
        :pdm="activePdm.id"
        :dotação="values.dotacao"
        :processo="values.processo"
        class="mb1"
      />

      <template v-if="respostasof.length && values.dotacao">
        <div v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)">
          <label class="label">Vincular dotação<span class="tvermelho">*</span></label>

          <div
            v-for="m in singleMeta.children"
            :key="m.id"
          >
            <div class="label tc300">
              Meta
            </div>
            <label class="block mb1">
              <Field
                name="location"
                type="radio"
                :value="'m' + m.id"
                class="inputcheckbox"
              />
              <span>{{ m.codigo }} - {{ m.titulo }}</span>
            </label>
            <template v-if="['Iniciativa', 'Atividade'].indexOf(activePdm.nivel_orcamento) != -1">
              <div
                v-if="m?.iniciativas?.length"
                class="label tc300"
              >
                {{ activePdm.rotulo_iniciativa }}{{ ['Atividade'].indexOf(activePdm.nivel_orcamento) != -1
                  ? ' e ' + activePdm.rotulo_atividade
                  : '' }}
              </div>
              <div
                v-for="i in m.iniciativas"
                :key="i.id"
                class=""
              >
                <label class="block mb1">
                  <Field
                    name="location"
                    type="radio"
                    :value="'i' + i.id"
                    class="inputcheckbox"
                  />
                  <span>{{ i.codigo }} - {{ i.titulo }}</span>
                </label>
                <template v-if="activePdm.nivel_orcamento == 'Atividade'">
                  <div
                    v-for="a in i.atividades"
                    :key="a.id"
                    class="pl2"
                  >
                    <label class="block mb1">
                      <Field
                        name="location"
                        type="radio"
                        :value="'a' + a.id"
                        class="inputcheckbox"
                      />
                      <span>{{ a.codigo }} - {{ a.titulo }}</span>
                    </label>
                  </div>
                </template>
              </div>
            </template>
          </div>
          <div class="error-msg">
            {{ errors.location }}
          </div>
        </div>

        <ItensRealizado
          v-model="values.itens"
          :respostasof="respostasof.find((x) => x.dotacao == values.dotacao)"
          name="itens"
        />

        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button
            class="btn big"
            :disabled="isSubmitting"
          >
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </template>
    </form>
  </template>
  <template v-if="currentEdit && currentEdit?.id">
    <button
      class="btn amarelo big"
      @click="checkDelete(currentEdit.id)"
    >
      Remover item
    </button>
  </template>
  <template v-if="OrcamentoRealizado[ano]?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="OrcamentoRealizado[ano]?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ OrcamentoRealizado[ano].error }}
      </div>
    </div>
  </template>
</template>
