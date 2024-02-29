<script setup>

// defineProps(['img']);
const emit = defineEmits(['uploadImageFile']);
// emit('uploadImageFile');

</script>

<template>
  <div class="input-image-profile">
    <label class="input-image-profile__container">
      <img
        src="@/assets/logo.svg"
        class="input-image-profile__image"
      >
      <input
        id="shapefile"
        type="file"
        accept=".jpg,.png,.jpeg"
        :onchange="uploadImageFile"
        class="input-image-profile__input"
      >
      <p
        class="addlink input-image-profile__label"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg><span>Carregar foto</span>
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

    &__image{
        width: 205px;
    height: 205px;
    background-color: #D9D9D9;
    border-radius: 15%;
    }

    &__label{
        max-width: 140px;
        margin: 15px auto;
    }
}
</style>
