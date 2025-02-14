<script setup lang="ts">
import type { Modulo, ModulosDoSistema, RotaInicial } from '@/consts/modulosDoSistema';
import módulos from '@/consts/modulosDoSistema';
import requestS from '@/helpers/requestS';
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store';
import { useAuthStore } from '@/stores/auth.store';
import { useMacrotemasStore } from '@/stores/macrotemas.store';
import { useMacrotemasPsStore } from '@/stores/macrotemasPs.store';
import { useMetasStore } from '@/stores/metas.store';
import { usePsMetasStore } from '@/stores/metasPs.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useProcessosStore } from '@/stores/processos.store';
import { useRegionsStore } from '@/stores/regions.store';
import { useTarefasStore } from '@/stores/tarefas.store';
import { useUsersStore } from '@/stores/users.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const authStore = useAuthStore();
const router = useRouter();

const emEspera = ref(false);
const erro = ref(null);
const sessao = ref(null);

const {
  dadosDoSistemaEscolhido,
  sistemaEscolhido,
  rotaEhPermitida,
} = storeToRefs(authStore);

const módulosAcessíveis = ref([]);
const módulosDisponíveis = ref([]);

// PRA-FAZER: mover para o gerenciador de estado `auth.store`
async function escolher(opção: keyof ModulosDoSistema) {
  emEspera.value = true;
  erro.value = null;
  sistemaEscolhido.value = opção;

  authStore.getDados(null, { headers: { 'smae-sistemas': `SMAE,${opção}` } })
    .then(() => {
      // PRA-FAZER: persistir o auth.store no navegador
      localStorage.setItem('sistemaEscolhido', opção);

      if (dadosDoSistemaEscolhido.value?.rotaInicial) {
        const listaDeRotasPossiveis = !Array.isArray(dadosDoSistemaEscolhido.value?.rotaInicial)
          ? [dadosDoSistemaEscolhido.value?.rotaInicial]
          : dadosDoSistemaEscolhido.value?.rotaInicial;

        const rotaFiltrada = listaDeRotasPossiveis
          .find((rota: RotaInicial) => rotaEhPermitida.value(rota.name));

        if (rotaFiltrada) {
          router.push(rotaFiltrada);
        } else {
          router.push({ name: 'cadastrosBasicos' });
        }
      }

      useRegionsStore().$reset();
      useUsersStore().$reset();
      useTarefasStore().$reset();
      useOrcamentosStore().$reset();
      usePsMetasStore().$reset();
      useMetasStore().$reset();
      useProcessosStore().$reset();
      useAcompanhamentosStore().$reset();
      useMacrotemasStore().$reset();
      useMacrotemasPsStore().$reset();
    })
    .catch((err) => {
      sistemaEscolhido.value = 'SMAE';
      erro.value = err;
    })
    .finally(() => {
      emEspera.value = false;
    });
}

async function iniciar() {
  emEspera.value = true;
  erro.value = null;

  requestS.get(`${baseUrl}/minha-conta`, null, { headers: { 'smae-sistemas': Object.keys(módulos).join(',') } })
    .then((resposta) => {
      const { sessao: { sistemas, sistemas_disponiveis: sistemasDisponiveis } } = resposta;
      sessao.value = resposta.sessao;
      if (Array.isArray(sistemas)) {
        módulosAcessíveis.value.splice(0, módulosAcessíveis.value.length, ...sistemas);
        módulosDisponíveis.value.splice(0, módulosDisponíveis.value.length, ...sistemasDisponiveis);
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
    </div>

    <ul
      v-if="módulosDisponíveis.length"
      class="escolha-de-módulos__lista flex column g2 uc"
    >
      <li
        v-for="(sistema, k) in módulosDisponíveis"
        :key="k"
      >
        <button
          type="button"
          class="escolha-de-módulos__opção opção uc like-a__link tprimary tl t24 w700
        flex g05 center"
          :disabled="!módulos[sistema as keyof ModulosDoSistema]?.rotaInicial
            || !módulosAcessíveis.includes(sistema)"
          @click="escolher(sistema)"
        >
          <img
            v-if="módulos[sistema as keyof ModulosDoSistema]?.ícone"
            :src="módulos[sistema as keyof ModulosDoSistema].ícone"
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
</style>
