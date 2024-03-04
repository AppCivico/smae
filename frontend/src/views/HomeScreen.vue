<script setup>
import módulos from '@/consts/modulosDoSistema';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const emEspera = ref(false);
const erro = ref(null);

const {
  sistemaEscolhido, dadosDoSistemaEscolhido,
} = storeToRefs(authStore);

async function escolher(opção) {
  emEspera.value = true;
  erro.value = null;
  sistemaEscolhido.value = opção;

  authStore.getDados()
    .then(() => {
      // PRA-FAZER: persistir o auth.store no navegador
      localStorage.setItem('sistemaEscolhido', opção);

      if (dadosDoSistemaEscolhido.value?.rotaInicial) {
        router.push(dadosDoSistemaEscolhido.value?.rotaInicial);
      }
    })
    .catch((err) => {
      sistemaEscolhido.value = 'SMAE';
      erro.value = err;
    })
    .finally(() => {
      emEspera.value = false;
    });
}

const listaDeMódulos = Object.keys(módulos).filter((x) => !módulos[x].desabilitado);

const módulosDisponíveis = ref([]);

async function iniciar() {
  emEspera.value = true;
  erro.value = null;

  await authStore.getDados({ 'smae-sistemas': listaDeMódulos.join(',') })
    .then((resposta) => {
      const { sessao: { sistemas } } = resposta;

      if (Array.isArray(sistemas)) {
        módulosDisponíveis.value.splice(0, módulosDisponíveis.value.length, ...sistemas);
      }
    })
    .catch((err) => {
      erro.value = err;
    })
    .finally(() => {
      emEspera.value = false;
    });
}

iniciar();
</script>
<template>
  <div
    v-bind="$attrs"
    class="escolha-de-módulos flex flexwrap g2 spacebetween center p15"
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

    <ul
      v-if="módulosDisponíveis.length"
      class="escolha-de-módulos__lista flex column g2 uc"
    >
      <li
        v-for="(sistema, i) in módulosDisponíveis"
        :key="i"
        class="fb100"
      >
        <button
          type="button"
          class="escolha-de-módulos__opção uc like-a__link tprimary tl t24 w700"
          :disabled="módulos[sistema]?.desabilitado"
          :value="sistema"
          @click="(e) => { escolher(e.target.value) }"
        >
          <svg
            width="8"
            height="16"
          ><use xlink:href="#i_right" /></svg>
          {{ módulos[sistema]?.nome || sistema }}
        </button>
      </li>
    </ul>

    <ErrorComponent
      v-if="erro"
      class="fb100"
    >
      {{ erro }}
    </ErrorComponent>

    <LoadingComponent
      v-if="emEspera"
      class="fb100"
    />
  </div>

  <button
    type="button"
    class="like-a__link mb2"
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
