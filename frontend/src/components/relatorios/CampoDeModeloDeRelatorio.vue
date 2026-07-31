<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useFieldError, useFormValues,
} from 'vee-validate';
import { computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import ListaAninhada from '@/components/ListaAninhada.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useModelosDeRelatorioStore } from '@/stores/modelosDeRelatorio.store';

import LoadingComponent from '../LoadingComponent.vue';
import SmaeLink from '../SmaeLink.vue';

defineProps({
  // Só pra `LabelFromYup`/`SmaeLabel` resolverem o rótulo de `modelo_id` — o schema de cada
  // formulário que usa este campo precisa declará-lo (mesmo `.nullable()`, sem `.required()`).
  schema: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const { sistemaEscolhido } = useAuthStore();
const modelosDeRelatorioStore = useModelosDeRelatorioStore(sistemaEscolhido);

const {
  lista: modelosDisponiveis,
  detalhamento,
  chamadasPendentes,
  erros,
} = storeToRefs(modelosDeRelatorioStore);

// A store é compartilhada por sistema (não por fonte): sem isso, a lista filtrada pela fonte
// deste formulário ficaria em `lista` até outra tela sobrescrever.
onUnmounted(() => modelosDeRelatorioStore.$reset());

modelosDeRelatorioStore.buscarTudo({ fonte: [route.meta.fonteDoRelatorio] });

// `modelo_id`/`parametros` são do formulário ancestral (`useForm`/`<Form>`), nunca deste
// componente — `useFormValues`/`useFieldError` leem o form injetado pelo pai, sem precisar de
// props nem de repetir `useForm` aqui.
const valoresDoForm = useFormValues();
const erroDoModeloId = useFieldError('modelo_id');

const modeloSelecionado = computed(
  () => modelosDisponiveis.value.find((item) => item.id === valoresDoForm.value.modelo_id),
);

const detalhamentoAtual = computed(
  () => detalhamento.value[String(valoresDoForm.value.modelo_id)],
);

// O cache por modelo é decisão de quem chama, não da action: só busca de novo se este
// componente ainda não tem o detalhamento desse modelo em mãos.
async function aoDetalhar() {
  if (detalhamentoAtual.value) return;

  modelosDeRelatorioStore.buscarDetalhamento({
    fonte: route.meta.fonteDoRelatorio,
    parametros: valoresDoForm.value.parametros,
    modeloId: valoresDoForm.value.modelo_id,
  });
}
</script>

<template>
  <div class="flex g2 mb1 start">
    <div class="f1">
      <LabelFromYup
        name="modelo_id"
        :schema="schema"
      />
      <Field
        name="modelo_id"
        as="select"
        class="inputtext light mb1"
        :class="{
          error: erroDoModeloId,
          loading: chamadasPendentes?.lista,
        }"
        :disabled="!modelosDisponiveis.length"
      >
        <option value="">
          padrão
        </option>
        <option
          v-for="item in modelosDisponiveis"
          :key="item.id"
          :value="item.id"
        >
          {{ item.nome }}
        </option>
      </Field>
      <ErrorMessage
        name="modelo_id"
        class="error-msg"
      />
    </div>
  </div>

  <div
    class="detalhes-do-modelo mb2"
  >
    <p
      v-if="modeloSelecionado?.descricao"
      class="detalhes-do-modelo__descricao t13 tc500"
    >
      {{ modeloSelecionado.descricao }}
    </p>

    <details
      v-if="modeloSelecionado"
    >
      <summary
        class="like-a__text addlink"
        type="button"
        :disabled="chamadasPendentes?.detalhamento"
        :aria-busy="chamadasPendentes?.detalhamento"
        @click="aoDetalhar"
      >
        Detalhes do modelo
      </summary>
      <div
        v-if="detalhamentoAtual"
        class="detalhes-do-modelo__arquivos"
      >
        <fieldset
          v-for="arquivo in detalhamentoAtual.arquivos"
          :key="arquivo.arquivo"
          class="detalhes-do-modelo__arquivo-item mb2"
        >
          <legend>
            Arquivo <code class="destacar">{{ arquivo.arquivo }}</code>
          </legend>

          <div class="t13 tc500">
            <p
              v-if="arquivo.descricao"
              class="detalhes-do-modelo__descricao-do-arquivo t13 tc500"
            >
              {{ arquivo.descricao }}
            </p>
            <div class="detalhes-do-modelo__colunas">
              <p>Colunas:</p>

              <ListaAninhada
                :lista="arquivo.colunas"
                class="detalhes-do-modelo__lista-de-colunas"
              >
                <template #default="{ item: coluna }">
                  <span
                    v-if="coluna.label !== coluna.label_original"
                    class="tipinfo"
                  >
                    {{ coluna.label }}
                    <div>nome original: {{ coluna.label_original }}</div>
                  </span>
                  <span v-else>
                    {{ coluna.label }}
                  </span>
                </template>
              </ListaAninhada>
            </div>
          </div>
        </fieldset>

        <SmaeLink
          v-slot="{ href, navigate}"
          :to="{
            name: 'modelosDeRelatorio.listar'
          }"
          custom
        >
          <p
            class="btn outline bgnone tcprimary mt2"
          >
            <a
              :href="href"
              @click="navigate"
            >
              Criar novo modelo de relatório
            </a>
          </p>
        </SmaeLink>
      </div>
      <LoadingComponent
        v-else-if="chamadasPendentes?.detalhamento"
        class="mb1"
      />
      <ErrorComponent
        v-else-if="erros?.detalhamento"
        :erro="erros.detalhamento"
      />
    </details>
  </div>
</template>
<style lang="less" scoped>
@coluna: 20em;
@gap: 2em;

.detalhes-do-modelo {
  container-type: inline-size;
  container-name: detalhes-do-modelo;
  // display: grid;
  // grid-template-columns: @coluna minmax(0, 1fr);
  // gap: @gap;
}

.detalhes-do-modelo__descricao {
}

.detalhes-do-modelo__arquivos {}

.detalhes-do-modelo__arquivo {}

.detalhes-do-modelo__descricao-do-arquivo {}

.detalhes-do-modelo__colunas {}

.detalhes-do-modelo__lista-de-colunas {
  // // Sempre na 2ª coluna, mesmo quando é o único filho (sem `descricao`) — senão o grid a
  // // colocaria na 1ª (20em) por auto-placement.
  // grid-column: 2;
  column-width: min(@coluna, 25cqw);
  column-gap: @gap;
  column-fill: balance;

  :deep(li) {
    display: list-item;
    list-style-type: upper-alpha;
    break-inside: avoid;
  }

  .tipinfo {
    display: inline;
    vertical-align: baseline;
  }
}
</style>
