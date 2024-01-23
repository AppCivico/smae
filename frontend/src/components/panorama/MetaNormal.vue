<script setup>
defineProps({
  meta: {
    type: Object,
    required: true,
  },
  perfil: {
    type: String,
    default: 'PdM',
    validator(valor) {
      return typeof valor === 'string'
        && [
          'admin_cp',
          'ponto_focal',
          'tecnico_cp',
        ].indexOf(valor) > -1;
    },
  },
  visão: {
    type: String,
    default: 'pessoal',
    validator(valor) {
      return typeof valor === 'string'
        && [
          'geral',
          'pessoal',
        ].indexOf(valor) > -1;
    },
  },
});
</script>
<template>
  <article
    class="meta bgc50 p1 br6"
  >
    <h2 class="meta__título w900 t14 spacebetween uc br8">
      {{ meta.titulo }}
    </h2>
    <div class="meta__meta-dados flex flexwrap spacebetween tc g1">
      <ul class="meta__icones-lista flex g1">
        <li
          v-if="meta.variaveis?.conferidas < meta.variaveis?.total && perfil !== 'ponto_focal'"
          class="meta__icones-item tipinfo"
        >
          <svg
            class="meta__icone fracasso"
            width="24"
            height="24"
          ><use xlink:href="#i_clock" /></svg><div>Conferência</div>
        </li>
        <li
          v-if="meta.variaveis?.aguardando_complementacao"
          class="meta__icones-item tipinfo"
        >
          <svg
            class="meta__icone fracasso"
            width="24"
            height="24"
            color="#EE3B2B"
          ><use xlink:href="#i_alert" /></svg><div>Complementação</div>
        </li>
        <li
          v-if="meta.cronograma?.total"
          class="meta__icones-item tipinfo"
        >
          <svg
            class="meta__icone"
            :class="meta.cronograma?.preenchido < meta.cronograma?.total
              ? 'fracasso'
              : 'sucesso'"
            width="24"
            height="24"
          ><use xlink:href="#i_calendar" /></svg><div>Cronograma</div>
        </li>
        <li
          v-if="meta.orcamento?.total"
          class="meta__icones-item tipinfo"
        >
          <svg
            class="meta__icone"
            :class="meta.orcamento?.preenchido < meta.orcamento?.total
              ? 'fracasso'
              : 'sucesso'"
            width="24"
            height="24"
          ><use xlink:href="#i_$" /></svg><div>Orçamento</div>
        </li>
        <li
          v-if="meta.analise_qualitativa_enviada !== null"
          class="meta__icones-item tipinfo"
        >
          <svg
            class="meta__icone"
            :class="meta.analise_qualitativa_enviada
              ? 'sucesso'
              : 'fracasso'"
            width="24"
            height="24"
          ><use xlink:href="#i_iniciativa" /></svg><div>Qualificação</div>
        </li>
        <li
          v-if="meta.risco_enviado !== null"
          class="meta__icones-item tipinfo"
        >
          <svg
            class="meta__icone"
            :class="meta.risco_enviado
              ? 'sucesso'
              : 'fracasso'"
            width="24"
            height="24"
          ><use xlink:href="#i_binoculars" /></svg><div>Análise de Risco</div>
        </li>
        <li
          v-if="meta.fechamento_enviado !== null"
          class="meta__icones-item tipinfo"
        >
          <svg
            class="meta__icone"
            :class="meta.fechamento_enviado
              ? 'sucesso'
              : 'fracasso'"
            width="24"
            height="24"
          ><use xlink:href="#i_check" /></svg><div>Fechamento</div>
        </li>
      </ul>

      <dl
        v-if="meta.variaveis?.total"
        class="meta__lista-de-variáveis flex"
      >
        <div class="meta__variável pl1 pr1">
          <dt>{{ meta.variaveis.total }}</dt>
          <dd>variáveis</dd>
        </div>
        <div
          v-if="meta.variaveis.aguardando_complementacao"
          class="meta__variável pl1 pr1"
        >
          <dt class="fracasso">
            {{ meta.variaveis.aguardando_complementacao }}
          </dt>
          <dd>
            aguardando complementação
          </dd>
        </div>
        <div
          v-if="meta.variaveis.conferidas"
          class="meta__variável pl1 pr1"
        >
          <dt
            :class="meta.variaveis.conferidas < meta.variaveis.total
              ? 'fracasso'
              : 'sucesso'"
          >
            {{ meta.variaveis.conferidas }}
          </dt>
          <dd>conferidas</dd>
        </div>

        <template
          v-if="(visão === 'pessoal' && perfil === 'ponto_focal')
            || (visão === 'geral' && perfil === 'admin_cp')"
        >
          <div
            v-if="meta.variaveis.enviadas"
            class="meta__variável pl1 pr1"
          >
            <dt
              :class="meta.variaveis.enviadas < meta.variaveis.total
                ? 'fracasso'
                : 'sucesso'"
            >
              {{ meta.variaveis.enviadas }}
            </dt>
            <dd>enviadas</dd>
          </div>

          <div
            v-if="meta.variaveis.preenchidas"
            class="meta__variável pl1 pr1"
          >
            <dt
              :class="meta.variaveis.preenchidas < meta.variaveis.total
                ? 'fracasso'
                : 'sucesso'"
            >
              {{ meta.variaveis.preenchidas }}
            </dt>
            <dd>preenchidas</dd>
          </div>
        </template>
      </dl>
    </div>
  </article>
</template>
<style lang="less" scoped>
.meta__icones-lista {}

.meta__icones-item {}

.meta__icone {}

.meta__lista-de-variáveis {}

.meta__variável {
  border-left: 1px solid;
  flex-basis: 0;

  &:first-child {
    border-left: 0;
  }
}

.sucesso {
  color: @verde;
}

.fracasso {
  color: @vermelho;
}

.alerta {
  color: @amarelo;
}
</style>
