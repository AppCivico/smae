<script lang="ts" setup>
import { computed } from 'vue';

type ItemLegenda = { item: string, icon?: string, html?: string, color?: string };
type Props = {
  titulo?: string,
  legendas: {
    [key in string]: ItemLegenda[]
  } | ItemLegenda[],
  borda?: boolean,
  duasLinhas?: boolean,
  align?: 'left' | 'right' | 'center',
  orientacao?: 'vertical' | 'horizontal'
};

const props = withDefaults(defineProps<Props>(), {
  titulo: 'Legenda',
  orientacao: 'vertical',
  borda: false,
  duasLinhas: false,
  align: 'left',
});

const mostrarEmColunas = computed(() => props.orientacao === 'vertical');

const grupoDeLegendas = computed(() => (Array.isArray(props.legendas)
  ? { default: props.legendas }
  : props.legendas));
</script>

<template>
  <div
    class="lista-legenda"
    :class="{
      'column': mostrarEmColunas,
      'lista-legenda--sem-borda': !$props.borda,
      'lista-legenda--duas-linhas': $props.duasLinhas,
      'lista-legenda--a-direita': $props.align === 'right',
    }"
  >
    <h4
      v-if="$props.titulo"
      class="lista-legenda__titulo t14 w700"
    >
      {{ $props.titulo }}
    </h4>

    <div class="lista-legenda__conteudo flex column g1">
      <dl
        v-for="(legenda, legendaIndex) in grupoDeLegendas"
        :key="`legenda-item--${legendaIndex}`"
        class="flex g1 flexwrap"
        :class="{ 'column': mostrarEmColunas }"
      >
        <div
          v-for="legendaItem in legenda"
          :key="legendaItem.item"
          class="legenda-item"
        >
          <slot
            :name="`padrao--${legendaIndex}`"
            :item="legendaItem"
          >
            <dt
              v-if="!legendaItem.html"
              :style="{ backgroundColor: legendaItem.color }"
              class="legenda-item__icon"
              :class="{ 'legenda-item__icon--apenas-cor': !legendaItem.icon }"
            >
              <svg v-if="legendaItem.icon">
                <use :xlink:href="`#${legendaItem.icon}`" />
              </svg>
            </dt>
            <dt
              class="legenda-item__icon"
              v-html="legendaItem.html"
            />

            <dd>{{ legendaItem.item }}</dd>
          </slot>
        </div>
      </dl>
    </div>
  </div>
</template>

<style lang="less" scoped>
.lista-legenda {
  display: flex;
  gap: 2rem;
  border: 1px solid #b8c0cc;
  padding: 10px;
  border-radius: 10px;

  @media screen and (max-width: 55em) {
    flex-direction: column;
  }
}

.lista-legenda--sem-borda {
  border: 0;
}

.lista-legenda--duas-linhas {
  display: grid;
  gap: 0;
}

.lista-legenda--a-direita {
  justify-items: end;
  justify-content: flex-end;
  text-align: end;
}

.lista-legenda__titulo {
  color: #333333;
}

.legenda-item {
  display: inline-flex;
  white-space: wrap;
  gap: 4px;
  height: 20px;
  align-items: center;
}

:where(.legenda-item) :deep(dt) {
  width: 20px;
  height: 100%;
}

.legenda-item__icon--apenas-cor {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
}

.legenda-item__icon svg {
  width: 100%;
  height: 100%;
}

</style>
