<script setup></script>
<template>
  Monitoramento de metas
</template>

<style lang="less" modules>
.titulo-monitoramento {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(to right, #e3e5e8, #e3e5e8) no-repeat center;
  background-position: center;
  background-size: 100% 1px;
  background-repeat: no-repeat;
}

.titulo-monitoramento:before {
  position: relative;
  right: auto;
  content: '';
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #f7c234;
  box-shadow: 0 0 0 5px #fff, 0 0 0 6px #e3e5e8;
  background-image: none;
}

.titulo-monitoramento__text {
  margin: 0;
  padding: 0 0.5rem 0 0.5rem;
  background-color: #fff;
}
.ciclo-passado {
  display: flex;
  flex-direction: column;
}

.ciclo-passado h2 {
  margin: 0;
}

.ciclos-anterioes details:nth-child(odd) {
  background-color: #f9f9f9;
}

.ciclo-passado summary {
  display: flex;
  gap: 1rem;
  padding: 2rem 1rem;
}

.ciclo-passado summary::before {
  position: relative;
  right: auto;
  filter: grayscale(1);
}
</style>
