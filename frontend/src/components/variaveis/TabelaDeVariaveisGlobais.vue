<template>
  <div
    role="region"
    aria-labelledby="Lista de variáveis globais"
    tabindex="0"
  >
    <table class="tablemain tbody-zebra">
      <colgroup>
        <slot name="definicaoPrimeirasColunas" />

        <col class="col--minimum">
        <col>
        <col>
        <col class="col--minimum">
        <col class="col--minimum">
        <col class="col--minimum">
        <col>

        <slot name="definicaoUltimasColunas" />
      </colgroup>
      <thead>
        <tr>
          <slot name="comecoLinhaCabecalho" />
          <th />
          <th>
            Código
          </th>
          <th>
            {{ schema.fields.titulo?.spec.label }}
          </th>
          <th>
            {{ schema.fields.fonte_id?.spec.label }}
          </th>
          <th>
            {{ schema.fields.periodicidade?.spec.label }}
          </th>
          <th>
            {{ schema.fields.medicao_orgao_id?.spec.label }}
          </th>
          <th>
            Planos
          </th>
          <slot name="finalLinhaCabecalho" />
        </tr>
      </thead>

      <tbody
        v-for="(item, idx) in lista"
        :key="item.id || idx"
        :aria-busy="chamadasPendentes.variaveisFilhasPorMae[item.id]"
        :class="{ 'variavel-mae--aberta': variavelAberta === item.id }"
      >
        <tr>
          <slot
            name="comecoLinhaVariavel"
            :variavel="item"
          />

          <td>
            <button
              v-if="item?.possui_variaveis_filhas"
              type="button"
              class="like-a__text tipinfo right"
              @click="buscarFilhas(item.id)"
            >
              <svg
                class="arrow"
                width="13"
                height="8"
              ><use xlink:href="#i_down" /></svg>
              <div>
                <template v-if="!variaveisFilhasPorMae[item.id]">
                  carregar
                </template>
                <template v-else-if="variavelAberta === item.id">
                  ocultar
                </template>
                <template v-else>
                  exibir
                </template>
                filhas
              </div>
            </button>
          </td>

          <LinhaDeVariaveis :linha="item" />

          <slot
            name="finalLinhaVariavel"
            :variavel="item"
          />
        </tr>

        <tr v-if="chamadasPendentes.variaveisFilhasPorMae[item.id]">
          <td :colspan="7 + Number($props.numeroDeColunasExtras)">
            <LoadingComponent class="horizontal" />
          </td>
        </tr>

        <tr v-if="erros.variaveisFilhasPorMae[item.id]">
          <td :colspan="7 + Number($props.numeroDeColunasExtras)">
            {{ erros.variaveisFilhasPorMae[item.id] }}
          </td>
        </tr>

        <template v-if="variaveisFilhasPorMae[item.id]">
          <template
            v-for="nivel, k in filhasPorMaePorNivelDeRegiao[item.id]"
            :key="k"
          >
            <tr
              v-show="variavelAberta === item.id"
              class="variavel-mae__agrupador"
            >
              <td />
              <slot
                name="comecoLinhaAgrupadora"
                :agrupador="k"
                :grupo="nivel"
                :mae="item"
              />
              <th
                :colspan="6 + Number($props.numeroDeColunasExtras)"
                class="t10"
              >
                {{ nivel.length }} variáveis
                <template v-if="niveisRegionalizacao[k]?.nome">
                  atribuídas à "{{ niveisRegionalizacao[k]?.nome }}"
                </template>
              </th>
            </tr>

            <tr
              v-for="filha in nivel"
              v-show="variavelAberta === item.id"
              :key="filha.id"
            >
              <th />

              <slot
                name="comecoLinhaVariavelFilha"
                :variavel="filha"
                :mae="item"
                :agrupador="k"
              />

              <LinhaDeVariaveis :linha="filha" />

              <slot
                name="finalLinhaVariavel"
                :variavel="filha"
              />
            </tr>
          </template>
        </template>
      </tbody>
      <tbody>
        <tr v-if="chamadasPendentes.lista">
          <td :colspan="7 + Number($props.numeroDeColunasExtras)">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erros.lista">
          <td :colspan="7 + Number($props.numeroDeColunasExtras)">
            Erro: {{ erros.lista }}
          </td>
        </tr>
        <tr v-else-if="!lista.length">
          <td :colspan="7 + Number($props.numeroDeColunasExtras)">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { variavelGlobal as schema } from '@/consts/formSchemas';
import niveisRegionalizacao from '@/consts/niveisRegionalizacao';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import LinhaDeVariaveis from './LinhaDeVariaveis.vue';

const variaveisGlobaisStore = useVariaveisGlobaisStore();

const {
  lista, chamadasPendentes, erros, variaveisFilhasPorMae, filhasPorMaePorNivelDeRegiao,
} = storeToRefs(variaveisGlobaisStore);

defineProps({
  numeroDeColunasExtras: {
    type: [
      Number,
      String,
    ],
    default: 0,
    validator: (value) => !!(Number(value)),
  },
});

const variavelAberta = ref<number>(0);

function buscarFilhas(id: number) {
  if (!variaveisFilhasPorMae.value[id]) {
    variaveisGlobaisStore.buscarFilhas(id);
  }

  variavelAberta.value = variavelAberta.value === id ? 0 : id;
}
</script>
<style lang="less" scoped>
.variavel-mae--aberta {
  border-top: 2px solid @c600;
  border-bottom: 2px solid @c600;

  .arrow {
    transform: rotate(180deg);
  }
}
</style>
