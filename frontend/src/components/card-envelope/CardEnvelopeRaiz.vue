<template>
  <div>
    <Swiper
      v-if="ehCarrosel"
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
