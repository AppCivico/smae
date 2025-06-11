<script setup>
import { useField } from 'vee-validate';
import {
  onMounted, onUpdated, ref, toRef, watch, computed,
} from 'vue';

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

const emit = defineEmits(['change']);

// se tivermos o nome do campo, podemos habilitar o vee-validate.
// É aqui que deixamos o componente retro-compatível
if (props.name) {
  const name = toRef(props, 'name');
  const { handleChange } = useField(name, undefined, {
    initialValue: props.controlador.participantes,
  });

  watch(control.value.participantes, (newValue) => {
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
  item.participantes.splice(item.participantes.indexOf(p), 1);
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
  if (e.keyCode === 13) {
    const i = g.find((x) => !item.participantes.includes(x.id)
      && String(x[label]).toLowerCase().includes(item.busca.toLowerCase()));
    if (i) {
      pushId(item.participantes, i.id);
    }
    item.busca = '';
  }
}
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <template v-if="grupo?.length">
    <div class="suggestion search">
      <input
        v-bind="$attrs"
        v-model="control.busca"
        type="text"
        class="inputtext light mb05"
        :readonly="readonly || atingiuLimite"
        :aria-readonly="readonly || atingiuLimite"
        @keyup.enter.stop.prevent="buscar($event, control, grupo, label)"
      >
      <ul>
        <li
          v-for="r in grupo.filter((x) => !control.participantes?.includes(x.id)
            && String(x[label])?.toLowerCase().includes(control.busca.toLowerCase()))"
          :key="r.id"
        >
          <button
            type="button"
            class="like-a__text"
            tabindex="1"
            :title="r.nome || r.titulo || r.descricao || r.nome_completo || undefined"
            @click="pushId(control.participantes, r.id)"
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
        v-for="p in grupo.filter((x) => control.participantes?.includes(x.id))"
        :key="p.id"
        class="tagsmall"
        :title="p.nome || p.titulo || p.descricao || p.nome_completo || null"
        type="button"
        @click="removeParticipante(control, p.id)"
      >
        {{ p[label] }}
        <svg
          width="12"
          height="12"
        ><use xlink:href="#i_x" /></svg>
      </button>
    </template>
    <span
      v-for="p in grupo.filter((x) => control.participantes?.includes(x.id))"
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
