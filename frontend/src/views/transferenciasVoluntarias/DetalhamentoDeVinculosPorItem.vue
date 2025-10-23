<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useEntidadesProximasStore } from '@/stores/entidadesProximas.store';

const route = useRoute();
const entidadesProximasStore = useEntidadesProximasStore();
const { proximidadeFormatada } = storeToRefs(entidadesProximasStore);

const itemId = computed(() => Number(route.params.id));

const item = computed(() => proximidadeFormatada.value.find((i) => i.id === itemId.value) || null);
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h2>Detalhes</h2>
    <hr class="ml2 f1">
    <CheckClose :formulario-sujo="false" />
  </div>

<pre>$props:{{$props}}</pre>

  <div
    v-if="!item"
    class="error p1"
  >
    <div class="error-msg">
      <p class="w700">
        Item não encontrado
      </p>
      <p class="t14">
        O item solicitado não foi encontrado ou não está mais disponível.
      </p>
    </div>
  </div>

  <template v-else>
    <div class="mb2">
      <h3 class="w700 tc600 t16 mb1">
        Informações Principais
      </h3>
      <div class="flex g2 flexwrap">
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            ID
          </dt>
          <dd>
            {{ item.id }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Nome
          </dt>
          <dd>
            {{ item.nome || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Módulo
          </dt>
          <dd>
            {{ item.modulo || '-' }}
          </dd>
        </dl>
      </div>

      <div class="flex g2 flexwrap mt1">
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Portfólio/Programa
          </dt>
          <dd>
            {{ item.portfolio_programa || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Órgão
          </dt>
          <dd>
            {{ item.orgao || '-' }}
          </dd>
        </dl>
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Status
          </dt>
          <dd>
            {{ item.status?.nome || '-' }}
          </dd>
        </dl>
      </div>

      <div class="flex g2 flexwrap mt1">
        <dl class="f1">
          <dt class="t14 w700 mb05 tamarelo">
            Número de Vínculos
          </dt>
          <dd>
            {{ item.nro_vinculos || 0 }}
          </dd>
        </dl>
      </div>

      <template v-if="item.detalhes && Object.keys(item.detalhes).length > 0">
        <hr class="mt2 mb2">

        <h3 class="w700 tc600 t16 mb1">
          Detalhes Adicionais
        </h3>
        <div class="flex g2 flexwrap">
          <dl
            v-for="(valor, chave) in item.detalhes"
            :key="chave"
            class="f1"
          >
            <dt class="t14 w700 mb05 tamarelo">
              {{ chave }}
            </dt>
            <dd>
              {{ valor || '-' }}
            </dd>
          </dl>
        </div>
      </template>

      <template v-if="item.localizacoes && item.localizacoes.length > 0">
        <hr class="mt2 mb2">

        <h3 class="w700 tc600 t16 mb1">
          Localizações
        </h3>
        <div
          v-for="(localizacao, index) in item.localizacoes"
          :key="index"
          class="mb2"
        >
          <h4 class="t14 w700 mb05">
            Localização {{ index + 1 }}
          </h4>
          <div class="flex g2 flexwrap">
            <dl class="f1">
              <dt class="t12 w700 mb05 tc300">
                Endereço
              </dt>
              <dd>
                {{ localizacao.geom_geojson?.properties?.string_endereco || '-' }}
              </dd>
            </dl>
          </div>
        </div>
      </template>

      <template v-if="item.dotacoes_encontradas && item.dotacoes_encontradas.length > 0">
        <hr class="mt2 mb2">

        <h3 class="w700 tc600 t16 mb1">
          Dotações
        </h3>
        <ul class="pl2">
          <li
            v-for="(dotacao, index) in item.dotacoes_encontradas"
            :key="index"
          >
            {{ dotacao }}
          </li>
        </ul>
      </template>

      <hr class="mt2 mb2">

      <h3 class="w700 tc600 t16 mb1">
        Dados Completos (JSON)
      </h3>
      <pre class="p1 bgc50">{{ JSON.stringify(item, null, 2) }}</pre>
    </div>
  </template>
</template>
