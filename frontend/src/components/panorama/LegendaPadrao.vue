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
  status: {
    type: String,
    default: 'pessoal',
    validator(valor) {
      return typeof valor === 'string'
        && [
          'atrasadas',
          'atualizadas',
          'pendentes',
        ].indexOf(valor) > -1;
    },
  },
});
</script>
<template>
  <div class="legenda-padrão mb1">
    <h2 class="legenda-padrão__título mb1 w700 t16">
      Legenda
    </h2>
    <dl class="legenda-padrão__lista">
      <div
        v-if="status !== 'atualizadas' && perfil !== 'ponto_focal'"
        class="legenda-padrão__item flex g1 mb1 center"
      >
        <dt class="legenda-padrão__ícone f0">
          <svg
            width="24"
            height="24"
            color="#EE3B2B"
          ><use xlink:href="#i_clock" /></svg>
        </dt>
        <dd class="legenda-padrão__descrição f2">
          Conferência
        </dd>
      </div>
      <div
        v-if="status !== 'atualizadas'"
        class="legenda-padrão__item flex g1 mb1 center"
      >
        <dt class="legenda-padrão__ícone f0">
          <svg
            width="24"
            height="24"
            color="#EE3B2B"
          ><use xlink:href="#i_alert" /></svg>
        </dt>
        <dd class="legenda-padrão__descrição f2">
          Complementação
        </dd>
      </div>
      <div class="legenda-padrão__item flex g1 mb1 center">
        <dt class="legenda-padrão__ícone f0">
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_calendar" /></svg>
        </dt>
        <dd class="legenda-padrão__descrição f2">
          Cronograma
        </dd>
      </div>
      <div class="legenda-padrão__item flex g1 mb1 center">
        <dt class="legenda-padrão__ícone f0">
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_$" /></svg>
        </dt>
        <dd class="legenda-padrão__descrição f2">
          Orçamento
        </dd>
      </div>
      <div
        v-if="perfil !== 'ponto_focal'"
        class="legenda-padrão__item flex g1 mb1 center"
      >
        <dt class="legenda-padrão__ícone f0">
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_iniciativa" /></svg>
        </dt>
        <dd class="legenda-padrão__descrição f2">
          Qualificação
        </dd>
      </div>
      <div
        v-if="perfil !== 'ponto_focal'"
        class="legenda-padrão__item flex g1 mb1 center"
      >
        <dt class="legenda-padrão__ícone f0">
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_binoculars" /></svg>
        </dt>
        <dd class="legenda-padrão__descrição f2">
          Análise de Risco
        </dd>
      </div>
      <div
        v-if="perfil !== 'ponto_focal'"
        class="legenda-padrão__item flex g1 mb1 center"
      >
        <dt class="legenda-padrão__ícone f0">
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_check" /></svg>
        </dt>
        <dd class="legenda-padrão__descrição f2">
          Fechamento
        </dd>
      </div>
    </dl>
  </div>
</template>
<style lang="less">
.legenda-padrão {}

.legenda-padrão__título {}

.legenda-padrão__lista {}

.legenda-padrão__item {}

.legenda-padrão__ícone {}

.legenda-padrão__descrição {
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
