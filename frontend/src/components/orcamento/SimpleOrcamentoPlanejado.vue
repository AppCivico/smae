<script setup>
import { default as LinhaPlanejado } from '@/components/orcamento/LinhaPlanejado.vue';
import formataValor from '@/helpers/formataValor';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { storeToRefs } from 'pinia';
import agrupaFilhos from './helpers/agrupaFilhos';
import somaItems from './helpers/somaItems';

const props = defineProps(['parentlink', 'config']);
const ano = props.config.ano_referencia;
const OrcamentosStore = useOrcamentosStore();
const { OrcamentoPlanejado } = storeToRefs(OrcamentosStore);
</script>
<template>
  <div class="mb2">
    <div>
      <div class="tablepreinfo">
        <div class="t12 lh1 w700 mb05">
          Orçamento Planejado
        </div>
        <div
          v-if="OrcamentoPlanejado[ano]?.length"
          class="t12 lh1 w700"
        >
          <span class="tc300">Planejado total:</span> <span class="tvermelho">{{ formataValor(somaItems(OrcamentoPlanejado[ano], 'valor_planejado')) }}</span>
        </div>
      </div>

      <div
        v-if="OrcamentoPlanejado[ano]?.loading"
        class="spinner pt1 pr2 pb1 pl1"
      >
        Carregando
      </div>

      <table
        v-if="OrcamentoPlanejado[ano]?.length"
        class="tablemain fix no-zebra horizontal-lines"
      >
        <thead>
          <tr>
            <th style="width: 50%">
              Dotação
            </th>
            <th style="width: 30%">
              planejado
            </th>
            <th style="width: 210px; overflow: visible;">
              <span>pressão orçamentária</span> <div class="tipinfo right">
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_i" /></svg><div>Excedente no PdM em relação ao valor da dotação</div>
              </div>
            </th>
            <th style="width: 50px" />
          </tr>
        </thead>
        <template v-if="groups = agrupaFilhos(OrcamentoPlanejado[ano])">
          <tbody>
            <LinhaPlanejado
              :group="groups"
              :permissao="config.previsao_custo_disponivel"
              :parentlink="parentlink"
            />
          </tbody>

          <template v-for="(g, k) in groups.filhos">
            <tbody>
              <tr>
                <td class="tc600 w700 pl1">
                  {{ g.label }}
                </td>
                <td class="w700">
                  {{ g.items.length
                    ? formataValor(g.items.reduce((red, x) => red + Number(x.valor_planejado), 0))
                    : '-' }}
                </td>
                <td class="w700" />
                <td />
              </tr>
              <LinhaPlanejado
                :group="g"
                :permissao="config.previsao_custo_disponivel"
                :parentlink="parentlink"
              />
            </tbody>
            <template v-for="(gg, kk) in g.filhos">
              <tbody>
                <tr>
                  <td class="tc600 w700 pl2">
                    {{ gg.label }}
                  </td>
                  <td class="w700">
                    {{ gg.items.length
                      ? formataValor(gg.items.reduce((red, x) => red + Number(x.valor_planejado), 0))
                      : '-' }}
                  </td>
                  <td class="w700" />
                  <td />
                </tr>
                <LinhaPlanejado
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
          v-if="config.planejado_disponivel && ($route.meta?.rotaParaAdição || parentlink)"
          :to="$route.meta?.rotaParaAdição
            ? { name: $route.meta.rotaParaAdição, params: { ano } }
            : `${parentlink}/orcamento/planejado/${ano}`"
          class="addlink mt1 mb1"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg> <span>Adicionar dotação</span>
        </router-link>
        <span
          v-else
          class="addlink disabled mt1 mb1"
        ><svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg> <span>Adicionar dotação</span></span>
      </div>
    </div>
  </div>
</template>
