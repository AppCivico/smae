<script setup>
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'vue-router';
import módulos from '@/consts/modulosDoSistema';

const authStore = useAuthStore();
const router = useRouter();

const {
  sistemaEscolhido, dadosDoSistemaEscolhido,
} = storeToRefs(authStore);

function escolher(opção) {
  sistemaEscolhido.value = opção;

  localStorage.setItem('sistemaEscolhido', opção);

  if (dadosDoSistemaEscolhido.value?.rotaInicial) {
    router.push(dadosDoSistemaEscolhido.value?.rotaInicial);
  }
}
</script>
<template>
  <div
    v-bind="$attrs"
    class="escolha-de-módulos flex flexwrap g2 spacebetween center"
  >
    <div class="escolha-de-módulos__cumprimento flex column">
      <p class="w700 t64">
        Bem-vindo ao
        <abbr title="Sistema de Monitoramento e Acompanhamento Estratégico">
          SMAE
        </abbr>
      </p>
      <p class="w700 t24 tamarelo">
        Selecione o módulo a ser visualizado:
      </p>
    </div>

    <ul class="escolha-de-módulos__lista flex column g2 uc">
      <li
        v-for="(módulo, i) in módulos"
        :key="i"
        class="fb100"
      >
        <button
          type="button"
          class="escolha-de-módulos__opção uc like-a__link tprimary tl t24 w700"
          :disabled="módulo.desabilitado"
          :value="módulo.valor"
          @click="(e) => { escolher(e.target.value) }"
        >
          <svg
            width="8"
            height="16"
          ><use xlink:href="#i_right" /></svg>

          {{ módulo.nome }}
        </button>
      </li>
    </ul>
  </div>

  <button
    type="button"
    class="like-a__link mb1"
    @click="authStore.logout()"
  >
    <svg
      width="22"
      height="22"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path
        d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V2zm1 13h8V2H4v13z"
      />
      <path d="M9 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
    </svg>
    Sair
  </button>
</template>
<style lang="less">
.escolha-de-módulos {
  margin: auto;
  max-width: 64rem;

  abbr {
    text-decoration: none;
  }
}

.escolha-de-módulos__cumprimento {
  flex-basis: calc(65% - 2rem);
}

.escolha-de-módulos__lista {
  flex-basis: calc(35% - 2rem);
}

.escolha-de-módulos :disabled {
  color: @c200;

  &:hover,
  &:focus {
    color: @c200;
  }
}

.escolha-de-módulos__opção {
  position: relative;

  &:hover,
  &:focus {
    color: @amarelo;
  }

  &:active {
    color: @c600;
  }

  svg {
    position: absolute;
    right: calc(100% + 0.5rem);
    top: 50%;
    transform: translateY(-50%);
  }
}
</style>
