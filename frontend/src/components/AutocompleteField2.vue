<script setup>
import { useField } from 'vee-validate';
import {
  computed,
  onMounted,
  onUpdated,
  ref,
  toRef,
  useTemplateRef,
  watch,
} from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  controlador: {
    type: Object,
    required: true,
    validator(value) {
      return typeof value.busca === 'string' && Array.isArray(value.participantes);
    },
  },
  // lista de opções
  grupo: {
    type: Array,
    default() {
      return [];
    },
    validator(value) {
      return typeof value === 'undefined' || Array.isArray(value);
    },
  },
  // nome da propriedade de cada item de `grupo` que deve ser exibido
  label: {
    type: String,
    required: true,
  },
  // necessária para que o vee-validate não se perca
  name: {
    type: String,
    default: '',
  },
  numeroMaximoDeParticipantes: {
    type: Number,
    default: undefined,
  },
  // usado para campos opcionais que exigem envio do array vazio no back-end
  retornarArrayVazio: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

const control = ref(props.controlador);
const botoesOpcoes = ref([]);
const inputRef = useTemplateRef('inputRef');

const emit = defineEmits(['change']);

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const opcoesFiltradas = computed(() => {
  const busca = normalizar(control.value.busca);
  return props.grupo.filter(
    (x) => !control.value.participantes?.includes(x.id)
      && normalizar(String(x[props.label])).includes(busca),
  );
});

const participantesSelecionados = computed(() =>
  props.grupo.filter((x) => control.value.participantes?.includes(x.id))
);

function abrirLista() {
  if (opcoesFiltradas.value.length === 0) return;
  const botoes = botoesOpcoes.value.filter(Boolean);
  if (botoes.length > 0) {
    botoes[0].focus();
  }
}

function navegarLista(e, indice) {
  const botoes = botoesOpcoes.value.filter(Boolean);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const proximo = indice < botoes.length - 1
      ? indice + 1
      : 0;
    botoes[proximo]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (indice === 0) {
      inputRef.value?.focus();
    } else {
      botoes[indice - 1]?.focus();
    }
  }
}

// se tivermos o nome do campo, podemos habilitar o vee-validate.
// É aqui que deixamos o componente retro-compatível
if (props.name) {
  const name = toRef(props, 'name');
  const { handleChange } = useField(name, undefined, {
    initialValue: props.controlador.participantes,
  });

  watch(() => control.value.participantes, (newValue) => {
    handleChange(newValue);
  });
}

function start() {
  control.value = props.controlador;

  if (props.retornarArrayVazio && props.grupo.length === 0) {
    emit('change', []);
  }
}

const atingiuLimite = computed(() => {
  if (props.numeroMaximoDeParticipantes) {
    return control.value.participantes.length >= props.numeroMaximoDeParticipantes;
  }
  return false;
});

start();
onMounted(() => { start(); });
onUpdated(() => { start(); });

function removeParticipante(item, p) {
  const index = item.participantes.indexOf(p);
  if (index === -1) return;
  item.participantes.splice(index, 1);
  emit('change', item.participantes);
}

function pushId(e, id) {
  if (atingiuLimite.value) {
    return;
  }
  e.push(id);
  emit('change', [...new Set(e)]);
}

function buscar(e, item, g, label) {
  e.preventDefault();
  e.stopPropagation();
  const texto = normalizar(item.busca.trim());

  if (texto) {
    const i = g.find((x) => !item.participantes.includes(x.id)
      && normalizar(String(x[label])).includes(texto));
    if (i) {
      pushId(item.participantes, i.id);
    }
    item.busca = '';
  }
}

function desistir(e) {
  control.value.busca = '';
  e.target.blur();
}
</script>
<template>
  <template v-if="grupo?.length">
    <div class="suggestion search">
      <input
        ref="inputRef"
        v-bind="$attrs"
        v-model="control.busca"
        autocomplete="off"
        type="text"
        class="inputtext light mb05"
        :readonly="readonly || atingiuLimite"
        :aria-readonly="readonly || atingiuLimite"
        @keyup.enter.stop.prevent="buscar($event, control, grupo, label)"
        @keydown.enter.stop.prevent
        @keydown.down.prevent="abrirLista"
        @keyup.esc="desistir($event)"
      >
      <ul>
        <li
          v-for="(r, indice) in opcoesFiltradas"
          :key="r.id"
        >
          <button
            :ref="(el) => { botoesOpcoes[indice] = el }"
            type="button"
            class="like-a__text"
            :title="r.descricao || r.nome || r.titulo || r.nome_completo || undefined"
            @click="pushId(control.participantes, r.id)"
            @keyup.enter.stop.prevent="pushId(control.participantes, r.id)"
            @keydown="navegarLista($event, indice)"
            @keyup.esc="desistir($event)"
          >
            <template v-if="r[label]">
              {{ r[label] }}
            </template>
            <pre
              v-else
              v-ScrollLockDebug
            >id {{ r.id }} sem valor para `r[{{ label
            }}]`, valor da prop `label`!</pre>
          </button>
        </li>
      </ul>
    </div>
    <template v-if="!readonly">
      <button
        v-for="p in participantesSelecionados"
        :key="p.id"
        class="tagsmall"
        :title="p.nome || p.titulo || p.descricao || p.nome_completo || null"
        type="button"
        @click="removeParticipante(control, p.id)"
        @keyup.enter.stop.prevent="removeParticipante(control, p.id)"
        @keyup.esc="desistir($event)"
      >
        {{ p[label] }}
        <svg
          width="12"
          height="12"
        ><use xlink:href="#i_x" /></svg>
      </button>
    </template>
    <span
      v-for="p in participantesSelecionados"
      v-else
      :key="p.id"
      class="tagsmall"
      :title="p.nome || p.titulo || p.descricao || p.nome_completo || null"
    >
      {{ p[label] }}
    </span>
  </template>
  <template v-else>
    <div class="search">
      <input
        v-bind="$attrs"
        type="text"
        aria-disabled="true"
        readonly
        class="inputtext light mb05"
        aria-describedby="alerta"
      >
      <span
        id="alerta"
        class="mensagem-alerta"
        aria-live="polite"
      >
        Não há opções disponíveis.
      </span>
    </div>
  </template>
</template>
<style scoped>
.like-a__text {
  white-space: nowrap;
}

.mensagem-alerta {
  font-size: 0.9rem;
  display: block;
}
</style>
