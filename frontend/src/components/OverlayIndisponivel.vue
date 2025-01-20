<template>
  <div
    v-if="temTentarNovamente"
    aria-live="polite"
    class="indisponivel flex justifycenter center"
  >
    <div class="indisponivel__content">
      <div class="flex column text-center g3">
        <slot name="textoDescritivo">
          <p class="w700">
            {{ textoDescritivo }}
          </p>
        </slot>
        <div>
          <button
            type="button"
            class="btn"
            :aria-busy="estaTentandoNovamente"
            @click="recarregarDados"
          >
            {{ estaTentandoNovamente
              ? `Recarregando em ${tempoRestante}
                ${tempoRestante === 1 ? 'segundo' : 'segundos'}...`
              : tentarNovamenteTextoDoBotao }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const emit = defineEmits(['recarregarDados']);

const props = defineProps({
  temTentarNovamente: {
    type: Boolean,
    default: false,
  },
  textoDescritivo: {
    type: String,
    default: '',
  },
  tentarNovamenteTextoDoBotao: {
    type: String,
    default: 'Recarregar',
  },
  tentarNovamenteEm: {
    type: String,
    default: null,
  },
});

const estaTentandoNovamente = ref(false);
const tempoRestante = ref(null);
let tentativaTimeout = null;
let intervaloContagem = null;

function iniciarContagemRegressiva() {
  if (props.tentarNovamenteEm) {
    tempoRestante.value = Math.ceil(props.tentarNovamenteEm);

    intervaloContagem = setInterval(() => {
      if (tempoRestante.value > 1) {
        tempoRestante.value -= 1;
      } else {
        clearInterval(intervaloContagem);
      }
    }, 1000);

    tentativaTimeout = setTimeout(() => {
      emit('recarregarDados');
      estaTentandoNovamente.value = false;
      tempoRestante.value = null;
      clearTimeout(tentativaTimeout);
    }, props.tentarNovamenteEm * 1000);
  }
}

function limparContagem() {
  estaTentandoNovamente.value = false;
  tempoRestante.value = null;
  if (intervaloContagem) {
    clearInterval(intervaloContagem);
    intervaloContagem = null;
  }
  if (tentativaTimeout) {
    clearTimeout(tentativaTimeout);
    tentativaTimeout = null;
  }
}

function recarregarDados() {
  if (!estaTentandoNovamente.value) {
    estaTentandoNovamente.value = true;
    emit('recarregarDados');
    limparContagem();
  }
}

watch(
  () => props.tentarNovamenteEm,
  (novoValor) => {
    limparContagem();
    if (novoValor) {
      estaTentandoNovamente.value = true;
      iniciarContagemRegressiva();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
  .indisponivel {
    inset: 0;
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(9.5px);
    border: 1px solid rgba(255, 255, 255, 0.41);
    z-index: 1;
  }

  .indisponivel__content {
    max-inline-size: 80%;
  }
</style>
