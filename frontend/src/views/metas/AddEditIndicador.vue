<script setup>
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import SmallModal from '@/components/SmallModal.vue';
import EditorDeFormula from '@/components/metas/EditorDeFormula.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import TabelaDeVariaveis from '@/components/metas/TabelaDeVariaveis.vue';
import TabelaDeVariaveisCompostas from '@/components/metas/TabelaDeVariaveisCompostas.vue';
import TabelaDeVariaveisCompostasEmUso from '@/components/metas/TabelaDeVariaveisCompostasEmUso.vue';
import TabelaDeVariaveisEmUso from '@/components/metas/TabelaDeVariaveisEmUso.vue';
import AssociadorDeVariaveis from '@/components/variaveis/AssociadorDeVariaveis.vue';
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
import AddEditRealizado from '@/views/metas/AddEditRealizado.vue';
import AddEditValores from '@/views/metas/AddEditValores.vue';
import AddEditValoresComposta from '@/views/metas/AddEditValoresComposta.vue';
import AddEditVariavel from '@/views/metas/AddEditVariavel.vue';
import AddEditVariavelComposta from '@/views/metas/AddEditVariavelComposta.vue';
import GerarVariaveisCompostas from '@/views/metas/GerarVariaveisCompostas.vue';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import {
  computed,
  ref, unref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const {
  meta_id: metaId,
  iniciativa_id: iniciativaId,
  atividade_id: atividadeId,
  indicador_id: indicadorId,
} = route.params;

const parentlink = `${metaId ? `/metas/${metaId}` : ''}${iniciativaId ? `/iniciativas/${iniciativaId}` : ''}${atividadeId ? `/atividades/${atividadeId}` : ''}`;

const props = defineProps(['group']);

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);
MetasStore.getById(metaId);
MetasStore.getPdM();

const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);
if (iniciativaId) IniciativasStore.getById(metaId, iniciativaId);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);
if (atividadeId) AtividadesStore.getById(iniciativaId, atividadeId);

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
  TabelaDeVariaveisEmUso: {
    id: 'variaveis-em-uso',
    etiqueta: 'Variáveis em Uso',
  },
};

if (route.meta.entidadeMãe === 'pdm') {
  dadosExtrasDeAbas.TabelaDeVariaveisCompostas = {
    id: 'variaveis-compostas',
    etiqueta: 'Variáveis Compostas',
  };
  dadosExtrasDeAbas.TabelaDeVariaveisCompostasEmUso = {
    id: 'variaveis-compostas-em-uso',
    etiqueta: 'Variáveis compostas em uso',
    aberta: true,
  };
} else {
  dadosExtrasDeAbas.TabelaDeVariaveisEmUso.aberta = true;
}

const formula = ref('');
const variaveisFormula = ref([]);
const errFormula = ref('');
const AssociadorDeVariaveisEstaAberto = ref(false);

// eslint-disable-next-line max-len
const variaveisCategoricasDisponiveis = computed(() => (Array.isArray(Variaveis.value?.[route.params.indicador_id])
  ? Variaveis.value?.[route.params.indicador_id].filter((v) => v.variavel_categorica_id !== null)
  : []));

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

// Formula
// desabilitando lint para manter compatibilidade com o código legado
// eslint-disable-next-line consistent-return
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

    if (values.variavel_categoria_id) {
      values.formula_variaveis = [
        {
          variavel_id: values.variavel_categoria_id,
          referencia: '_1',
          janela: 1,
          usar_serie_acumulada: false,
        },
      ];
      values.formula = '$_1';
    } else {
      values.formula = formula.value.trim();
      values.formula_variaveis = unref(variaveisFormula);
    }

    values.inicio_medicao = fieldToDate(values.inicio_medicao);
    values.fim_medicao = fieldToDate(values.fim_medicao);
    values.regionalizavel = !!values.regionalizavel;
    values.variavel_categoria_id = values.variavel_categoria_id === '' ? null : values.variavel_categoria_id;
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
    if (atividadeId) {
      values.atividade_id = Number(atividadeId);
    } else if (iniciativaId) {
      values.iniciativa_id = Number(iniciativaId);
    } else {
      values.meta_id = Number(metaId);
    }

    if (indicadorId || values.indicador_tipo === 'Categorica') {
      if (values.formula) {
        const er = await validadeFormula(values.formula);
        if (er) {
          errFormula.value = er;
          throw new Error('Erro na fórmula');
        }
      }

      if (values.indicador_tipo === 'Numerico') {
        values.variavel_categoria_id = null;
      }

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

    if (r === true) {
      MetasStore.clear();
      alertStore.success(msg);

      if (route.meta.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      } else if (route.meta.entidadeMãe) {
        router.push(parentlink);
      } else {
        throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
      }
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

          if (route.meta.rotaDeEscape) {
            router.push({ name: route.meta.rotaDeEscape });
          } else if (route.meta.entidadeMãe) {
            await router.push(parentlink);
          } else {
            throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
          }
          alertStore.success('Indicador removido.');
        }
      }, 'Remover');
    }
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    alertStore.$reset();
    if (route.meta.rotaDeEscape) {
      router.push({
        name: route.meta.rotaDeEscape,
      });
    } else if (route.meta.entidadeMãe === 'pdm') {
      router.push({
        path: parentlink,
      });
    } else {
      throw new Error(`Falta configurar uma rota de escape para: "${route.path}"`);
    }
  });
}

if (indicadorId) {
  const chamadas = [
    IndicadoresStore.getById(indicadorId),
    VariaveisStore.getAll(indicadorId),
  ];

  if (route.meta.entidadeMãe === 'pdm') {
    chamadas.push(VariaveisStore.getAllCompound(indicadorId));
    chamadas.push(VariaveisStore.getAllCompoundInUse(indicadorId));
  }

  Promise.all(chamadas).then(() => {
    if (singleIndicadores.value.formula) {
      formula.value = singleIndicadores.value.formula;

      // PRA-FAZER: corrigir reatividade e **não** usar essa gambiarra
      if (Array.isArray(singleIndicadores.value.formula_variaveis)) {
        variaveisFormula.value = singleIndicadores.value.formula_variaveis;
      }
    }
  });
} else if (atividadeId) {
  IndicadoresStore.getAll(atividadeId, 'atividade_id');
} else if (iniciativaId) {
  IndicadoresStore.getAll(iniciativaId, 'iniciativa_id');
} else {
  IndicadoresStore.getAll(metaId, 'meta_id');
}

watch(AssociadorDeVariaveisEstaAberto, (novoValor) => {
  if (!novoValor) {
    VariaveisStore.getAll(indicadorId);
  }
});

watch(() => props.group, () => {
  start();
}, { immediate: true });
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center">
    <TítuloDePágina
      :ícone="activePdm?.logo"
    >
      <template v-if="indicadorId">
        Editar Indicador
      </template>
      <template v-else>
        Adicionar Indicador
      </template>
    </TítuloDePágina>

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
    v-if="atividadeId"
    class="t24 mb2"
  >
    {{ activePdm.rotulo_atividade }} {{ singleAtividade.codigo }} {{ singleAtividade.titulo }}
  </div>
  <div
    v-else-if="iniciativaId"
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
      :initial-values="indicadorId ? singleIndicadores : {}"
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
        <div
          v-if="indicadorId"
          class="f2"
        >
          <label class="label">Tipo da fórmula <span class="tvermelho">*</span></label>
          <Field
            id="indicador_tipo"
            as="select"
            name="indicador_tipo"
            class="inputtext light"
            @change="() => {
              if (values.indicador_tipo) {
                setFieldValue('formula', '')
                setFieldValue('formula_variaveis', [])
              }
            }"
          >
            <option value="Numerico">
              Numérica
            </option>
            <option value="Categorica">
              Categórica
            </option>
          </Field>
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
        <div
          v-show="values.indicador_tipo === 'Numerico'"
          class="f1"
        >
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
            v-if="!indicadorId"
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
        <div
          v-if="values.indicador_tipo === 'Categorica'"
          class="f1 fb20em"
        >
          <label class="label">Variavel</label>
          <Field
            id="variavel_categoria_id"
            as="select"
            name="variavel_categoria_id"
            class="inputtext light"
          >
            <option :value="null" />
            <option
              v-for="(variavel, index) in variaveisCategoricasDisponiveis"
              :key="index"
              :value="variavel.id"
              :title="variavel.titulo"
            >
              {{ variavel.titulo }}
            </option>
          </Field>
        </div>
      </div>
      <div
        v-if="!indicadorId"
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

      <div
        v-if="indicadorId && !Variaveis[indicadorId]?.loading"
        v-show="values.indicador_tipo === 'Numerico'"
      >
        <EditorDeFormula
          v-model="formula"
          v-model:variaveis-formula="variaveisFormula"
          :variáveis-do-indicador="Array.isArray(Variaveis[indicadorId])
            ? Variaveis[indicadorId]
            : []"
          :variáveis-em-uso="Array.isArray(singleIndicadores.formula_variaveis)
            ? singleIndicadores.formula_variaveis
            : []"
          :variáveis-compostas="Array.isArray(variáveisCompostas[indicadorId])
            ? variáveisCompostas[indicadorId]
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
      <div v-else-if="Variaveis[indicadorId]?.loading">
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
  <template v-if="(!indicadorId && singleIndicadores.length)">
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
    v-if="indicadorId"
    :meta-dados-por-id="dadosExtrasDeAbas"
    class="mt2 mb2"
  >
    <template #TabelaDeVariaveis="{ estáAberta }">
      <TabelaDeVariaveis
        v-if="!Variaveis[indicadorId]?.loading && estáAberta"
        :indicador-regionalizavel="!!singleIndicadores?.regionalizavel"
        :variáveis="Variaveis[indicadorId]"
        :parentlink="parentlink"
        :sao-globais="$route.meta.entidadeMãe === 'planoSetorial'"
      >
        <template #dentro-do-menu>
          <li
            v-if="$route.meta.entidadeMãe === 'planoSetorial'"
            class="mr1"
          >
            <button
              type="button"
              class="like-a__text addlink"
              @click="AssociadorDeVariaveisEstaAberto = true"
            >
              <span>Associar variável</span>
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg>
            </button>
          </li>
        </template>
      </TabelaDeVariaveis>
    </template>

    <template
      v-if="$route.meta.entidadeMãe === 'pdm'"
      #TabelaDeVariaveisCompostas="{ estáAberta }"
    >
      <TabelaDeVariaveisCompostas
        v-if="!Variaveis[indicadorId]?.loading && estáAberta"
        :indicador-regionalizavel="!!singleIndicadores?.regionalizavel"
        :variáveis-compostas="Array.isArray(variáveisCompostas[indicadorId])
          ? variáveisCompostas[indicadorId]
          : []"
        :parentlink="parentlink"
      />
    </template>

    <template
      v-if="$route.meta.entidadeMãe === 'pdm'"
      #TabelaDeVariaveisCompostasEmUso="{ estáAberta }"
    >
      <TabelaDeVariaveisCompostasEmUso
        v-if="!Variaveis[indicadorId]?.loading && estáAberta"
        :variáveis-compostas-em-uso="variáveisCompostasEmUso[indicadorId]"
        :parentlink="parentlink"
      />
    </template>

    <template #TabelaDeVariaveisEmUso="{ estáAberta }">
      <TabelaDeVariaveisEmUso
        v-if="!Variaveis[indicadorId]?.loading && estáAberta"
        :parentlink="parentlink"
        :sao-globais="$route.meta.entidadeMãe === 'planoSetorial'"
      />
    </template>
  </EnvelopeDeAbas>

  <template v-if="indicadorId && $route.meta.entidadeMãe === 'planoSetorial'">
    <SmallModal
      v-if="AssociadorDeVariaveisEstaAberto"
      class="largura-total"
      @close="AssociadorDeVariaveisEstaAberto = false"
    >
      <AssociadorDeVariaveis
        :indicador="singleIndicadores"
        @close="AssociadorDeVariaveisEstaAberto = false"
      />
    </SmallModal>
  </template>

  <template v-if="indicadorId && singleIndicadores.id && indicadorId == singleIndicadores.id">
    <hr class="mt2 mb2">
    <button
      class="btn amarelo big"
      @click="checkDelete(singleIndicadores.id)"
    >
      Remover indicador
    </button>
  </template>

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
