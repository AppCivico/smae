<template>
  <div>
    <TítuloDePágina id="titulo-da-pagina">
      Resumo da Tarefa
    </TítuloDePágina>
    <div class="flex maxw mb2">
      <dl class="f1">
        <dt class="tc500 w700 t16 mb025">
          Tarefa
        </dt>
        <dd> {{ emFoco?.tarefa || ' - ' }}</dd>
      </dl>
      <dl class="f2">
        <dt class="tc500 w700 t16 mb025">
          Marco do projeto?
        </dt>
        <dd> {{ emFoco?.eh_marco ? 'Sim' : 'Não' }}</dd>
      </dl>
    </div>
    <div class="flex maxw mb2">
      <dl class="f1">
        <dt class="tc500 w700 t16 mb025">
          Tarefa-mãe
        </dt>
        <dd>{{ tarefasPorId[emFoco?.tarefa_pai_id]?.tarefa || ' - ' }}</dd>
      </dl>
      <dl class="f1">
        <dt class="tc500 w700 t16 mb025">
          Ordem
        </dt>
        <dd> {{ emFoco?.numero || ' - ' }}</dd>
      </dl>
      <dl class="f1">
        <dt class="tc500 w700 t16 mb025">
          Orgão responsável
        </dt>
        <dd> {{ emFoco?.orgao?.descricao || ' - ' }}</dd>
      </dl>
    </div>
    <dl class="mb2">
      <dt class="tc500 w700 t16 mb025">
        Responsável pela atividade
      </dt>
      <dd> {{ emFoco?.projeto?.responsavel?.nome_exibicao || ' - ' }}</dd>
    </dl>
    <dl class="mb2 f1">
      <dt class="tc500 w700 t16 mb025 ">
        Descrição
      </dt>
      <dd> {{ emFoco?.descricao || ' - ' }}</dd>
    </dl>
    <dl v-if="emFoco?.dependencias.length">
      <div class="flex spacebetween center mt2 mb2">
        <dt class="tc300 t16">
          Dependências
        </dt>
        <hr class="ml2 f1">
      </div>
      <dd>
        <table class="tablemain maxw">
          <colgroup>
            <col>
            <col>
            <col>
          </colgroup>
          <thead>
            <tr>
              <td class="tc300 w700 t12">
                TAREFA RELACIONADA
              </td>
              <td class="tc300 w700 t12">
                TIPO DE RELAÇÃO
              </td>
              <td class="tc300 w700 t12">
                DIAS DE LATÊNCIA
              </td>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="dependencia, key in emFoco?.dependencias"
              :key="key"
            >
              <td class="pt2 pb2">
                {{ tarefasPorId[dependencia.dependencia_tarefa_id]?.tarefa || ' - ' }}
              </td>
              <td>
                {{ dependencyTypes[dependencia.tipo] }}
              </td>
              <td>
                {{ dependencia.latencia }}
              </td>
            </tr>
            <tr v-if="emFoco?.dependencias.length===0">
              <td>
                Nenhum há dependência.
              </td>
            </tr>
          </tbody>
        </table>
      </dd>
      <hr class="mt3 mb3">
    </dl>
    <div class="maxw">
      <div class="flex maxw mb2">
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Previsão de início
          </dt>
          <dd> {{ dateToDate(emFoco?.inicio_planejado) || ' - ' }}</dd>
        </dl>
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Duração prevista
          </dt>
          <dd>{{ emFoco?.duracao_planejado ? `${emFoco.duracao_planejado} dias` : ' - ' }}</dd>
        </dl>
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Previsão de término
          </dt>
          <dd> {{ dateToDate(emFoco?.termino_planejado) || ' - ' }}</dd>
        </dl>
      </div>
      <div class="flex maxw">
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Atraso
          </dt>
          <dd>{{ emFoco?.atraso ? `${emFoco.atraso} dias` : ' - ' }}</dd>
        </dl>
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Previsão de custo
          </dt>
          <dd>{{ emFoco?.custo_estimado ? `R$${dinheiro(emFoco.custo_estimado)}` : ' - ' }}</dd>
        </dl>
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Termino projetado
          </dt>
          <dd>
            {{
              emFoco?.termino_projetado
                ? dateToDate(emFoco.termino_projetado)
                : ' - '
            }}
          </dd>
        </dl>
      </div>
    </div>

    <dl class="mt2 mb2">
      <div class="flex spacebetween center mt2 mb2">
        <dt class="tc300 t16">
          Execução da tarefa
        </dt>
        <hr class="ml2 f1">
      </div>
      <div class="flex maxw mb1">
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Data de início real
          </dt>
          <dd>{{ dateToDate(emFoco?.inicio_real) || ' - ' }}</dd>
        </dl>
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Duração real
          </dt>
          <dd>{{ emFoco?.duracao_real ? `${emFoco.duracao_real} dias` : ' - ' }}</dd>
        </dl>
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Data de término real
          </dt>
          <dd>{{ dateToDate(emFoco?.termino_real) || ' - ' }}</dd>
        </dl>
      </div>
      <div class="flex maxw">
        <dl class="f1">
          <dt class="tc500 w700 t16">
            Custo real
          </dt>
          <dd>{{ emFoco?.custo_real ? `R$${dinheiro(emFoco.custo_real)}` : ' - ' }}</dd>
        </dl>
        <dl class="f2">
          <dt class="tc500 w700 t16">
            Percentual concluído
          </dt>
          <dd>{{ emFoco?.percentual_concluido ? `${emFoco.percentual_concluido}%` : ' - ' }}</dd>
        </dl>
      </div>
    </dl>
    <span
      v-if="chamadasPendentes?.emFoco"
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
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';

import dependencyTypes from '@/consts/dependencyTypes';
import dateToDate from '@/helpers/dateToDate';
import dinheiro from '@/helpers/dinheiro';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const tarefasStore = useTarefasStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
  tarefasPorId,
} = storeToRefs(tarefasStore);

tarefasStore.buscarTudo();

</script>

<style>
.maxw{
  max-width: 900px;
}
</style>
