<script setup>
defineProps(['group', 'chave', 'link']);
</script>
<template>
  <div
    v-for="v in group"
    :key="v[chave]?.id"
    class="board_variavel mb2"
  >
    <router-link
      :to="`${link}${v[chave]?.id}`"
      class="block p1"
    >
      <div class="flex center g2 mb1">
        <div
          class="f0"
          style="flex-basis: 2rem;"
        >
          <svg
            width="28"
            height="33"
            viewBox="0 0 32 38"
            color="#8EC122"
            xmlns="http://www.w3.org/2000/svg"
          ><use :xlink:href="`#i_${chave}`" /></svg>
        </div>
        <div class="f1 mt1">
          <h2 class="mb1">
            {{ v[chave]?.codigo }} - {{ v[chave]?.titulo }}
          </h2>
        </div>
      </div>
      <div class="f1 ml2">
        <div class="flex g2 ml2">
          <div class="mr1 f0">
            <div class="t12 uc w700 mb05 tc300">
              ID
            </div>
            <div class="t13">
              {{ v[chave]?.codigo }}
            </div>
          </div>
          <div class="mr1 f1">
            <div class="t12 uc w700 mb05 tc300">
              Órgão responsável
            </div>
            <div class="t13">
              {{ v[chave]?.orgaos_responsaveis?.join(', ') }}
            </div>
          </div>
          <div class="mr1 f1">
            <div class="t12 uc w700 mb05 tc300">
              Órgão participante
            </div>
            <div class="t13">
              {{ v[chave]?.orgaos_participantes?.join(', ') }}
            </div>
          </div>
          <div class="f1">
            <div class="t12 uc w700 mb05 tc300">
              Responsável na coordenadoria de planejamento
            </div>
            <div class="t13">
              {{ v[chave]?.responsaveis_na_cp?.join(', ') }}
            </div>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>
