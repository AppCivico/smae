<script setup>
import LegendaEstimadoVsEfetivo from '@/components/LegendaEstimadoVsEfetivo.vue';
import LinhaDeCronograma from '@/components/projetos/LinhaDeCronograma.vue';
import CabecalhoResumo from '@/components/tarefas/CabecalhoResumo.vue';
import { emailTransferencia as schema } from '@/consts/formSchemas';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Field, Form } from 'vee-validate';

const route = useRoute();
const tarefasStore = useTarefasStore();
const { árvoreDeTarefas, chamadasPendentes, erro } = storeToRefs(tarefasStore);

const projetoEmFoco = computed(() => tarefasStore?.extra?.projeto || {});
const apenasLeitura = computed(
  () => !!projetoEmFoco.value?.permissoes?.apenas_leitura,
);

// eslint-disable-next-line max-len
const nívelMáximoPermitido = computed(
  () => tarefasStore?.extra?.portfolio?.nivel_maximo_tarefa || 0,
);

const nívelMáximoVisível = ref(0);

const newEmail = ref('');
const localEmails = ref([
  'joao@hotmail.com',
  'maria@gmail.com',
  'carlos@yahoo.com',
]);

const periodicidades = ['Semanal', 'Quinzenal', 'Mensal'];

function removeEmail(index, event) {
  console.log('entrou no removeEmail');
  event.preventDefault();
  localEmails.value.splice(index, 1);
  console.log('localEmails: ', localEmails.value);
}

function addNewEmail() {
  const emails = newEmail.value
    .split(/[;, ]+/)
    .filter((email) => email.trim() !== '');
  emails.forEach((email) => {
    if (email !== '' && !localEmails.value.includes(email)) {
      localEmails.value.push(email);
    }
  });
  newEmail.value = '';
}

function onSubmit() {}
let prefixo = null;

async function iniciar() {
  if (route.params?.projetoId) {
    prefixo = 'projeto';
  } else if (route.params?.transferenciaId) {
    prefixo = 'transferencia';
  }

  tarefasStore.$reset();
  await tarefasStore.buscarTudo();

  if (nívelMáximoPermitido.value) {
    nívelMáximoVisível.value = nívelMáximoPermitido.value;
  }
}

iniciar();
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2 g2">
    <TítuloDePágina> Cronograma </TítuloDePágina>
    <hr class="f1">
    <nav
      v-if="projetoEmFoco?.eh_prioritario && !apenasLeitura"
      class="flex g1"
    >
      <router-link
        :to="{
          name: $route.meta.prefixoParaFilhas + 'TarefasCriar',
          params: $route.params,
        }"
        class="btn"
      >
        Nova tarefa
      </router-link>

      <router-link
        v-if="route.meta.entidadeMãe === 'projeto' && !árvoreDeTarefas.length"
        :to="{
          name: $route.meta.prefixoParaFilhas + 'TarefasClonar',
          params: $route.params,
        }"
        class="btn"
      >
        Clonar tarefas
      </router-link>
    </nav>
  </div>
  <CabecalhoResumo :em-foco="projetoEmFoco" />

  <!--  v-if="route.meta.entidadeMãe === 'transferencia'" -->
  <div class="mb4 disparo-email">
    <div class="">
      <Form
        :validation-schema="schema"
        @submit="onSubmit"
      >
        <div class="mb2">
          <LabelFromYup
            name="disparo_email"
            :schema="schema"
          />
          <Field
            name="disparo_email"
            type="checkbox"
            value="true"
            class="inputcheckbox"
          />
        </div>
        <div class="flex mb2 flexwrap g2">
          <div class="f1">
            <LabelFromYup
              name="periodicidade"
              :schema="schema"
            />
            <Field
              name="periodicidade"
              as="select"
              class="inputtext light mb1"
            >
              <option
                v-for="periodicidade in periodicidades"
                :key="periodicidade"
                :value="periodicidade"
              >
                {{ periodicidade }}
              </option>
            </Field>
          </div>
          <div class="f1">
            <LabelFromYup
              name="data"
              :schema="schema"
            />
            <Field
              name="data"
              type="date"
              class="inputtext light mb1"
              maxlength="10"
              placeholder="dd/mm/aaaa"
            />
          </div>
        </div>
        <div class="mb2">
          <div class="f1">
            <LabelFromYup
              name="com_copia"
              :schema="schema"
            />
            <Field
              v-model="newEmail"
              name="com_copia"
              type="email"
              class="inputtext light mb1"
              maxlength="250"
              placeholder="email@dominio.com"
              @blur="addNewEmail()"
            />
            <ul
              v-if="localEmails"
              class="flex flexwrap"
            >
              <li
                v-for="(email, index) in localEmails"
                :key="index"
              >
                <button
                  type="button"
                  class="tagsmall"
                  tabindex="1"
                  @click="removeEmail(index, $event)"
                >
                  {{ email }}
                  <svg
                    width="12"
                    height="12"
                  ><use xlink:href="#i_x" /></svg>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </Form>

      <div class="flex center">
        <button
          class="like-a__text addlink"
          type="button"
          @click="salvarDisparo"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_+" />
          </svg>
          Salvar disparo de e-mail
        </button>
      </div>
    </div>
  </div>

  <div class="mb2">
    <div class="">
      <label class="label tc300"> Exibir tarefas até nível </label>
      <div class="flex center">
        <input
          id="nivel"
          v-model="nívelMáximoVisível"
          type="range"
          name="nivel"
          min="1"
          :max="nívelMáximoPermitido"
          class="f1"
        >
        <output class="f1 ml1">
          {{ nívelMáximoVisível }}
        </output>
      </div>
    </div>
  </div>

  <LegendaEstimadoVsEfetivo />

  <table
    v-if="árvoreDeTarefas.length"
    class="tabela-de-etapas"
  >
    <colgroup>
      <col class="genealogia">
      <col>
      <col>
      <col>

      <col class="col--data">
      <col class="col--data">
      <col class="col--data">
      <col class="col--data">

      <col>
      <col>
      <col>

      <template v-if="!apenasLeitura">
        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
      </template>
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th />
        <th />
        <th />
        <th />
        <th
          colspan="2"
          class="dado-estimado"
        >
          Planejado
        </th>
        <th
          colspan="2"
          class="dado-efetivo"
        >
          Execução
        </th>
        <th colspan="2">
          Custo <small>(R$)</small>
        </th>
        <th />
        <template v-if="!apenasLeitura">
          <th />
          <th />
          <th />
        </template>
      </tr>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th />
        <th />
        <th class="cell--number">
          % conclusão
        </th>
        <th class="cell--number">
          Duração
        </th>
        <th class="cell--data">
          Início
        </th>
        <th class="cell--data">
          Término
        </th>
        <th class="cell--data">
          Início
        </th>
        <th class="cell--data">
          Término
        </th>
        <th class="cell--number dado-estimado">
          Planejado
        </th>
        <th class="cell--number dado-efetivo">
          Real
        </th>
        <th class="cell--number">
          Atraso
        </th>
        <template v-if="!apenasLeitura">
          <th />
          <th />
          <th />
        </template>
      </tr>
    </thead>

    <tbody
      v-for="(r, i) in árvoreDeTarefas"
      :key="r.id"
      class="tabela-de-etapas__item"
    >
      <LinhaDeCronograma
        :key="r.id"
        :linha="r"
        :índice="i"
        :nível-máximo-visível="nívelMáximoVisível"
      />
    </tbody>
  </table>

  <span
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>

  <router-view />
</template>
<style scoped>
.disparo-email {
  max-width: 900px;
}
</style>
