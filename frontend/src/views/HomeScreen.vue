<script setup lang="ts">
import { storeToRefs } from 'pinia';

import type { ModulosDoSistema } from '@/consts/modulosDoSistema';
import módulos from '@/consts/modulosDoSistema';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

const {
  user: sessao,
  modulosAcessiveis,
  modulosDisponiveis,
  chamadasPendentes,
  erros,
} = storeToRefs(authStore);

authStore.carregarModulos();
</script>
<template>
  <div
    v-bind="$attrs"
    class="escolha-de-módulos flex flexwrap g2 spacebetween center p15"
  >
    <div class="escolha-de-módulos__cumprimento flex column">
      <p
        v-if="sessao"
        class="w700 t36"
      >
        Olá, {{ sessao.nome_exibicao }}!
      </p>
      <p class="w700 t64">
        Bem-vindo(a) ao
        <abbr title="Sistema de Monitoramento e Acompanhamento Estratégico">
          SMAE
        </abbr>
      </p>
      <p class="w700 t24 tamarelo">
        Selecione o módulo a ser visualizado:
      </p>

      <div class="mt4 logos flex g2 center bgb p05">
        <img
          class="logos__sp-imagem mr1"
          src="@/assets/sp.png"
        >
        <div class="flex center">
          <span class="logos__powered-by">Realização</span>
          <img
            class="logos__fgv-imagem"
            src="@/assets/fgv-projetos.jpg"
          >
        </div>
      </div>
    </div>

    <ul
      v-if="modulosDisponiveis.length"
      class="escolha-de-módulos__lista flex column g2 uc"
    >
      <li
        v-for="(sistema, k) in modulosDisponiveis"
        :key="k"
      >
        <button
          type="button"
          class="escolha-de-módulos__opção opção uc like-a__link tprimary tl t24 w700
        flex g05 center"
          :disabled="!módulos[sistema as keyof ModulosDoSistema]?.rotaInicial
            || !modulosAcessiveis.includes(sistema)"
          @click="authStore.escolherModulo(sistema)"
        >
          <img
            v-if="módulos[sistema as keyof ModulosDoSistema]?.ícone"
            :src="módulos[sistema as keyof ModulosDoSistema]?.ícone"
            class="opção__ícone"
            aria-hidden="true"
            width="48"
            height="48"
            alt=""
          >
          <span class="opção__nome">
            {{ módulos[sistema as keyof ModulosDoSistema]?.nome || sistema }}
          </span>
        </button>
      </li>
    </ul>

    <ErrorComponent
      v-if="erros.listarModulos || erros.escolherModulo"
      class="fb100"
    >
      {{ erros.listarModulos || erros.escolherModulo }}
    </ErrorComponent>

    <LoadingComponent
      v-if="chamadasPendentes.listarModulos || chamadasPendentes.escolherModulo"
      class="fb100"
    />
  </div>

  <button
    type="button"
    class="escolha-de-módulos__botão-de-saída like-a__link mb2"
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
        d="M3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1
        0-1H3V2zm1 13h8V2H4v13z"
      />
      <path d="M9 9a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
    </svg>
    Sair
  </button>
</template>
<style lang="less" scoped>
.escolha-de-módulos {
  margin: auto;
  max-width: 64rem;

  abbr {
    text-decoration: none;
  }
}

.escolha-de-módulos__cumprimento {
  flex-grow: 1;
  flex-basis: calc(65% - 2rem);
  min-width: 22em;

  p {
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.escolha-de-módulos__lista {
  flex-grow: 1;
  flex-basis: calc(35% - 2rem);
  min-width: 15em;
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
  max-width: 100%;

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

.opção {
}

.opção__ícone {
  flex-grow: 0;
}

.opção__nome {
  min-width: 0;
  text-overflow: ellipsis;
  overflow: hidden;
}

.escolha-de-módulos__botão-de-saída {
  max-width: max-content;
  margin-right: auto;
  margin-left: auto;
}

.logos__sp-imagem {
  width: 8rem;
  height: 100%;
}

.logos__powered-by {
  font-size: 0.857rem;
}

.logos__fgv-imagem {
  width: 18rem;
  height: 100%;
}
</style>
