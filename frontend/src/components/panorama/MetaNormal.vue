<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();

const { temPermissãoPara } = storeToRefs(authStore);

defineProps({
  meta: {
    type: Object,
    required: true,
  },
  perfil: {
    type: String,
    default: 'PdM',
    validator(valor) {
      return [
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
      return [
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
      <component
        :is="meta.cronograma?.total || meta.variaveis?.total ? 'router-link' : 'span'"
        :to="{
          name: meta.variaveis?.total
            ? 'monitoramentoDeEvoluçãoDeMetaEspecífica'
            : 'monitoramentoDeCronogramaDeMetaEspecífica',
          params: {
            meta_id: meta.id
          },
          query: meta.variaveis?.total ? $route.query : null,
        }"
      >
        {{ meta.codigo }} - {{ meta.titulo }}

        <small
          v-if="meta.atualizado_em"
          v-ScrollLockDebug
        >
          (<code>meta {{ meta.id }} atualizada em {{ meta.atualizado_em }}</code>)
        </small>
      </component>
    </h2>
    <div class="meta__meta-dados flex flexwrap spacebetween tc g1">
      <ul class="meta__icones-lista flex g1">
        <li
          v-if="meta.variaveis?.conferidas < meta.variaveis?.enviadas
            && perfil !== 'ponto_focal'"
          class="meta__icones-item"
        >
          <router-link
            :to="{
              name: 'monitoramentoPorVariáveis',
            }"
            class="tipinfo"
          >
            <svg
              class="meta__icone fracasso"
              width="24"
              height="24"
            ><use xlink:href="#i_clock" /></svg><div>Conferência</div>
          </router-link>
        </li>
        <li
          v-if="meta.variaveis?.aguardando_complementacao"
          class="meta__icones-item"
        >
          <router-link
            :to="{
              name: 'monitoramentoPorVariáveis',
            }"
            class="tipinfo"
          >
            <svg
              class="meta__icone fracasso"
              width="24"
              height="24"
              color="#EE3B2B"
            ><use xlink:href="#i_alert" /></svg><div>Complementação</div>
          </router-link>
        </li>
        <li
          v-if="meta.cronograma?.total"
          class="meta__icones-item"
        >
          <router-link
            :to="{
              name: 'monitoramentoDeCronogramaDeMetaEspecífica',
              params: {
                meta_id: meta.id
              },
            }"
            class="tipinfo"
          >
            <svg
              class="meta__icone"
              :class="{
                sucesso: meta.cronograma?.preenchido === meta.cronograma?.total
              }"
              width="24"
              height="24"
            ><use xlink:href="#i_calendar" /></svg><div>Cronograma</div>
          </router-link>
        </li>
        <li
          v-if="meta.orcamento?.total"
          class="meta__icones-item"
        >
          <component
            :is="temPermissãoPara('CadastroMeta.orcamento') ? 'router-link' : 'span'"
            :to="{
              name: 'MetaOrcamentoRealizado',
              params: {
                meta_id: meta.id
              }
            }"
            class="tipinfo"
          >
            <svg
              class="meta__icone"
              :class="{
                sucesso: meta.orcamento?.preenchido === meta.orcamento?.total
              }"
              width="24"
              height="24"
            ><use xlink:href="#i_$" /></svg><div>Orçamento</div>
          </component>
        </li>
        <template v-if="perfil !== 'ponto_focal' && meta.variaveis?.total > 0">
          <li
            v-if="meta.analise_qualitativa_enviada !== null"
            class="meta__icones-item"
          >
            <router-link
              :to="{
                name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                params: {
                  meta_id: meta.id
                }
              }"
              class="tipinfo"
            >
              <svg
                class="meta__icone"
                :class="{
                  sucesso: meta.analise_qualitativa_enviada
                }"
                width="24"
                height="24"
              ><use xlink:href="#i_iniciativa" /></svg><div>Qualificação</div>
            </router-link>
          </li>
          <li
            v-if="meta.risco_enviado !== null"
            class="meta__icones-item"
          >
            <router-link
              :to="{
                name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                params: {
                  meta_id: meta.id
                }
              }"
              class="tipinfo"
            >
              <svg
                class="meta__icone"
                :class="{
                  sucesso: meta.risco_enviado
                }"
                width="24"
                height="24"
              ><use xlink:href="#i_binoculars" /></svg><div>Análise de Risco</div>
            </router-link>
          </li>
          <li
            v-if="meta.fechamento_enviado !== null"
            class="meta__icones-item"
          >
            <router-link
              :to="{
                name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
                params: {
                  meta_id: meta.id
                }
              }"
              class="tipinfo"
            >
              <svg
                class="meta__icone"
                :class="{
                  sucesso: meta.fechamento_enviado
                }"
                width="24"
                height="24"
              ><use xlink:href="#i_check" /></svg><div>Fechamento</div>
            </router-link>
          </li>
        </template>
      </ul>

      <dl
        v-if="meta.variaveis?.total"
        class="meta__lista-de-variáveis flex fb0"
      >
        <div class="meta__variável pl1 pr1">
          <dt class="w700">
            {{ meta.variaveis.total }}
          </dt>
          <dd>variáveis</dd>
        </div>
        <template
          v-if="(visão === 'pessoal' && perfil === 'ponto_focal')
            || (visão === 'geral' && perfil === 'admin_cp')"
        >
          <div
            v-if="meta.variaveis.total"
            class="meta__variável pl1 pr1"
          >
            <dt
              class="w700"
              :class="{
                sucesso: meta.variaveis.preenchidas
                  && meta.variaveis.preenchidas === meta.variaveis.total
              }"
            >
              {{ meta.variaveis.preenchidas }}
            </dt>
            <dd>preenchidas</dd>
          </div>
          <div
            v-if="meta.variaveis.total"
            class="meta__variável pl1 pr1"
          >
            <dt
              class="w700"
              :class="{
                sucesso: meta.variaveis.enviadas
                  && meta.variaveis.enviadas === meta.variaveis.total
              }"
            >
              {{ meta.variaveis.enviadas }}
            </dt>
            <dd>enviadas</dd>
          </div>
        </template>
        <div
          v-if="perfil !== 'ponto_focal' && meta.variaveis.conferidas"
          class="meta__variável pl1 pr1"
        >
          <dt
            class="w700"
            :class="{
              sucesso: meta.variaveis.conferidas === meta.variaveis.total
            }"
          >
            {{ meta.variaveis.conferidas }}
          </dt>
          <dd>conferidas</dd>
        </div>
        <div
          v-if="meta.variaveis.aguardando_complementacao"
          class="meta__variável pl1 pr1"
        >
          <dt class="w700 fracasso">
            {{ meta.variaveis.aguardando_complementacao }}
          </dt>
          <dd>
            aguardando complementação
          </dd>
        </div>
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

.neutro {
  color: currentColor;
}
</style>
