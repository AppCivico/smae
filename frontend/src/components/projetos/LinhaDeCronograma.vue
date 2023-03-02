<script>
import dateToField from '@/helpers/dateToField';
import { useAlertStore } from '@/stores/alert.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { useRoute } from 'vue-router';

export default {
  name: 'LinhaDeCronograma',
  props: {
    class: {
      type: [Object, String],
      default: '',
    },
    genealogia: {
      type: String,
      default: '',
    },
    índice: {
      type: Number,
      required: true,
    },
    linha: {
      type: Object,
      required: true,
    },
    nívelMáximoVisível: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      projetoId: useRoute()?.params?.projetoId,
    };
  },
  computed: {
    nivelMaximoTarefa: () => useTarefasStore()?.extra?.portfolio?.nivel_maximo_tarefa || -1,
  },
  methods: {
    dateToField,
    excluirTarefa(id) {
      useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
        if (await useTarefasStore().excluirItem(id)) {
          useTarefasStore().$reset();
          useTarefasStore().buscarTudo();
          useAlertStore().success('Portfolio removido.');
        }
      }, 'Remover');
    },
  },
};
</script>

<template>
  <tr
    class="t13"
    :class="class"
  >
    <td
      class="genealogia"
      :class="{
        'genealogia--origem': linha.nivel === 1,
        'genealogia--fora-do-EAP': linha.nivel > 2
      }"
    >
      <span class="valor">
        <small
          v-if="genealogia"
          class="niveis-pais"
        >{{ genealogia }}.</small>{{ linha.numero }}
      </span>
    </td>
    <th
      class="tabela-de-etapas__titulo-da-tarefa pl1 left"
      :class="{
        'tabela-de-etapas__titulo-da-tarefa--fora-do-EAP': linha.nivel > 2
      }"
    >
      <router-link
        :to="{
          name: 'tarefasProgresso',
          params: {
            projetoId: projetoId,
            tarefaId: linha.id,
          },
        }"
        :title="`Registrar progresso na tarefa ${linha.hierarquia}`"
      >
        {{ linha.tarefa }}
      </router-link>
    </th>

    <td class="cell--number">
      {{ linha.percentual_concluido !== null ? linha.percentual_concluido + '%' : '-' }}
    </td>
    <td class="cell--number">
      {{ linha.duracao_planejado !== null ? linha.duracao_planejado + 'd' : '-' }}
    </td>
    <td class="cell--data">
      {{ dateToField(linha.inicio_planejado) }}
    </td>
    <td class="cell--data">
      {{ dateToField(linha.termino_planejado) }}
    </td>
    <td class="cell--data">
      {{ dateToField(linha.inicio_real) }}
    </td>
    <td class="cell--data">
      {{ dateToField(linha.termino_real) }}
    </td>
    <td class="cell--number">
      {{ linha.atraso ?? '-' }}
    </td>

    <td
      class="center"
    >
      <button
        type="button"
        class="like-a__text"
        title="Excluir"
        :hidden="linha.n_filhos_imediatos > 0"
        @click="excluirTarefa(linha.id)"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_remove" /></svg>
      </button>
    </td>

    <td
      class="center"
    >
      <router-link
        v-if="linha.nivel < nivelMaximoTarefa || nivelMaximoTarefa === -1"
        :title="`Criar tarefa filha de ${linha.hierarquia}`"
        :to="{
          name: 'tarefasCriar',
          params: {
            projetoId: projetoId,
            tarefaId: linha.id,
          },
          query: {
            nivel: linha.nivel + 1,
            tarefa_pai_id: linha.id,
          }
        }"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg>
      </router-link>
    </td>
    <td
      class="center"
    >
      <router-link
        :to="{
          name: 'tarefasEditar',
          params: {
            projetoId: projetoId,
            tarefaId: linha.id,
          }
        }"
        title="Editar tarefa"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg>
      </router-link>
    </td>
  </tr>

  <template
    v-if="
      Array.isArray(linha.children)
      && (!nívelMáximoVisível || nívelMáximoVisível > linha.nivel)
    "
  >
    <LinhaDeCronograma
      v-for="(linhaFilha, i) in linha.children"
      :key="linhaFilha.id"
      :genealogia="genealogia ? `${genealogia}.${linha.numero}` : `${linha.numero}`"
      :índice="i"
      :linha="linhaFilha"
      class="tabela-de-etapas__item--sub"
      :nível-máximo-visível="nívelMáximoVisível"
    />
  </template>
</template>
