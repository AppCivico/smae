<script setup>
import { Dashboard } from '@/components';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { indicador as schema } from '@/consts/formSchemas';
import fieldToDate from '@/helpers/fieldToDate';
import maskMonth from '@/helpers/maskMonth';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useIndicadoresStore } from '@/stores/indicadores.store';
import { useIniciativasStore } from '@/stores/iniciativas.store';
import { useMetasStore } from '@/stores/metas.store';
import { useVariaveisStore } from '@/stores/variaveis.store';

import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import SmallModal from '@/components/SmallModal.vue';
import EditorDeFormula from '@/components/metas/EditorDeFormula.vue';
import TabelaDeVariaveis from '@/components/metas/TabelaDeVariaveis.vue';
import TabelaDeVariaveisCompostas from '@/components/metas/TabelaDeVariaveisCompostas.vue';
import TabelaDeVariaveisCompostasEmUso from '@/components/metas/TabelaDeVariaveisCompostasEmUso.vue';
import TabelaDeVariaveisEmUso from '@/components/metas/TabelaDeVariaveisEmUso.vue';
import { default as AddEditRealizado } from '@/views/metas/AddEditRealizado.vue';
import { default as AddEditValores } from '@/views/metas/AddEditValores.vue';
import AddEditValoresComposta from '@/views/metas/AddEditValoresComposta.vue';
import { default as AddEditVariavel } from '@/views/metas/AddEditVariavel.vue';
import AddEditVariavelComposta from '@/views/metas/AddEditVariavelComposta.vue';
import GerarVariaveisCompostas from '@/views/metas/GerarVariaveisCompostas.vue';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import {
  onMounted, onUpdated, ref, unref,
} from 'vue';
import { useRoute } from 'vue-router';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const {
  meta_id, iniciativa_id, atividade_id, indicador_id,
} = route.params;

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;
const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parentField = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const props = defineProps(['group']);

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.getById(meta_id);
MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if (iniciativa_id) IniciativasStore.getById(meta_id, iniciativa_id);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if (atividade_id) AtividadesStore.getById(iniciativa_id, atividade_id);

const IndicadoresStore = useIndicadoresStore();
const { singleIndicadores } = storeToRefs(IndicadoresStore);

const VariaveisStore = useVariaveisStore();
const {
  Variaveis, variáveisCompostas, variáveisCompostasEmUso,
} = storeToRefs(VariaveisStore);

const dadosExtrasDeAbas = {
  TabelaDeVariaveis: {
    id: 'variaveis',
    etiqueta: 'Variáveis',
  },
  TabelaDeVariaveisCompostas: {
    id: 'variaveis-compostas',
    etiqueta: 'Variáveis Compostas',
  },
  TabelaDeVariaveisCompostasEmUso: {
    id: 'variaveis-compostas-em-uso',
    etiqueta: 'Variáveis compostas em uso',
    aberta: true,
  },
  TabelaDeVariaveisEmUso: {
    id: 'variaveis-em-uso',
    etiqueta: 'Variáveis em Uso',
  },
};

const formula = ref('');
const variaveisFormula = ref([]);
const errFormula = ref('');

// PRA-FAZER: extrair todos os modais das props, porque componentes inteiros
// dentro de variáveis reativas comprometem performance
function start() {
  switch (props.group) {
    case 'variaveis':
      editModalStore.modal(AddEditVariavel, props);
      break;
    case 'valores':
      editModalStore.modal(AddEditValores, {
        ...props,
        checkClose: () => {
          alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
            editModalStore.$reset();
            alertStore.$reset();
          });
        },
      });
      break;
    case 'retroativos':
      editModalStore.modal(AddEditRealizado, props);
      break;
    case 'compostas-valores':
    case 'compostas-retroativos':
      editModalStore.modal(AddEditValoresComposta, props);
      break;
    // case 'gerar-compostas':
    //   editModalStore.modal(GerarVariaveisCompostas, props);
    //   break;
    case 'criar-ou-editar-variaveis-compostas':
      editModalStore.modal(AddEditVariavelComposta, props);
      break;

    default:
      editModalStore.$reset();
      break;
  }
}

onMounted(() => { start(); });
onUpdated(() => { start(); });

// Formula
async function validadeFormula(f) {
  try {
    if (typeof window.formula_parser !== 'undefined') {
      window.formula_parser.parse(f.toLocaleUpperCase());
      return false;
    }
  } catch (e) {
    return e.hash;
  }
}
async function onSubmit(values) {
  try {
    let msg;
    let r;
    values.inicio_medicao = fieldToDate(values.inicio_medicao);
    values.fim_medicao = fieldToDate(values.fim_medicao);
    values.regionalizavel = !!values.regionalizavel;
    values.nivel_regionalizacao = values.regionalizavel
      ? Number(values.nivel_regionalizacao)
      : null;
    values.acumulado_valor_base = values.acumulado_valor_base === ''
      || values.acumulado_valor_base === null
      || Number.isNaN(Number(values.acumulado_valor_base))
      ? null
      : String(values.acumulado_valor_base);

    values.casas_decimais = values.casas_decimais ? Number(values.casas_decimais) : null;

    if (!values.acumulado_usa_formula) {
      values.acumulado_usa_formula = false;
    } else {
      values.acumulado_valor_base = null;
    }

    // Parent
    if (atividade_id) {
      values.atividade_id = Number(atividade_id);
    } else if (iniciativa_id) {
      values.iniciativa_id = Number(iniciativa_id);
    } else {
      values.meta_id = Number(meta_id);
    }

    if (indicador_id) {
      values.formula = formula.value.trim();

      if (values.formula) {
        const er = await validadeFormula(values.formula);
        if (er) {
          errFormula.value = er;
          throw new Error('Erro na fórmula');
        }
      }

      values.formula_variaveis = unref(variaveisFormula);

      if (singleIndicadores.value.id) {
        r = await IndicadoresStore.update(singleIndicadores.value.id, values);
        MetasStore.clear();
        IndicadoresStore.clear();
        msg = 'Dados salvos com sucesso!';
      }
    } else {
      r = await IndicadoresStore.insert(values);
      MetasStore.clear();
      IndicadoresStore.clear();
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      MetasStore.clear();
      alertStore.success(msg);
      router.push(parentlink);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkDelete(id) {
  if (id) {
    if (singleIndicadores.value.id) {
      alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
        if (await IndicadoresStore.delete(id)) {
          IndicadoresStore.clear();
          await router.push(parentlink);
          alertStore.success('Indicador removido.');
        }
      }, 'Remover');
    }
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', parentlink);
}

if (indicador_id) {
  Promise.all([
    VariaveisStore.getAllCompound(indicador_id),
    VariaveisStore.getAllCompoundInUse(indicador_id),
    IndicadoresStore.getById(indicador_id),
    VariaveisStore.getAll(indicador_id),
  ]).then(() => {
    if (singleIndicadores.value.formula) {
      formula.value = singleIndicadores.value.formula;

      // PRA-FAZER: corrigir reatividade e **não** usar essa gambiarra
      if (Array.isArray(singleIndicadores.value.formula_variaveis)) {
        variaveisFormula.value = singleIndicadores.value.formula_variaveis;
      }
    }
  });
} else if (atividade_id) {
  IndicadoresStore.getAll(atividade_id, 'atividade_id');
} else if (iniciativa_id) {
  IndicadoresStore.getAll(iniciativa_id, 'iniciativa_id');
} else {
  IndicadoresStore.getAll(meta_id, 'meta_id');
}
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <Dashboard v-bind="$attrs">
    <MigalhasDeMetas class="mb1" />

    <div class="flex spacebetween center">
      <h1 v-if="indicador_id">
        Editar Indicador
      </h1>
      <h1 v-else>
        Adicionar Indicador
      </h1>
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
    <div
      v-if="atividade_id"
      class="t24 mb2"
    >
      {{ activePdm.rotulo_atividade }} {{ singleAtividade.codigo }} {{ singleAtividade.titulo }}
    </div>
    <div
      v-else-if="iniciativa_id"
      class="t24 mb2"
    >
      {{ activePdm.rotulo_iniciativa }} {{ singleIniciativa.codigo }} {{ singleIniciativa.titulo }}
    </div>
    <div
      v-else-if="meta_id"
      class="t24 mb2"
    >
      Meta {{ singleMeta.codigo }} {{ singleMeta.titulo }}
    </div>

    <template v-if="!(singleIndicadores?.loading || singleIndicadores?.error)">
      <Form
        v-slot="{ errors, isSubmitting, setFieldValue, values }"
        :validation-schema="schema"
        :initial-values="indicador_id ? singleIndicadores : {}"
        @submit="onSubmit"
      >
        <div class="flex g2">
          <div class="f1">
            <label class="label">Código <span class="tvermelho">*</span></label>
            <Field
              name="codigo"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.codigo }"
            />
            <div class="error-msg">
              {{ errors.codigo }}
            </div>
          </div>
          <div class="f2">
            <label class="label">Título <span class="tvermelho">*</span></label>
            <Field
              name="titulo"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.titulo }"
            />
            <div class="error-msg">
              {{ errors.titulo }}
            </div>
          </div>
        </div>
        <div class="flex g2">
          <div class="f1">
            <label class="label">Polaridade <span class="tvermelho">*</span></label>
            <Field
              name="polaridade"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.polaridade }"
            >
              <option value="">
                Selecionar
              </option>
              <option value="Neutra">
                Neutra
              </option>
              <option value="Positiva">
                Positiva
              </option>
              <option value="Negativa">
                Negativa
              </option>
            </Field>
            <div class="error-msg">
              {{ errors.polaridade }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Casas decimais</label>
            <Field
              name="casas_decimais"
              type="number"
              class="inputtext light mb1"
              :class="{ 'error': errors.casas_decimais }"
              max="35"
              min="0"
              step="1"
            />
            <div class="error-msg">
              {{ errors.casas_decimais }}
            </div>
          </div>
          <div class="f1">
            <label class="label flex center">Periodicidade <span class="tvermelho">*</span></label>

            <Field
              v-if="!indicador_id"
              name="periodicidade"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.periodicidade }"
            >
              <option value="">
                Selecionar
              </option>
              <option value="Mensal">
                Mensal
              </option>
              <option value="Bimestral">
                Bimestral
              </option>
              <option value="Trimestral">
                Trimestral
              </option>
              <option value="Quadrimestral">
                Quadrimestral
              </option>
              <option value="Semestral">
                Semestral
              </option>
              <option value="Anual">
                Anual
              </option>
            </Field>
            <div
              v-else
              class="flex center"
            >
              <Field
                name="periodicidade"
                type="text"
                class="inputtext light mb1"
                disabled
                :class="{ 'error': errors.periodicidade }"
              />
              <div class="tipinfo left ml1">
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_i" /></svg><div>Não é permitida a troca da periodicidade</div>
              </div>
            </div>
            <div class="error-msg">
              {{ errors.periodicidade }}
            </div>
          </div>
        </div>
        <div class="flex g2">
          <div class="f1">
            <label class="label">Início da Medição <span class="tvermelho">*</span></label>
            <Field
              name="inicio_medicao"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.inicio_medicao }"
              maxlength="7"
              placeholder="mm/aaaa"
              @keyup="maskMonth"
            />
            <div class="error-msg">
              {{ errors.inicio_medicao }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Fim da Medição <span class="tvermelho">*</span></label>
            <Field
              name="fim_medicao"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.fim_medicao }"
              maxlength="7"
              placeholder="mm/aaaa"
              @keyup="maskMonth"
            />
            <div class="error-msg">
              {{ errors.fim_medicao }}
            </div>
          </div>
        </div>

        <div
          v-if="!indicador_id"
          class=""
        >
          <div class="mb1">
            <label class="block">
              <Field
                name="regionalizavel"
                type="checkbox"
                :value="true"
                :unchecked-value="false"
                class="inputcheckbox"
              /><span :class="{ 'error': errors.regionalizavel }">Indicador regionalizável</span>
            </label>
            <div class="error-msg">
              {{ errors.regionalizavel }}
            </div>
          </div>
          <div
            v-if="values.regionalizavel"
            class=""
          >
            <label class="label">Nível de regionalização <span class="tvermelho">*</span></label>
            <Field
              name="nivel_regionalizacao"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.nivel_regionalizacao }"
            >
              <option value="">
                Selecione
              </option>
              <option value="2">
                Região
              </option>
              <option value="3">
                Subprefeitura
              </option>
              <option value="4">
                Distrito
              </option>
            </Field>
            <div class="error-msg">
              {{ errors.nivel_regionalizacao }}
            </div>
          </div>
        </div>
        <div
          v-else
          class=""
        >
          <div class="mb1">
            <label class="flex center">
              <Field
                name="regionalizavel"
                type="checkbox"
                :value="true"
                :unchecked-value="false"
                class="inputcheckbox"
                disabled
              />
              <span>Indicador regionalizável</span>
              <div class="tipinfo ml1">
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_i" /></svg>
                <div>Não é permitida a troca da regionalização</div>
              </div>
            </label>
            <div class="error-msg">
              {{ errors.regionalizavel }}
            </div>
          </div>

          <div v-if="singleIndicadores.nivel_regionalizacao">
            <label class="label">Nível de regionalização <span class="tvermelho">*</span></label>
            <Field
              name="nivel_regionalizacao"
              disabled
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.nivel_regionalizacao }"
            >
              <option value="">
                Selecione
              </option>
              <option value="2">
                Região
              </option>
              <option value="3">
                Subprefeitura
              </option>
              <option value="4">
                Distrito
              </option>
            </Field>
            <div class="error-msg">
              {{ errors.nivel_regionalizacao }}
            </div>
          </div>
        </div>
        <hr class="mt2 mb2">
        <div class="f1">
          <label class="label">Contexto</label>
          <Field
            name="contexto"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.contexto }"
          />
          <div class="error-msg">
            {{ errors.contexto }}
          </div>
        </div>
        <div class="f2">
          <label class="label">
            {{ activePdm.rotulo_complementacao_meta || 'Informações Complementares' }}
          </label>
          <Field
            name="complemento"
            as="textarea"
            rows="3"
            class="inputtext light mb1"
            :class="{ 'error': errors.complemento }"
          />
          <div class="error-msg">
            {{ errors.complemento }}
          </div>
        </div>

        <hr class="mt2 mb2">

        <div v-if="indicador_id && !Variaveis[indicador_id]?.loading">
          <EditorDeFormula
            v-model="formula"
            v-model:variaveis-formula="variaveisFormula"
            :variáveis-do-indicador="Array.isArray(Variaveis[indicador_id])
              ? Variaveis[indicador_id]
              : []"
            :variáveis-em-uso="Array.isArray(singleIndicadores.formula_variaveis)
              ? singleIndicadores.formula_variaveis
              : []"
            :variáveis-compostas="Array.isArray(variáveisCompostas[indicador_id])
              ? variáveisCompostas[indicador_id]
              : []"
          />

          <label class="block mt2 mb2">
            <Field
              name="acumulado_usa_formula"
              type="checkbox"
              class="inputcheckbox"
              :value="true"
              :class="{ 'error': errors.acumulado_usa_formula }"
              @change="() => {
                if (values.acumulado_usa_formula) {
                  setFieldValue('responsavel', null)
                }
              }"
            />
            <span>Utilizar a fórmula no cálculo da série
              acumulada</span>
          </label>

          <div
            v-if="!values.acumulado_usa_formula"
          >
            <LabelFromYup
              name="acumulado_valor_base"
              :schema="schema"
            />
            <Field
              name="acumulado_valor_base"
              type="number"
              :value="values.acumulado_valor_base"
              class="inputtext light mb1"
              :class="{ 'error': errors.acumulado_valor_base }"
            />
            <div class="error-msg">
              {{ errors.acumulado_valor_base }}
            </div>
          </div>
        </div>
        <div v-else-if="Variaveis[indicador_id]?.loading">
          <span class="spinner">Carregando</span>
        </div>

        <div class="flex spacebetween center mt2 mb2">
          <hr class="mr2 f1">
          <button
            class="btn big"
            :disabled="isSubmitting"
          >
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </Form>
    </template>
    <template v-if="singleIndicadores?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="singleIndicadores?.error">
      <div class="error p1">
        <div class="error-msg">
          {{ singleIndicadores.error }}
        </div>
      </div>
    </template>
    <template v-if="(!indicador_id && singleIndicadores.length)">
      <div class="error p1">
        <div class="error-msg">
          Somente um indicador por meta
        </div>
      </div>
      <div class="tc">
        <SmaeLink
          :to="`${parentlink}`"
          class="btn big mt1 mb1"
        >
          <span>Voltar</span>
        </SmaeLink>
      </div>
    </template>

    <EnvelopeDeAbas
      v-if="indicador_id"
      :meta-dados-por-id="dadosExtrasDeAbas"
      class="mt2 mb2"
    >
      <template #TabelaDeVariaveis="{ estáAberta }">
        <TabelaDeVariaveis
          v-if="!Variaveis[indicador_id]?.loading && estáAberta"
          :indicador-regionalizavel="!!singleIndicadores?.regionalizavel"
          :variáveis="Variaveis[indicador_id]"
          :parentlink="parentlink"
        />
      </template>

      <template #TabelaDeVariaveisCompostas="{ estáAberta }">
        <TabelaDeVariaveisCompostas
          v-if="!Variaveis[indicador_id]?.loading && estáAberta"
          :indicador-regionalizavel="!!singleIndicadores?.regionalizavel"
          :variáveis-compostas="Array.isArray(variáveisCompostas[indicador_id])
            ? variáveisCompostas[indicador_id]
            : []"
          :parentlink="parentlink"
        />
      </template>

      <template #TabelaDeVariaveisCompostasEmUso="{ estáAberta }">
        <TabelaDeVariaveisCompostasEmUso
          v-if="!Variaveis[indicador_id]?.loading && estáAberta"
          :variáveis-compostas-em-uso="variáveisCompostasEmUso[indicador_id]"
          :parentlink="parentlink"
        />
      </template>

      <template #TabelaDeVariaveisEmUso="{ estáAberta }">
        <TabelaDeVariaveisEmUso
          v-if="!Variaveis[indicador_id]?.loading && estáAberta"
          :parentlink="parentlink"
        />
      </template>
    </EnvelopeDeAbas>

    <template v-if="indicador_id && singleIndicadores.id && indicador_id == singleIndicadores.id">
      <hr class="mt2 mb2">
      <button
        class="btn amarelo big"
        @click="checkDelete(singleIndicadores.id)"
      >
        Remover indicador
      </button>
    </template>
  </Dashboard>
  <SmallModal
    class="small"
    :active="props.group === 'gerar-compostas'"
    @close="() => {
      editModalStore.$reset();
      if ($route.meta.rotaDeEscape) {
        $router.push({
          name: $route.meta.rotaDeEscape,
          // ao que parece, os parâmetros só não são necessários
          // se a rota corrente e a de destino forem aninhadas
          params: $route.params,
          query: $route.query,
        });
      }
    }"
  >
    <GerarVariaveisCompostas />
  </SmallModal>
</template>
