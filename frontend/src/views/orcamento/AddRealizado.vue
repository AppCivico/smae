<script setup>
import { storeToRefs } from 'pinia';
import { Field, useForm } from 'vee-validate';
import {
  computed, ref, toRaw, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CampoDeDistribuicaoDeRecurso from '@/components/orcamento/CampoDeDistribuicaoDeRecurso.vue';
import CampoDeDotacao from '@/components/orcamento/CampoDeDotacao.vue';
import exigirDistribuicaoDeRecurso from '@/components/orcamento/helpers/exigirDistribuicaoDeRecurso';
import ItensRealizado from '@/components/orcamento/ItensRealizado.vue';
import ListaDeCompartilhamentos from '@/components/orcamento/ListaDeCompartilhamentos.vue';
import { orçamentoRealizado as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useMetasStore } from '@/stores/metas.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

const props = defineProps({
  // presente apenas em transferências, onde o ano é escolhido no formulário em
  // vez de vir da rota
  anoDeReferencia: {
    type: Number,
    default: null,
  },
  // presente apenas em transferências, onde a execução pode ser associada a
  // uma distribuição de recursos
  distribuicoesDeRecursos: {
    type: Array,
    default: null,
  },
  parametrosParaValidacao: {
    type: Object,
    required: true,
  },
});

const alertStore = useAlertStore();

const route = useRoute();
const router = useRouter();
const { meta_id } = route.params;
const ano = computed(() => props.anoDeReferencia ?? route.params.ano);

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}`;
const parent_item = ref(meta_id ? singleMeta : false);

const OrcamentosStore = useOrcamentosStore();
const { OrcamentoRealizado } = storeToRefs(OrcamentosStore);

const currentEdit = ref({
  itens: [],
  location: '',
  dotacao: '',
  dotacao_complemento: '',
  dotacao_cheia: '',
  ano_referencia: ano.value,
});

const dotação = ref('');
const dotaçãoComComplemento = ref('');
const respostasof = ref({});
const complemento = ref('');

const {
  errors, handleSubmit, isSubmitting, resetForm, values,
} = useForm({
  initialValues: currentEdit.value,
  validationSchema: props.distribuicoesDeRecursos
    ? exigirDistribuicaoDeRecurso(schema)
    : schema,
});

const onSubmit = handleSubmit(async () => {
  try {
    const carga = { ...values, ano_referencia: Number(ano.value) };

    /* exemplo:
84.22.10.304.3003.2.522.33903900.00.1.111.1111.1
dotação: 84.22.10.304.3003.2.522.33903900.00
complemento: 1.111.1111.1
*/
    // Gambiarra porque não tenho tempo de refazer o campo inteiro de modo a
    // cobrir todas as situações
    carga.dotacao_cheia = undefined;
    carga.dotacao = values.dotacao.split('.').map((x) => (x.indexOf('*') !== -1 ? '*' : x)).join('.');

    if (carga.location) {
      carga.atividade_id = null;
      carga.iniciativa_id = null;
      carga.meta_id = null;

      if (carga.location[0] === 'a') {
        carga.atividade_id = Number(values.location.slice(1));
      } else if (carga.location[0] === 'i') {
        carga.iniciativa_id = Number(values.location.slice(1));
      } else if (carga.location[0] === 'm') {
        carga.meta_id = Number(values.location.slice(1));
      }
    }

    const r = await OrcamentosStore.insertOrcamentoRealizado(carga);
    const msg = 'Dados salvos com sucesso!';

    if (r) {
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

watch(currentEdit, (novosValores) => {
  resetForm({ values: toRaw(novosValores) });
});
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center">
    <h1>Empenho/Liquidação</h1>
    <hr class="ml2 f1">

    <CheckClose />
  </div>

  <h3
    v-if="parent_item"
    class="mb2"
  >
    <strong>{{ ano }}</strong> - {{ parent_item.codigo }} - {{ parent_item.titulo }}
  </h3>
  <TituloDaPagina
    v-else-if="$route.meta.entidadeMãe === 'TransferenciasVoluntarias'"
    as="h3"
    class="mb2"
  />
  <h3
    v-else
    class="mb2"
  >
    <strong>{{ ano }}</strong>
  </h3>
  <template v-if="!(OrcamentoRealizado[ano]?.loading || OrcamentoRealizado[ano]?.error)">
    <!-- um segundo envio, por duplo clique ou Enter, geraria registro duplicado -->
    <form
      @submit.prevent="isSubmitting || onSubmit($event)"
    >
      <slot name="ano-de-referencia" />

      <Field
        name="ano_referencia"
        :value="ano"
        type="hidden"
      />
      <Field
        v-model="dotação"
        name="dotacao"
        type="hidden"
      />
      <Field
        v-model="complemento"
        name="dotacao_complemento"
        type="hidden"
      />

<pre v-ScrollLockDebug>
respostasof: {{ respostasof }}
complemento: {{ complemento }}
dotação: {{ dotação }}
dotaçãoComComplemento: {{ dotaçãoComComplemento }}
</pre>

      <CampoDeDotacao
        v-model:respostasof="respostasof"
        v-model:complemento="complemento"
        v-model:dotacao="dotação"
        v-model="dotaçãoComComplemento"
        :ano-de-referencia="ano"
        :parametros-para-validacao="parametrosParaValidacao"
      />

      <ListaDeCompartilhamentos
        v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)
          && Object.keys(respostasof).length
          && !respostasof.error
          && !respostasof.loading"
        :ano="ano"
        :pdm="activePdm.id"
        :dotação="dotação"
        class="mb1"
        :id-do-item="$route.params.meta_id"
      />

      <div
        v-if="['pdm', 'planoSetorial', 'programaDeMetas'].includes($route.meta.entidadeMãe)
          && Object.keys(respostasof).length
          && !respostasof.error
          && !respostasof.loading"
      >
        <hr class="mt2 mb2">
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
              {{ activePdm.rotulo_iniciativa }}{{
                ['Atividade'].indexOf(activePdm.nivel_orcamento) != -1
                  ? ' e ' + activePdm.rotulo_atividade
                  : ''
              }}
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

      <CampoDeDistribuicaoDeRecurso
        v-if="distribuicoesDeRecursos
          && Object.keys(respostasof).length
          && !respostasof.error
          && !respostasof.loading"
        :distribuicoes="distribuicoesDeRecursos"
      />

      <Field
        v-slot="{ field, meta: fieldMeta }"
        name="itens"
      >
        <ItensRealizado
          v-if="Object.keys(respostasof).length && !respostasof.error && !respostasof.loading"
          v-model="field.value"
          :respostasof="respostasof"
          name="itens"
        />
        <div
          v-if="fieldMeta.touched && errors.itens"
          class="error-msg"
        >
          {{ errors.itens }}
        </div>
      </Field>

      <SmaeFieldsetSubmit
        :erros="errors"
        :esta-carregando="isSubmitting"
      />
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
