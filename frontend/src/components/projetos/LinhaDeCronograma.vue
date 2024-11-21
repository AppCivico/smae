<script>
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
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
    apenasLeitura: () => !!useTarefasStore()?.extra?.projeto?.permissoes?.apenas_leitura,
    souResponsável: () => !!useTarefasStore()?.extra?.projeto?.permissoes?.sou_responsavel,
    nivelMaximoTarefa: () => useTarefasStore()?.extra?.portfolio?.nivel_maximo_tarefa || -1,
    oProjetoÉPrioritário: () => useProjetosStore()?.emFoco?.eh_prioritario,
  },
  methods: {
    dinheiro,
    dateToField,
    excluirTarefa(id) {
      useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
        if (await useTarefasStore().excluirItem(id)) {
          useTarefasStore().$reset();
          useTarefasStore().buscarTudo();
          useAlertStore().success('Tarefa removida.');
        }
      }, 'Remover');
    },
  },
};
</script>
<template>
  <tr
    class="t13"
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
      class="tabela-de-etapas__titulo-da-tarefa left"
      :class="{
        'tabela-de-etapas__titulo-da-tarefa--fora-do-EAP': linha.nivel > 2
      }"
    >
      <svg
        v-if="linha.eh_marco"
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        fill="none"
        style="float: left;"
      >
        <title>Marco</title>
        <polygon
          fill="#ff0000"
          points="0,0 0,12 12,0"
          stroke="none"
        /></svg>
      <router-link
        v-if="!apenasLeitura
          || souResponsável
          || $route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias'"
        :to="{
          name: $route.meta.prefixoParaFilhas + 'TarefasProgresso',
          params: {
            ...$route.params,
            tarefaId: linha.id,
          },
        }"
        :title="`Registrar progresso na tarefa ${linha.hierarquia}`"
      >
        {{ linha.tarefa }}
      </router-link>
      <template v-else>
        {{ linha.tarefa }}
      </template>
    </th>
    <td class="cell--number dado-efetivo">
      {{ typeof linha.percentual_concluido === 'number' ? linha.percentual_concluido + '%' : '-' }}
    </td>
    <td class="cell--number">
      {{ typeof linha.duracao_planejado === 'number' ? linha.duracao_planejado + 'd' : '-' }}
    </td>
    <td class="cell--data dado-estimado">
      {{ dateToField(linha.inicio_planejado) }}

      <i
        v-if="linha.n_dep_inicio_planejado"
        class="tooltip tooltip--info"
        :title="linha.n_dep_inicio_planejado === 1
          ? `Calculada com base em ${linha.n_dep_inicio_planejado} dependência`
          : `Calculada com base em ${linha.n_dep_inicio_planejado} dependências`"
      >i</i>
    </td>
    <td class="cell--data dado-estimado">
      {{ dateToField(linha.termino_planejado) }}

      <i
        v-if="linha.n_dep_termino_planejado"
        class="tooltip tooltip--info"
        :title="linha.n_dep_termino_planejado === 1
          ? `Calculada com base em ${linha.n_dep_termino_planejado} dependência`
          : `Calculada com base em ${linha.n_dep_termino_planejado} dependências`"
      >i</i>
    </td>
    <td class="cell--data dado-efetivo">
      {{ dateToField(linha.inicio_real) }}
    </td>
    <td class="cell--data dado-efetivo">
      {{ dateToField(linha.termino_real) }}
    </td>
    <td class="cell--number dado-estimado">
      {{ typeof linha.custo_estimado === 'number' ? dinheiro(linha.custo_estimado) : '-' }}
    </td>
    <td class="cell--number dado-efetivo">
      {{ typeof linha.custo_real === 'number' ? dinheiro(linha.custo_real) : '-' }}
    </td>
    <td class="cell--number">
      <template v-if="linha.atraso">
        {{ linha.atraso }}d
      </template>
      <i
        v-if="linha.atraso === 0"
        class="tooltip tooltip--danger"
        title="Último dia"
      >!</i>
    </td>
    <td>
      {{ linha.orgao?.sigla }} {{ linha.recursos ? ' - ' + linha.recursos : '' }}
    </td>
    <td
      class="center"
    >
      <router-link
        v-if="(linha.nivel < nivelMaximoTarefa || nivelMaximoTarefa === -1)"
        title="Visualizar"
        :to="{
          name: $route.meta.entidadeMãe +'.TarefasDetalhes',
          params: {
            ...$route.params,
            tarefaId: linha.id,
          }
        }"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_eye" /></svg>
      </router-link>
    </td>
    <template v-if="!apenasLeitura">
      <td
        class="center"
      >
        <SmaeLink
          v-if="(linha.nivel < nivelMaximoTarefa || nivelMaximoTarefa === -1) && linha.pode_editar"
          :hidden="(!oProjetoÉPrioritário || linha.dependencias?.length)
            && $route.meta.prefixoParaFilhas !== 'TransferenciasVoluntarias'
            && $route.meta.entidadeMãe !== 'obras'"
          :title="`Criar tarefa filha de ${linha.hierarquia}`"
          :to="{
            name: $route.meta.prefixoParaFilhas + 'TarefasCriar',
            params: {
              ...$route.params,
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
        </SmaeLink>
      </td>
      <td
        class="center"
      >
        <SmaeLink
          v-if="linha.pode_editar"
          :to="{
            name: $route.meta.prefixoParaFilhas + 'TarefasEditar',
            params: {
              ...$route.params,
              tarefaId: linha.id,
            }
          }"
          title="Editar tarefa"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_edit" /></svg>
        </SmaeLink>
      </td>
      <td
        class="center"
      >
        <button
          v-if="linha.pode_editar"
          type="button"
          class="like-a__text"
          title="Excluir"
          :hidden="linha.n_filhos_imediatos > 0
            || (!oProjetoÉPrioritário && $route.meta.entidadeMãe === 'projeto')"
          @click="excluirTarefa(linha.id)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_remove" /></svg>
        </button>
      </td>
    </template>
  </tr>

  <template
    v-if="
      Array.isArray(linha.children) && (!nívelMáximoVisível || nívelMáximoVisível > linha.nivel)
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
