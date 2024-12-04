<template>
  <div class="card-envelope-raiz">
    <Swiper
      v-if="ehCarrosel"
      class="card-envelope-raiz__carrossel"
      :slides-per-wiew="1"
      :space-between="50"
      :navigation="true"
      :pagination="{ clickable: true }"
      :no-swiping-class="'chartContainer'"
      :modules="[
        Pagination, Navigation,
      ]"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
    >
      <swiper-slide
        v-for="(elemento, elementoIndex) in elementos"
        :key="elementoIndex"
        class="card-envelope-raiz__slide"
      >
        <component
          :is="elemento"
          :visivel="elementoIndex === cardAtual"
        />
      </swiper-slide>
    </Swiper>

    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineSlots } from 'vue';

import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slots = defineSlots<{
  default(): any
}>();

const elementos = computed(() => slots.default());
const ehCarrosel = computed<boolean>(() => elementos.value.length > 1);

const cardAtual = ref<number>(0);

function selecionarCardAtual(atual: number) {
  cardAtual.value = atual;
}

const onSwiper = (swiper) => {
  selecionarCardAtual(swiper.realIndex);
};

const onSlideChange = (swiper) => {
  selecionarCardAtual(swiper.realIndex);
};

</script>

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
      transform: translateX(-100%);

      &::after {
        content: url("@{u}icons/left.svg");
      }
    }

    .swiper-button-next {
      right: 0;
      transform: translateX(100%);

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
