<script lang="ts" setup>
import Swiper from 'swiper';
import { Pagination, Navigation } from 'swiper/modules';
import {
  ref, computed, defineSlots, nextTick, onBeforeUnmount, watch,
} from 'vue';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slots = defineSlots<{
  default(): any
}>();

const elementos = computed(() => slots.default());
const ehCarrosel = computed<boolean>(() => elementos.value.length > 1);

const cardAtual = ref<number>(0);

const carrossel = ref<HTMLElement | null>(null);
const botaoAnterior = ref<HTMLElement | null>(null);
const botaoProximo = ref<HTMLElement | null>(null);
const paginacao = ref<HTMLElement | null>(null);

let swiper: Swiper | null = null;

function selecionarCardAtual(atual: number) {
  cardAtual.value = atual;
}

function destruirCarrossel() {
  swiper?.destroy(true, false);
  swiper = null;
}

watch(carrossel, (elemento) => {
  destruirCarrossel();
  if (!elemento) return;

  swiper = new Swiper(elemento, {
    modules: [Pagination, Navigation],
    slidesPerView: 1,
    spaceBetween: 50,
    noSwipingClass: 'chartContainer',
    navigation: {
      prevEl: botaoAnterior.value,
      nextEl: botaoProximo.value,
      // os ícones vêm do CSS deste componente
      addIcons: false,
    },
    pagination: {
      el: paginacao.value,
      clickable: true,
    },
    on: {
      init: (s) => selecionarCardAtual(s.realIndex),
      slideChange: (s) => selecionarCardAtual(s.realIndex),
    },
  });
}, { flush: 'post' });

watch(() => elementos.value.length, async () => {
  await nextTick();
  swiper?.update();
});

onBeforeUnmount(destruirCarrossel);
</script>

<template>
  <div class="card-envelope-raiz">
    <div
      v-if="ehCarrosel"
      ref="carrossel"
      class="swiper card-envelope-raiz__carrossel"
    >
      <div class="swiper-wrapper">
        <div
          v-for="(elemento, elementoIndex) in elementos"
          :key="elementoIndex"
          class="swiper-slide card-envelope-raiz__slide"
        >
          <component
            :is="elemento"
            :visivel="elementoIndex === cardAtual"
          />
        </div>
      </div>

      <button
        ref="botaoAnterior"
        type="button"
        class="like-a__link swiper-button-prev"
        aria-label="Anterior"
      />
      <button
        ref="botaoProximo"
        type="button"
        class="like-a__link swiper-button-next"
        aria-label="Próximo"
      />
      <div
        ref="paginacao"
        class="swiper-pagination"
      />
    </div>

    <div v-else>
      <slot />
    </div>
  </div>
</template>

<style lang="less" scoped>
.card-envelope-raiz {
  @espacoDeSeguranca: 24px;
  overflow: hidden;
  margin: -@espacoDeSeguranca;
  padding: @espacoDeSeguranca;
  height: calc(100% + (@espacoDeSeguranca * 2));

  :deep {
    .swiper-button-prev,
    .swiper-button-next {
      position: absolute;
      top: 55px;

      z-index: -1;

      display: flex;
      justify-content: center;
      align-items: center;

      &::after {
        font-size: 20px;
        color: #3A3A47;
      }

      &.swiper-button-disabled {
        display: none;
      }
    }

    .swiper-button-prev {
      left: 0;
      transform: translateX(-75%);

      &::after {
        content: url("@{u}icons/left.svg");
      }
    }

    .swiper-button-next {
      right: 0;
      transform: translateX(75%);

      &::after {
        content: url("@{u}icons/right.svg");
      }
    }

    .swiper-pagination {
      transform: translateY(-25px);
    }

    .swiper-pagination-bullet {
      background-color: #D9D9D9;
    }

    .swiper-pagination-bullet-active {
      background-color: #061223;
    }

    .card-envelope-raiz__slide {
      height: auto;

      > * {
        height: 100%;
      }

      &:first-of-type .card-envelope-conteudo {
        margin-left: 0;
      }

      &:last-of-type .card-envelope-conteudo {
        margin-right: 0;
      }
    }
  }

  :deep(.card-envelope-conteudo) {
    // margin: 0 24px;
  }
}

.card-envelope-raiz__carrossel {
  height: 100%;
  overflow: visible;
}
</style>
