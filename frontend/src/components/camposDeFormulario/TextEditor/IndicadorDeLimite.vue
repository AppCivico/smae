<script lang="ts" setup>
import { computed } from 'vue';

type Props = {
  id: string;
  tamanho: number;
  limite: number;
};

const props = defineProps<Props>();

// abaixo disso a barra fica oculta, para não parecer uma meta de preenchimento
const LIMIAR_EXIBICAO = 0.7;
const LIMIAR_ALERTA = 0.8;
const LIMIAR_PERIGO = 0.95;

const proporcao = computed(() => props.tamanho / props.limite);
// 100% só no limite exato, que ainda é válido; acima dele, no mínimo 101%
const percentual = computed(() => (proporcao.value > 1
  ? Math.ceil(proporcao.value * 100)
  : Math.floor(proporcao.value * 100)));

const faixa = computed(() => {
  if (proporcao.value > 1) return 'excedido';
  if (proporcao.value >= LIMIAR_PERIGO) return 'perigo';
  if (proporcao.value >= LIMIAR_ALERTA) return 'alerta';
  return 'normal';
});

const exibirMedidor = computed(() => proporcao.value >= LIMIAR_EXIBICAO);

// muda só ao trocar de faixa, para o leitor de tela não anunciar a cada tecla
const aviso = computed(() => {
  switch (faixa.value) {
    case 'excedido':
      return 'Limite do campo excedido.';
    case 'perigo':
      return 'Campo quase no limite.';
    case 'alerta':
      return 'Campo próximo do limite.';
    default:
      return '';
  }
});
</script>

<template>
  <div
    :id="$props.id"
    class="indicador-de-limite"
    :class="`indicador-de-limite--${faixa}`"
  >
    <meter
      v-if="exibirMedidor"
      class="indicador-de-limite__medidor"
      min="0"
      :max="$props.limite"
      :low="$props.limite * LIMIAR_ALERTA"
      :high="$props.limite * LIMIAR_PERIGO"
      optimum="0"
      :value="$props.tamanho"
      aria-label="Espaço usado no campo"
    >
      {{ percentual }}%
    </meter>

    <p class="indicador-de-limite__texto t12">
      <span
        v-if="faixa !== 'normal'"
        aria-hidden="true"
      >{{ percentual }}% do limite usado</span>
      <span
        class="indicador-de-limite__aviso"
        aria-live="polite"
      >{{ aviso }}</span>
    </p>
  </div>
</template>

<style lang="less" scoped>
.indicador-de-limite {
  --altura-medidor: 8px;
  --cor-indicador: var(--primary);

  // reserva o espaço do medidor para o conteúdo não pular quando ele aparece
  display: grid;
  grid-template-rows: var(--altura-medidor) auto;
  margin-top: 0.5rem;
}

.indicador-de-limite--alerta {
  --cor-indicador: var(--amarelo);
}

.indicador-de-limite--perigo,
.indicador-de-limite--excedido {
  --cor-indicador: var(--vermelho);
}

.indicador-de-limite__medidor {
  appearance: none;
  display: block;
  width: 100%;
  height: var(--altura-medidor);
  border: 0;
  border-radius: calc(var(--altura-medidor) / 2);
  background: var(--c100);
}

.indicador-de-limite__medidor::-webkit-meter-bar {
  height: var(--altura-medidor);
  border: 0;
  border-radius: calc(var(--altura-medidor) / 2);
  background: var(--c100);
}

.indicador-de-limite__medidor::-webkit-meter-optimum-value,
.indicador-de-limite__medidor::-webkit-meter-suboptimum-value,
.indicador-de-limite__medidor::-webkit-meter-even-less-good-value {
  border-radius: calc(var(--altura-medidor) / 2);
  background: var(--cor-indicador);
}

.indicador-de-limite__medidor::-moz-meter-bar {
  border-radius: calc(var(--altura-medidor) / 2);
  background: var(--cor-indicador);
}

.indicador-de-limite__texto {
  grid-row: 2;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.25rem 0.5em 0;
  min-height: 1.2em;
  color: var(--c400);
}

.indicador-de-limite--perigo .indicador-de-limite__texto,
.indicador-de-limite--excedido .indicador-de-limite__texto {
  color: var(--vermelho);
}

.indicador-de-limite__aviso {
  text-align: right;
}
</style>
