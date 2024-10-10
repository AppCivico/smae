<template>
  <div class="card-envelope-raiz">
    <Swiper
      v-if="ehCarrosel"
      class="card-envelope-raiz__carrossel"
      :slides-per-wiew="1"
      :space-between="50"
      :navigation="true"
      :pagination="{ clickable: true }"
      :modules="[
        Pagination, Navigation,
      ]"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
    >
      <swiper-slide
        v-for="(elemento, elementoIndex) in elementos"
        :key="elementoIndex"
      >
        <component :is="elemento" />
      </swiper-slide>
    </Swiper>

    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineSlots } from 'vue';

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

const onSwiper = (swiper) => {
  // console.log(swiper);
};
const onSlideChange = () => {
  // console.log('slide change');
};

</script>

<style lang="less" scoped>
.card-envelope-raiz {
  :deep {
    .swiper-button-prev,
    .swiper-button-next {
      position: absolute;
      top: 55px;

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

      &::after {
        content: url("@{u}icons/left.svg");
      }
    }

    .swiper-button-next {
      right: 0;

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

    .swiper-slide {
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
    margin: 0 24px;
  }
}

.card-envelope-raiz__carrossel {
  padding: 10px 0 25px;
}
</style>
