<script setup>
import { Dashboard } from '@/components';
</script>
<template>
  <Dashboard class="dashboard--graficos">
    <div class="flex spacebetween center flexwrap">
      <header>
        <TítuloDePágina>
          Análise
        </TítuloDePágina>
      </header>
    </div>

    <pre>
      &lt;component :is="componenteParaCaregar" /&gt;
    </pre>
  </Dashboard>
</template>
<style lang="less">
.dashboard--graficos {
  background-image: url('@{u}graficos__lines.svg'),
  linear-gradient(to right, #fdf4d8, #b3bbc6);
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
