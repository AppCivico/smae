<script setup>
import SmallModal from '@/components/SmallModal.vue';
import getCaretPosition from '@/helpers/getCaretPosition.ts';
import {
  computed, onMounted, onUpdated, ref,
} from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  variáveisDoIndicador: {
    type: Array,
    default: () => [],
  },
  variáveisEmUso: {
    type: Array,
    default: () => [],
  },
  variáveisCompostas: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  'update:modelValue',
  'update:variaveis-formula',
]);

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

const formulaInput = ref(null);
const variaveisFormulaModal = ref(0);
const fieldsVariaveis = ref({});
let variaveisFormula = {};
let currentCaretPos = -1;
const errFormula = ref('');

const formula = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);

    emit('update:variaveis-formula', variaveisFormula);
  },
});

const variáveisCompostasPorReferência = computed(() => props.variáveisCompostas
  .reduce((acc, cur) => {
    if (!acc[cur.id]) {
      acc[`@_${cur.id}`] = cur;
    }

    return acc;
  }, {}));

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
  if (p === 0 && m > 1) {
    return `${m} meses atrás`;
  } if (p === -1) {
    return `Média dos últimos ${m} meses`;
  }
  return 'Mês corrente';
}
function formatFormula(p) {
  const regex = /[$@]_[\d]{0,5}/gm;
  const inuse = [];
  const fórmulaLimpa = formula.value.replace(regex, (m) => {
    let r = m;

    if (variaveisFormula[m] || variáveisCompostasPorReferência.value?.[m]) {
      const tipoDeVariável = variáveisCompostasPorReferência.value?.[m]
        ? 'composta'
        : 'padrão';

      let t = '';
      let n;

      switch (tipoDeVariável) {
        case 'composta': {
          // as variáveis compostas não são montadas com chave de posição,
          // mas por ID.
          const variávelComposta = variáveisCompostasPorReferência.value?.[m];
          n = variávelComposta.titulo;
          t = variávelComposta.titulo;
          break;
        }

        default:
          inuse.push(m);
          n = variaveisFormula[m].variavel_id;
          if (props.variáveisDoIndicador?.length) {
            const v = props.variáveisDoIndicador
              .find((x) => x.id === variaveisFormula[m].variavel_id);
            if (v) {
              n = `${v.codigo} - ${v.titulo}`;
              t = labelPeriodo(
                variaveisFormula[m].periodo,
                variaveisFormula[m].meses,
              );
            }
          }
          break;
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
function newVariavel(caracterDefinidor = '$') {
  fieldsVariaveis.value = {};
  switch (caracterDefinidor) {
    case '@':
      variaveisFormulaModal.value = 2;
      break;

    default: {
      const últimoÍndiceDisponívelParaVariávelEmFórmula = Object
        .keys(variaveisFormula)
        .map((x) => Number(x.replace('$_', '')))
        .reduce((a, b) => Math.max(a, b), -Infinity);

      const next = últimoÍndiceDisponívelParaVariávelEmFórmula === -Infinity
        ? '$_1'
        : `$_${últimoÍndiceDisponívelParaVariávelEmFórmula + 1}`;
      fieldsVariaveis.value = {
        id: next,
      };
      fieldsVariaveis.value.periodo = 1;
      formatFormula(next);
      variaveisFormulaModal.value = 1;
      break;
    }
  }
}
function editFormula(e) {
  const f = e.target;
  const v = f.innerText;
  currentCaretPos = getCaretPosition(f);
  formula.value = v;

  switch (true) {
    case e.data === '$':
    case e.data === '@':
      document.execCommand('insertText', false, 'xxx');
      newVariavel(e.data);
      break;

    default:
      // vamos adicionar um espaço após cada operador para facilitar a leitura e
      // prevenir erros de análise da fórmula
      if (operadores.includes(e.data)) {
        document.execCommand('insertText', false, ' ');
      }
      break;
  }
}
function editVariavel(id) {
  const caracterDefinidor = id[0];
  switch (caracterDefinidor) {
    case '@':
      fieldsVariaveis.value = variáveisCompostasPorReferência.value?.[id];
      variaveisFormulaModal.value = 2;
      break;

    default:
      if (variaveisFormula[id]) {
        fieldsVariaveis.value = variaveisFormula[id];
        variaveisFormulaModal.value = 1;
      }
      break;
  }
}
function trackClickFormula(e) {
  const id = e.target?.dataset?.id;

  if (id) {
    // PRA-FAZER: permitir edição de variável composta
    if (id[0] === '@') {
      // eslint-disable-next-line no-alert
      window.alert('Variáveis compostas não editáveis! Apague e crie uma nova.');
      return;
    }
    editVariavel(id);
  }
  currentCaretPos = getCaretPosition(e.target);
}
function chamarInserçãoDeVariável(caracterDefinidor) {
  formula.value = formulaInput.value.innerText;

  setCaret(formulaInput.value, currentCaretPos);
  document.execCommand('insertText', false, `${caracterDefinidor}xxx`);

  newVariavel(caracterDefinidor);
}

function saveVar(tipoDeVariável) {
  const variávelId = fieldsVariaveis.value.id;
  let caracterDefinidor = '$';
  let nova = false;

  switch (tipoDeVariável) {
    case 'composta':
      caracterDefinidor = '@';
      // PRA-FAZER: procurar uma maneira de identificar variáveis já em uso
      nova = true;
      break;

    default:
      nova = !variaveisFormula[variávelId];
      variaveisFormula[variávelId] = fieldsVariaveis.value;
      break;
  }
  variaveisFormulaModal.value = 0;
  if (nova) {
    const v = formula.value;
    const i = v.indexOf(`${caracterDefinidor}xxx`);
    formula.value = [v.slice(0, i), variávelId, v.slice(i + 4)].join('');
  }

  formatFormula(variávelId);
}
function cancelVar() {
  const v = formula.value;
  const i = v.search(/[$@]xxx/);
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

// formatando após o render porque precisa-se do DOM pronto
onMounted(() => {
  variaveisFormula = props.variáveisEmUso.reduce((acc, cur) => {
    let período = 1;

    if (cur.janela < 0) {
      período = -1;
    } else if (cur.janela > 1) {
      período = 0;
    }

    acc[`$${cur.referencia}`] = {
      id: `$${cur.referencia}`,
      periodo: período,
      meses: Math.abs(cur.janela),
      variavel_id: cur.variavel_id,
      usar_serie_acumulada: cur.usar_serie_acumulada,
    };
    return acc;
  }, {});

  formatFormula();
});

// formatando após cada atualização porque não há reatividade real
onUpdated(() => {
  formatFormula();
  setCaret(formulaInput.value, currentCaretPos);
});
</script>
<template>
  <div v-bind="$attrs">
    <label class="label">Fórmula do Agregador</label>
    <div
      ref="formulaInput"
      class="inputtext light mb1 formula"
      contenteditable="true"
      @focus="($ev) => currentCaretPos = getCaretPosition($ev.target)"
      @input="editFormula"
      @keydown="monitorarSetas"
      @click="trackClickFormula"
    />

    <pre v-ScrollLockDebug="'formula'">{{ formula }}</pre>

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
        v-if="variáveisDoIndicador.length"
        class="v"
        @click="chamarInserçãoDeVariável('$')"
      >Variável</span>
      <span
        v-if="variáveisCompostas.length"
        class="v vc"
        @click="chamarInserçãoDeVariável('@')"
      >Variável composta</span>
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

  <!-- modal para variáveis comuns -->
  <SmallModal
    :active="variaveisFormulaModal === 1"
    @close="() => { variaveisFormulaModal = 0; }"
  >
    <form @submit.prevent="saveVar">
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
        v-focus
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
          v-for="v in variáveisDoIndicador"
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

  <!-- modal para variáveis compostas -->
  <SmallModal
    :active="variaveisFormulaModal === 2"
    @close="() => { variaveisFormulaModal = 0; }"
  >
    <form @submit.prevent="saveVar('composta')">
      <h2 class="mb2">
        Adicionar Variável Composta
      </h2>
      <input
        v-model="fieldsVariaveis.id"
        type="hidden"
        name="id"
        class="inputtext light mb1"
      >
      <label class="label">Variável</label>
      <select
        v-if="Array.isArray(variáveisCompostas)"
        v-model="fieldsVariaveis.id"
        v-focus
        class="inputtext light mb1"
        name="id"
      >
        <option value>
          Selecionar
        </option>
        <!--
        para manter o objeto de modo semalhante ao das variáveis comuns,
        vamos combinar o ID com o caracterDefinidor
        -->
        <option
          v-for="v in variáveisCompostas"
          :key="v.id"
          :value="`@_${v.id}`"
        >
          {{ v.titulo }}
        </option>
      </select>
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
