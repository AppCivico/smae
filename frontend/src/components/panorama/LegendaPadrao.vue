<script setup>
defineProps({
  perfil: {
    type: String,
    default: 'PdM',
    validator(valor) {
      return typeof valor === 'string'
        && [
          'admin_cp',
          'ponto_focal',
          'tecnico_cp',
        ].indexOf(valor) > -1;
    },
  },
});
</script>
<template>
  <div class="mb1">
    <h2 class="mb1 w700 t16">
      Legenda
    </h2>
    <dl>
      <div
        v-if="perfil !== 'ponto_focal'"
        class="flex g1 mb1 center"
      >
        <dt>
          <svg
            width="24"
            height="24"
            color="#EE3B2B"
          ><use xlink:href="#i_clock" /></svg>
        </dt>
        <dd class="f2">
          Conferência
        </dd>
      </div>
      <div class="flex g1 mb1 center">
        <dt>
          <svg
            width="24"
            height="24"
            color="#EE3B2B"
          ><use xlink:href="#i_alert" /></svg>
        </dt>
        <dd class="f2">
          Complementação
        </dd>
      </div>
      <div class="flex g1 mb1 center">
        <dt>
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_calendar" /></svg>
        </dt>
        <dd class="f2">
          Cronograma
        </dd>
      </div>
      <div class="flex g1 mb1 center">
        <dt>
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_$" /></svg>
        </dt>
        <dd class="f2">
          Orçamento
        </dd>
      </div>
      <div
        v-if="perfil !== 'ponto_focal'"
        class="flex g1 mb1 center"
      >
        <dt>
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_iniciativa" /></svg>
        </dt>
        <dd class="f2">
          Qualificação
        </dd>
      </div>
      <div
        v-if="perfil !== 'ponto_focal'"
        class="flex g1 mb1 center"
      >
        <dt>
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_binoculars" /></svg>
        </dt>
        <dd class="f2">
          Análise de Risco
        </dd>
      </div>
      <div
        v-if="perfil !== 'ponto_focal'"
        class="flex g1 mb1 center"
      >
        <dt>
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_check" /></svg>
        </dt>
        <dd class="f2">
          Fechamento
        </dd>
      </div>
    </dl>
  </div>
</template>
