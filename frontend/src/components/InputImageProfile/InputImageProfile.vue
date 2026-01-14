<script setup>
import {
  defineProps, ref, useId, watch,
} from 'vue';

const elementId = useId();

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  labelBotao: {
    type: String,
    default: 'carregar foto',
  },
});

const imgSrc = ref(props.modelValue);

watch(() => props.modelValue, (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) {
    imgSrc.value = newValue;
  }
});

const emit = defineEmits(['update:modelValue']);

const handleFile = (file) => {
  if (imgSrc.value) {
    URL.revokeObjectURL(imgSrc.value);
  }

  const fileUrl = URL.createObjectURL(file);
  imgSrc.value = fileUrl;
  emit('update:modelValue', file);
};

const uploadImageFile = (event) => {
  const [file] = event.target.files;
  handleFile(file);
};

const handleDrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  handleFile(file);
};
</script>

<template>
  <div
    class="input-image-profile"
    @dragover.prevent
    @drop="handleDrop"
  >
    <label class="input-image-profile__container">
      <div class="input-image-profile__image-container">
        <img
          v-if="imgSrc"
          :src="imgSrc"
          class="input-image-profile__image"
        >
      </div>
      <input
        :id="elementId"
        type="file"
        accept=".jpg,.png,.jpeg"
        class="input-image-profile__input"
        @change="uploadImageFile"
      >
      <p class="addlink input-image-profile__label">
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg><span class="flex">{{ $props.labelBotao }}</span>
      </p>
    </label>
  </div>
</template>

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
      object-fit: contain;
    }

    &__label{
      width: 100%;
      display: flex;
      justify-content: center;
      margin: 15px 0;
      white-space: nowrap;
    }
}
</style>
