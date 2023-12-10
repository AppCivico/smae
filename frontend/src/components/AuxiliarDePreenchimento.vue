<script setup>
function openParent(e) {
  e.target.closest('.accordeon').classList.toggle('active');
}
</script>
<template>
  <div class="auxiliar-de-preenchimento accordeon mb2 pb1">
    <div
      class="flex center pt1"
      @click="openParent"
    >
      <span class="t0"><svg
        class="arrow"
        width="13"
        height="8"
      ><use xlink:href="#i_down" /></svg></span> Auxiliar de preenchimento
    </div>
    <div
      class="content mt1 pb1"
    >
      <slot />
    </div>
  </div>
</template>
<style lang="less">
.auxiliar-de-preenchimento {
  color: @c400;
  transition-property: color;
  transition-duration: 300ms;
  background-color: white;
  z-index: 1;

  &.active {
    position: sticky;
    top: -3rem;
    color: inherit;

    &::after {
      background-image:
        linear-gradient(to bottom, fade(black, 3.5) 0px, transparent 20px);
      content: '';
      position: absolute;
      pointer-events: none;
      border-radius: 6px 6px 0 0;
      top: 100%;
      left: -6px;
      right: -6px;
      height: 20px;
    }

    +hr {
      display: none;
    }
  }
}
</style>
