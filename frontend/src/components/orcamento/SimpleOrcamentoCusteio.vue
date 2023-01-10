<script setup>
import { default as LinhaCusteio } from '@/components/orcamento/LinhaCusteio.vue';
import { useOrcamentosStore } from '@/stores';
import { storeToRefs } from 'pinia';

import dateToField from '@/helpers/dateToField';
import formataValor from '@/helpers/formataValor';

const props = defineProps(['parentlink', 'config', 'meta_id']);
const ano = props.config.ano_referencia;
const OrcamentosStore = useOrcamentosStore();
const { OrcamentoCusteio } = storeToRefs(OrcamentosStore);
OrcamentosStore.getOrcamentoCusteioById(props.meta_id, props.config.ano_referencia);

function somaItems(items, key) {
  return items.reduce((r, x) => (x[key] && Number(x[key]) ? r + Number(x[key]) : r), 0);
}
function maiorData(items, key) {
  return items.reduce((r, x) => {
    const k = x[key] ? new Date(x[key]) : 1;
    return k > r ? k : r;
  }, new Date(0));
}
function agrupaFilhos(array) {
  const ar = { items: [], filhos: {} };

  if (array.length) {
    array.forEach((x) => {
      if (x.iniciativa?.id && !ar.filhos[x.iniciativa.id]) {
        ar.filhos[x.iniciativa.id] = {
          id: x.iniciativa.id, label: `${x.iniciativa.codigo} - ${x.iniciativa.titulo}`, filhos: {}, items: [],
        };
      }
      if (x.atividade?.id && !ar.filhos[x.iniciativa.id].filhos[x.atividade.id]) {
        ar.filhos[x.iniciativa.id].filhos[x.atividade.id] = {
          id: x.atividade.id, label: `${x.atividade.codigo} - ${x.atividade.titulo}`, filhos: {}, items: [],
        };
      }

      if (x.atividade?.id) {
        ar.filhos[x.iniciativa.id].filhos[x.atividade.id].items.push(x);
      } else if (x.iniciativa?.id) {
        ar.filhos[x.iniciativa.id].items.push(x);
      } else if (x.meta?.id) {
        ar.items.push(x);
      }
    });
  }
  return ar;
}
</script>
<template>
  <div class="board_indicador mb2">
    <header class="p1">
      <div class="flex center g2">
        <div class="flex center f1">
          <h2 class="mt1 mb1 ml1">
            {{ config.ano_referencia }}
          </h2>
        </div>
      </div>
    </header>
    <div>
      <div class="tablepreinfo">
        <div class="flex spacebetween">
          <div class="flex center">
            <div class="t12 lh1 w700">
              Previsão de custo
            </div>
          </div>
        </div>
      </div>
      <table
        v-if="OrcamentoCusteio[ano].length"
        class="tablemain fix"
      >
        <thead>
          <tr>
            <th>
              Custo total
            </th>
            <th>
              Atualização mais recente
            </th>
            <th style="width: 50px" />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ formataValor(somaItems(OrcamentoCusteio[ano], 'custo_previsto')) }}</td>
            <td>{{ dateToField(maiorData(OrcamentoCusteio[ano], 'atualizado_em')) }}</td>
          </tr>
        </tbody>
      </table>
      <table
        v-if="OrcamentoCusteio[ano].length"
        class="tablemain fix"
      >
        <thead>
          <tr>
            <th style="width: 50%">
              Parte da dotação
            </th>
            <th style="width: 25%">
              Previsão de custo
            </th>
            <th style="width: 25%">
              Atualizado em
            </th>
            <th style="width: 50px" />
          </tr>
        </thead>
        <template v-if="groups = agrupaFilhos(OrcamentoCusteio[ano])">
          <tbody>
            <LinhaCusteio
              :group="groups"
              :permissao="config.previsao_custo_disponivel"
              :parentlink="parentlink"
            />
          </tbody>

          <template
            v-for="(g, k) in groups.filhos"
            :key="k"
          >
            <tbody>
              <tr>
                <td class="tc600 w700 pl1">
                  {{ g.label }}
                </td>
                <td class="w700">
                  {{ g.items.length ? formataValor(g.items.reduce((red, x) => red + Number(x.custo_previsto), 0)) : '-' }}
                </td>
                <td />
              </tr>
              <LinhaCusteio
                :group="g"
                :permissao="config.previsao_custo_disponivel"
                :parentlink="parentlink"
              />
            </tbody>
            <template
              v-for="(gg, kk) in g.filhos"
              :key="kk"
            >
              <tbody>
                <tr>
                  <td class="tc600 w700 pl2">
                    {{ gg.label }}
                  </td>
                  <td class="w700">
                    {{ gg.items.length ? formataValor(gg.items.reduce((red, x) => red + Number(x.custo_previsto), 0)) : '-' }}
                  </td>

                  <td />
                </tr>
                <LinhaCusteio
                  :group="gg"
                  :permissao="config.previsao_custo_disponivel"
                  :parentlink="parentlink"
                />
              </tbody>
            </template>
          </template>
        </template>
      </table>
      <div class="tc">
        <router-link
          v-if="config.previsao_custo_disponivel"
          :to="`${parentlink}/orcamento/custeio/${ano}`"
          class="addlink mt1 mb1"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg> <span>Adicionar previsão de custo</span>
        </router-link>
        <span
          v-else
          class="addlink disabled mt1 mb1"
        ><svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg> <span>Adicionar previsão de custo</span></span>
      </div>
    </div>
  </div>
</template>
