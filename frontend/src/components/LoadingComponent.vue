<script setup>
import { defineProps } from 'vue';
import isValidHtmlTag from '@/helpers/isValidHtmlTag';

defineProps({
  as: {
    type: String,
    default: 'div',
    validator(value) { return isValidHtmlTag(value); },
  },
  sobrepoeConteudo: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <component
    :is="as"
    class="main-loading"
    :class="{ 'main-loading--sobrepoe-conteudo': sobrepoeConteudo }"
  >
    <slot>
      carregando
    </slot>
  </component>
</template>
<style lang="less" scoped>
@import '@/_less/variables.less';

.main-loading {
  color: @c400;
  animation: pulsing 1s linear infinite;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;

  &::before {
    content: '';
    display: block;
    min-height: 3rem;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;
    min-width: 19px;
    background-image: url('data:image/svg+xml;utf8, <svg width="18" height="19" viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg"> <path fill-rule="evenodd" clip-rule="evenodd" d="M9.21429 0C9.68767 0 10.0714 0.391108 10.0714 0.873563V3.05747C10.0714 3.53993 9.68767 3.93103 9.21429 3.93103C8.7409 3.93103 8.35714 3.53993 8.35714 3.05747V0.873563C8.35714 0.391108 8.7409 0 9.21429 0ZM2.71849 2.84045C3.05323 2.49931 3.59594 2.49931 3.93067 2.84045L5.74895 4.69356C6.08368 5.03471 6.08368 5.58782 5.74895 5.92897C5.41421 6.27011 4.8715 6.27011 4.53677 5.92897L2.71849 4.07586C2.38376 3.73471 2.38376 3.1816 2.71849 2.84045ZM15.5326 3.02138C15.8673 3.36252 15.8673 3.91563 15.5326 4.25678L14.3204 5.49219C13.9856 5.83333 13.4429 5.83333 13.1082 5.49219C12.7735 5.15104 12.7735 4.59793 13.1082 4.25678L14.3204 3.02138C14.6551 2.68023 15.1978 2.68023 15.5326 3.02138ZM0 9.3908C0 8.90835 0.383756 8.51724 0.857143 8.51724H3.85714C4.33053 8.51724 4.71429 8.90835 4.71429 9.3908C4.71429 9.87326 4.33053 10.2644 3.85714 10.2644H0.857143C0.383756 10.2644 0 9.87326 0 9.3908ZM15 9.3908C15 8.90835 15.3838 8.51724 15.8571 8.51724H17.1429C17.6162 8.51724 18 8.90835 18 9.3908C18 9.87326 17.6162 10.2644 17.1429 10.2644H15.8571C15.3838 10.2644 15 9.87326 15 9.3908ZM6.17752 12.4857C6.51226 12.8269 6.51226 13.38 6.17752 13.7212L3.75315 16.192C3.41842 16.5331 2.87571 16.5331 2.54097 16.192C2.20624 15.8508 2.20624 15.2977 2.54097 14.9566L4.96534 12.4857C5.30007 12.1446 5.84279 12.1446 6.17752 12.4857ZM13.5368 13.7961C13.8715 13.4549 14.4142 13.4549 14.7489 13.7961L15.355 14.4138C15.6898 14.7549 15.6898 15.3081 15.355 15.6492C15.0203 15.9903 14.4776 15.9903 14.1429 15.6492L13.5368 15.0315C13.202 14.6903 13.202 14.1372 13.5368 13.7961ZM9.21429 13.7586C9.68767 13.7586 10.0714 14.1497 10.0714 14.6322V18.1264C10.0714 18.6089 9.68767 19 9.21429 19C8.7409 19 8.35714 18.6089 8.35714 18.1264V14.6322C8.35714 14.1497 8.7409 13.7586 9.21429 13.7586Z" fill="%23F7C234"><animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 9 9" to="360 9 9" dur="2s" repeatCount="indefinite" /></path> </svg>');
  }

  &.horizontal {
    flex-direction: row;
    justify-content: center;
    gap: 1rem;
  }
}

.main-loading--sobrepoe-conteudo {
  position: absolute;
  inset: 0;
  justify-content: flex-start;
  padding-block-start: 2rem;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(3px);
}

@keyframes pulsing {
  50% {
    color: rgba(255, 255, 255, 0);
  }
}
</style>
