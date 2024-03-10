<template>
  <div class="input-image-profile">
    <label class="input-image-profile__container">
      <div class="input-image-profile__image-container">
        <img
          v-if="imgSrc"
          :src="imgSrc"
          class="input-image-profile__image"
        >
      </div>
      <input
        id="shapefile"
        type="file"
        accept=".jpg,.png,.jpeg"
        class="input-image-profile__input"
        @change="uploadImageFile"
      >
      <p class="addlink input-image-profile__label">
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg><span>Carregar foto</span>
      </p>
    </label>
  </div>
</template>

<script setup>
import { defineProps, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const imgSrc = ref(props.modelValue);

watch(() => props.modelValue, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    imgSrc.value = newValue;
  }
});

const emit = defineEmits(['update:modelValue']);

const uploadImageFile = (event) => {
  const [file] = event.target.files;
  const fileUrl = URL.createObjectURL(file);
  imgSrc.value = fileUrl;
  emit('update:modelValue', file);
};
</script>

<style scoped lang="less">
.input-image-profile{
    display: flex;

    &__container {
      display: flex;
      flex-direction: column;
    }

    &__input{
      display:none;
    }

    &__image-container{
      width: 205px;
      height: 205px;
      background-color: #D9D9D9;
      border-radius: 15%;
      position: relative;
      overflow: hidden;
    }

    &__image{
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &__label{
      max-width: 140px;
      max-height: 250px;
      margin: 15px auto;
    }
}
</style>
