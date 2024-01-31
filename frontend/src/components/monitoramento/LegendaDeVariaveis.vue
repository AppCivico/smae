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
  <div class="legenda legenda--variáveis">
    <h2 class="legenda__título mb1 w700 t16">
      Legenda
    </h2>
    <dl class="legenda__lista flex g1 mb1 flexwrap">
      <div class="legenda__item flex g05 center">
        <dt class="legenda__ícone f0">
          <svg
            width="20"
            height="20"
            color="#4c626d"
          ><use xlink:href="#i_circle" /></svg>
        </dt>
        <dd class="legenda__descrição f2">
          Coleta
        </dd>
      </div>
      <div class="legenda__item flex g05 center">
        <dt class="legenda__ícone f0">
          <svg
            width="20"
            height="20"
            color="#4c626d"
          ><use xlink:href="#i_alert" /></svg>
        </dt>
        <dd class="legenda__descrição f2">
          Complementação
        </dd>
      </div>
    </dl>

    <Transition name="fade">
      <dl
        v-if="perfil && perfil !== 'ponto_focal'"
        class="legenda__lista flex g1 mb1 flexwrap"
      >
        <div class="legenda__item flex g05 center">
          <dt class="legenda__ícone f0">
            <svg
              width="24"
              height="24"
            ><use xlink:href="#i_iniciativa" /></svg>
          </dt>
          <dd class="legenda__descrição f2">
            Qualificação
          </dd>
        </div>
        <div class="legenda__item flex g05 center">
          <dt class="legenda__ícone f0">
            <svg
              width="24"
              height="24"
            ><use xlink:href="#i_binoculars" /></svg>
          </dt>
          <dd class="legenda__descrição f2">
            Análise de Risco
          </dd>
        </div>

        <div class="legenda__item flex g05 center">
          <dt class="legenda__ícone f0">
            <svg
              width="24"
              height="24"
            ><use xlink:href="#i_check" /></svg>
          </dt>
          <dd class="legenda__descrição f2">
            Fechamento
          </dd>
        </div>
      </dl>
    </Transition>

    <ul class="legenda__lista flex g1 mb1 flexwrap">
      <li
        class="legenda__item w900"
        style="color: #f2890d"
      >
        Enviar
      </li>

      <li
        class="legenda__item w900"
        style="color: #ee3b2b"
      >
        Preencher
      </li>

      <li
        v-if="perfil && perfil !== 'ponto_focal'"
        class="legenda__item w900"
        style="color: #4074bf"
      >
        Conferir
      </li>

      <li
        v-if="perfil && perfil !== 'ponto_focal'"
        class="legenda__item w900"
        style="color: #8ec122"
      >
        Atualizado
      </li>
    </ul>
  </div>
</template>
