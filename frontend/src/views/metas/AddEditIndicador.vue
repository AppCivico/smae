<script setup>
import { Dashboard, SmallModal } from '@/components';
import { indicador as schema } from '@/consts/formSchemas';
import fieldToDate from '@/helpers/fieldToDate';
import { router } from '@/router';
import {
  useAlertStore, useAtividadesStore, useAuthStore, useEditModalStore, useIndicadoresStore, useIniciativasStore, useMetasStore, useVariaveisStore
} from '@/stores';
import { default as AddEditRealizado } from '@/views/metas/AddEditRealizado.vue';
import { default as AddEditValores } from '@/views/metas/AddEditValores.vue';
import { default as AddEditVariavel } from '@/views/metas/AddEditVariavel.vue';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { onMounted, onUpdated, ref } from 'vue';
import { useRoute } from 'vue-router';
import getCaretPosition from './auxiliares/getCaretPosition.ts';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;
const { indicador_id } = route.params;

const funções = [
  {
    etiqueta: '*',
    operador: '*',
  },
  {
    etiqueta: '/',
    operador: '/',
  },
  {
    etiqueta: '-',
    operador: '-',
  },
  {
    etiqueta: '+',
    operador: '+',
  },
  {
    etiqueta: '^',
    operador: '^',
  },
  {
    etiqueta: 'FLOOR',
    operador: 'FLOOR()',
  },
  {
    etiqueta: 'CEIL',
    operador: 'CEIL()',
  },
  {
    etiqueta: 'ROUND',
    operador: 'ROUND()',
  },
  {
    etiqueta: 'ABS',
    operador: 'ABS()',
  },
  {
    etiqueta: 'DIV',
    operador: 'DIV()',
  },
  {
    etiqueta: 'MOD',
    operador: 'MOD()',
  },
  {
    etiqueta: 'LOG',
    operador: 'LOG()',
  },
  {
    etiqueta: 'FACTORIAL',
    operador: 'FACTORIAL()',
  },
];

const operadores = funções.map((x) => x.operador);

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;
const parentVar = atividade_id ?? iniciativa_id ?? meta_id ?? false;
const parentField = atividade_id ? 'atividade_id' : iniciativa_id ? 'iniciativa_id' : meta_id ? 'meta_id' : false;
const props = defineProps(['group']);

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

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
const { Variaveis } = storeToRefs(VariaveisStore);

let title = 'Adicionar Indicador';
const regionalizavel = ref(singleIndicadores.value.regionalizavel);

const formula = ref('');
const formulaInput = ref(null);
const variaveisFormulaModal = ref(0);
const fieldsVariaveis = ref({});
let variaveisFormula = {};
let currentCaretPos = -1;
const errFormula = ref('');

function start() {
  if (props.group === 'variaveis') editModalStore.modal(AddEditVariavel, props);
  if (props.group === 'valores') {
    editModalStore.modal(AddEditValores, {
      ...props,
      checkClose: () => {
        alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
          editModalStore.clear();
          alertStore.clear();
        });
      },
    });
  }
  if (props.group === 'retroativos') editModalStore.modal(AddEditRealizado, props);
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
    values.casas_decimais = values.casas_decimais ? Number(values.casas_decimais) : null;

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

      values.formula_variaveis = Object.values(variaveisFormula).map((x) => ({
        referencia: x.id.substring(1),
        janela: x.periodo == 0 ? x.meses : x.periodo == -1 ? x.meses * -1 : 1,
        variavel_id: x.variavel_id,
        usar_serie_acumulada: !!x.usar_serie_acumulada,
      })).filter((x) => values.formula.indexOf(x.referencia) != -1);

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
function maskMonth(el) {
  const kC = event.keyCode;
  let data = el.target.value.replace(/[^0-9/]/g, '');
  if (kC != 8 && kC != 46) {
    if (data.length == 2) {
      el.target.value = data += '/';
    } else {
      el.target.value = data;
    }
  }
}
function setCaret(el, p) {
  const range = document.createRange();
  const sel = window.getSelection();

  sel.removeAllRanges();
  if (p) {
    range.selectNodeContents(el);
    if (p && el.childNodes[p[0]]) {
      range.setStart(el.childNodes[p[0]], p[1]);
    }
    range.collapse(true);
    sel.addRange(range);
  } else {
    // https://stackoverflow.com/a/3866442/15425845
    sel.selectAllChildren(el);
    sel.collapseToEnd();
  }
  el.focus();

  currentCaretPos = getCaretPosition(el);
}
function labelPeriodo(p, m) {
  if (p == 0 && m > 1) {
    return `${m} meses atrás`;
  } if (p == -1) {
    return `Média dos últimos ${m} meses`;
  }
  return 'Mês corrente';
}
function formatFormula(p) {
  const regex = /\$_[\d]{0,5}/gm;
  const inuse = [];
  const fórmulaLimpa = formula.value.replace(regex, (m) => {
    let r = m;
    if (variaveisFormula[m]) {
      inuse.push(m);
      let n = variaveisFormula[m].variavel_id;
      let t = '';
      if (Variaveis.value[indicador_id]?.length) {
        const v = Variaveis.value[indicador_id]
          .find((x) => x.id == variaveisFormula[m].variavel_id);
        if (v) {
          n = `${v.codigo} - ${v.titulo}`;
          t = labelPeriodo(variaveisFormula[m].periodo, variaveisFormula[m].meses);
        }
      }

      r = ` <span class="v" contenteditable="false" data-id="${m}" data-var="${n}" title="${t}" >${m}</span> `;
    }
    return r;
  });

  Object.entries(variaveisFormula).forEach((k) => {
    if (inuse.indexOf(k) === -1) delete variaveisFormula[k];
  });

  formulaInput.value.innerHTML = `${fórmulaLimpa} `.replace(/\s+/g, ' ');

  if (p) {
    const i = Array.from(formulaInput.value.childNodes).findIndex((x) => x?.dataset?.id === p);
    if (i === -1) {
      // Se a variável ainda não foi encontrada, deve ser a primeira.
      // Então, vamos mover o cursor piscante para o final
      setCaret(formulaInput.value);
    } else {
      setCaret(formulaInput.value, [i + 1, 0]);
    }
  }
}
function editFormula(e) {
  const f = e.target;
  const v = f.innerText;
  currentCaretPos = getCaretPosition(f);
  formula.value = v;

  if (e.data == '$') {
    document.execCommand('insertText', false, 'xxx');
    newVariavel();

    // vamos adicionar um espaço após cada operador para facilitar a leitura e
    // prevenir erros de análise da fórmula
  } else if (operadores.includes(e.data)) {
    document.execCommand('insertText', false, ' ');
  }
}
function trackClickFormula(e) {
  const id = e.target?.dataset?.id;
  if (id) {
    editVariavel(id);
  }
  currentCaretPos = getCaretPosition(e.target);
}
function chamarInserçãoDeVariável() {
  formula.value = formulaInput.value.innerText;

  setCaret(formulaInput.value, currentCaretPos);
  document.execCommand('insertText', false, '$xxx');

  newVariavel();
}
function newVariavel() {
  const vs = variaveisFormula ? Object.keys(variaveisFormula) : [];
  const next = vs.length ? `$_${Number(vs[vs.length - 1].replace('$_', '')) + 1}` : '$_1';
  fieldsVariaveis.value = {
    id: next,
  };
  fieldsVariaveis.value.periodo = 1;
  formatFormula(next);
  variaveisFormulaModal.value = 1;
}
function editVariavel(id) {
  if (variaveisFormula[id]) {
    fieldsVariaveis.value = variaveisFormula[id];
    variaveisFormulaModal.value = 1;
  }
}
function saveVar(e) {
  e.preventDefault();
  const nova = !variaveisFormula[fieldsVariaveis.value.id];
  variaveisFormula[fieldsVariaveis.value.id] = fieldsVariaveis.value;
  variaveisFormulaModal.value = 0;
  if (nova) {
    const v = formula.value;
    const i = v.indexOf('$xxx');
    const { id } = fieldsVariaveis.value;
    formula.value = [v.slice(0, i), id, v.slice(i + 4)].join('');
  }
  formatFormula(fieldsVariaveis.value.id);
}
function cancelVar() {
  const v = formula.value;
  const i = v.indexOf('$xxx');
  if (i !== -1) formula.value = [v.slice(0, i), v.slice(i + 4)].join('');
  formatFormula(fieldsVariaveis.value.id);
  variaveisFormulaModal.value = 0;
}
function addFunction(f) {
  setCaret(formulaInput.value, currentCaretPos);
  document.execCommand('insertText', false, `${f} `);
}
// vamos usar `onkeydown` porque é o único evento disparado pelas teclas de
// navegação em todos os navegadores
function monitorarSetas(e) {
  console.debug(e.key);
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown':
    case 'Home':
    case 'End':
      currentCaretPos = getCaretPosition(e.target);
      break;
    default:
      break;
  }
}

if (indicador_id) {
  title = 'Editar Indicador';

  Promise.all([
    IndicadoresStore.getById(indicador_id),
    VariaveisStore.getAll(indicador_id),
  ]).then(() => {
    if (singleIndicadores.value.formula) {
      formula.value = singleIndicadores.value.formula;
      variaveisFormula = {};
      singleIndicadores.value.formula_variaveis.forEach((x) => {
        variaveisFormula[`$${x.referencia}`] = {
          id: `$${x.referencia}`,
          periodo: x.janela < 0 ? -1 : x.janela > 1 ? 0 : 1,
          meses: Math.abs(x.janela),
          variavel_id: x.variavel_id,
          usar_serie_acumulada: x.usar_serie_acumulada,
        };
      });
      formatFormula();
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

<template>
  <Dashboard>
    <div class="flex spacebetween center">
      <h1>{{ title }}</h1>
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
        v-slot="{ errors, isSubmitting }"
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
              <div class="tipinfo right ml1">
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
                v-model="regionalizavel"
                name="regionalizavel"
                type="checkbox"
                value="1"
                class="inputcheckbox"
              /><span :class="{ 'error': errors.regionalizavel }">Indicador regionalizável</span>
            </label>
            <div class="error-msg">
              {{ errors.regionalizavel }}
            </div>
          </div>
          <div
            v-if="regionalizavel"
            class=""
          >
            <label class="label">Nível de regionalização <span class="tvermelho">*</span></label>
            <Field
              v-model="nivel_regionalizacao"
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
            <label class="flex">
              <Field
                v-slot="{ field }"
                name="regionalizavel"
                type="checkbox"
                :value="true"
              >
                <input
                  type="checkbox"
                  name="regionalizavel"
                  v-bind="field"
                  :value="true"
                  class="inputcheckbox"
                  disabled
                >
                <span>Indicador regionalizável</span>
              </Field>
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
              v-model="nivel_regionalizacao"
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
          <label class="label">Fórmula do Agregador</label>
          <div
            ref="formulaInput"
            class="inputtext light mb1 formula"
            contenteditable="true"
            @input="editFormula"
            @keydown="monitorarSetas"
            @click="trackClickFormula"
          />

          <p
            v-if="errFormula"
            class="error-msg"
          >
            {{ errFormula }}
          </p>
          <p class="tc300 mb1">
            Passe o mouse sobre as variáveis para detalhes sobre o período e operação
          </p>

          <label class="label">Adicionar operadores </label>
          <div class="formula">
            <span
              class="v"
              @click="chamarInserçãoDeVariável"
            >Variável</span>
            <span
              v-for="(item, index) in funções"
              :key="index"
              class="op"
              @click="addFunction(item.operador)"
            >{{ item.etiqueta }}</span>
          </div>

          <p class="tc300 mb1">
            Para adicionar uma variável, posicione o cursor piscante no ponto em
            que deseja inserí-la e digite <kbd>$</kbd>. Um formulário aparecerá
            para te auxiliar.
          </p>
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
      <template v-if="indicador_id && !Variaveis[indicador_id]?.loading">
        <SmallModal
          :active="variaveisFormulaModal"
          @close="() => { variaveisFormulaModal = !variaveisFormulaModal; }"
        >
          <form @submit="saveVar">
            <h2 class="mb2">
              Adicionar Variável
            </h2>
            <input
              v-model="fieldsVariaveis.id"
              type="hidden"
              name="id"
              class="inputtext light mb1"
            >
            <label class="label">Variável</label>
            <select
              v-model="fieldsVariaveis.variavel_id"
              class="inputtext light mb1"
              name="variavel_id"
            >
              <option
                value
                :selected="!fieldsVariaveis.variavel_id"
              >
                Selecionar
              </option>
              <option
                v-for="v in Variaveis[indicador_id]"
                :key="v.id"
                :value="v.id"
              >
                {{ v.codigo }} - {{ v.titulo }}
              </option>
            </select>
            <label class="block mb1"><input
              v-model="fieldsVariaveis.periodo"
              type="radio"
              class="inputcheckbox"
              value="1"
            ><span>Mês corrente</span></label>
            <label class="block mb1"><input
              v-model="fieldsVariaveis.periodo"
              type="radio"
              class="inputcheckbox"
              value="0"
            ><span>Média</span></label>
            <label class="block mb1"><input
              v-model="fieldsVariaveis.periodo"
              type="radio"
              class="inputcheckbox"
              value="-1"
            ><span>Mês anterior</span></label>

            <label class="block mt2 mb2"><input
              v-model="fieldsVariaveis.usar_serie_acumulada"
              type="checkbox"
              class="inputcheckbox"
              value="1"
            ><span>Utilizar valores acumulados</span></label>

            <template v-if="fieldsVariaveis.periodo != 1">
              <label class="label">Meses</label>
              <input
                v-model="fieldsVariaveis.meses"
                type="number"
                name="meses"
                min="1"
                required
                class="inputtext light mb1"
              >

              <p class="t300 tc500">
                Para uma média móvel, insira o numero de meses considerados.<br>
                Para ”mês anterior”, indique quantos meses atrás em relação ao mês
                corrente está o valor da variável.
              </p>
            </template>

            <div class="tc">
              <a
                class="btn outline bgnone tcprimary"
                @click="cancelVar()"
              >Cancelar</a>
              <button class="ml1 btn">
                Salvar
              </button>
            </div>
          </form>
        </SmallModal>
      </template>
    </template>
    <template v-if="singleIndicadores?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="singleIndicadores?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ singleIndicadores.error ?? error }}
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
        <router-link
          :to="`${parentlink}`"
          class="btn big mt1 mb1"
        >
          <span>Voltar</span>
        </router-link>
      </div>
    </template>

    <div v-if="indicador_id">
      <div class="t12 uc w700 mb2">
        Variáveis
      </div>
      <template v-if="Variaveis[indicador_id]?.loading">
        <span class="spinner">Carregando</span>
      </template>
      <table
        v-if="!Variaveis[indicador_id]?.loading"
        class="tablemain mb1"
      >
        <thead>
          <tr>
            <th style="width:13.3%;">
              Título
            </th>
            <th style="width:13.3%;">
              Valor base
            </th>
            <th style="width:13.3%;">
              Unidade
            </th>
            <th style="width:13.3%;">
              Peso
            </th>
            <th style="width:13.3%;">
              Casas decimais
            </th>
            <th style="width:13.3%;">
              Região
            </th>
            <th style="width:20%" />
          </tr>
        </thead>
        <tr
          v-for="v in Variaveis[indicador_id]"
          :key="v.id"
        >
          <td>{{ v.titulo }}</td>
          <td>{{ v.valor_base }}</td>
          <td>{{ v.unidade_medida?.sigla }}</td>
          <td>{{ v.peso }}</td>
          <td>{{ v.casas_decimais }}</td>
          <td>{{ v.regiao?.descricao ?? '-' }}</td>
          <td style="white-space: nowrap; text-align: right;">
            <router-link
              :to="`${parentlink}/indicadores/${indicador_id}/variaveis/novo/${v.id}`"
              class="tipinfo tprimary"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_copy" /></svg><div>Duplicar</div>
            </router-link>
            <router-link
              :to="`${parentlink}/indicadores/${indicador_id}/variaveis/${v.id}`"
              class="tipinfo tprimary ml1"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg><div>Editar</div>
            </router-link>
            <router-link
              :to="`${parentlink}/indicadores/${indicador_id}/variaveis/${v.id}/valores`"
              class="tipinfo right tprimary ml1"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_valores" /></svg><div>Valores Previstos e Acumulados</div>
            </router-link>
            <router-link
              v-if="perm.CadastroPessoa?.administrador"
              :to="`${parentlink}/indicadores/${indicador_id}/variaveis/${v.id}/retroativos`"
              class="tipinfo right tprimary ml1"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_check" /></svg><div>Valores Realizados Retroativos</div>
            </router-link>
          </td>
        </tr>
      </table>
      <router-link
        :to="`${parentlink}/indicadores/${indicador_id}/variaveis/novo`"
        class="addlink"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg> <span>Adicionar variável</span>
      </router-link>
    </div>

    <template v-if="indicador_id && singleIndicadores.id && indicador_id == singleIndicadores.id">
      <hr class="mt2 mb2">
      <button
        class="btn amarelo big"
        @click="checkDelete(singleIndicadores.id)"
      >
        Remover item
      </button>
    </template>
  </Dashboard>
</template>
