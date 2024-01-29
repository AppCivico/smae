<script setup>
import { dateToMonth } from '@/helpers/dateToDate';
import { computed } from 'vue';

const props = defineProps({
  meta: {
    type: Object,
    required: true,
  },
});

const mesesPorAno = computed(() => {
  const combinações = {};
  const {
    atrasos_variavel: atrasosVariável = [],
    atrasos_orcamento: atrasosOrçamento = [],
  } = props.meta;

  atrasosVariável.forEach((x) => {
    const [ano, mês] = x.data.split('-');
    if (!combinações[ano]) {
      combinações[ano] = {};
    }
    if (!combinações[ano][`_${mês}`]) {
      combinações[ano][`_${mês}`] = {
        mês: dateToMonth(x.data, 'short'),
        orçamentos: false,
        variáveis: 0,
      };
    }
    combinações[ano][`_${mês}`].variáveis += x.total;
  });

  atrasosOrçamento.forEach((x) => {
    const [ano, mês] = x.data.split('-');
    if (!combinações[ano]) {
      combinações[ano] = {};
    }
    if (!combinações[ano][`_${mês}`]) {
      combinações[ano][`_${mês}`] = {
        mês: dateToMonth(x.data, 'short'),
        orçamentos: false,
        variáveis: 0,
      };
    }
    combinações[ano][`_${mês}`].orçamentos = !!x.total;
  });

  return Object.keys(combinações)
    .sort((a, b) => b - a)
    .reduce((acc, cur) => {
      const ano = {
        ano: cur,
        valores: Object.values(combinações[cur])
          .map((x) => {
            let classe = '';
            if (x.orçamentos && x.variáveis) {
              classe = 'meta__item-do-ano--mês-variáveis-orçamento';
            } else if (x.orçamentos) {
              classe = 'meta__item-do-ano--mês-orçamento';
            } else if (x.variáveis) {
              classe = 'meta__item-do-ano--mês-variáveis';
            }
            return {
              ...x,
              classe,
            };
          }),
      };

      return acc.concat([ano]);
    }, []);
});

</script>
<template>
  <article
    class="meta bgc50 p1 br6"
  >
    <h2 class="meta__título w900 t14 spacebetween uc br8">
      <router-link
        :to="{
          name: 'meta',
          params: {
            meta_id: meta.id
          }
        }"
      >
        {{ meta.codigo }} - {{ meta.titulo }}
      </router-link>
    </h2>

    <div class="meta__meta-dados">
      <ul class="meta__lista-de-anos flex g2 flexwrap start">
        <li
          v-for="item in mesesPorAno"
          :key="item.ano"
          class="meta__ano flex g1 mt025 mb025"
        >
          <span class="meta__ano-valor tamarelo flex center tc t12">
            {{ item.ano }}
          </span>
          <ul class="meta__lista-de-eventos flex flexwrap g05">
            <li
              v-for="subItem in item.valores"
              :key="subItem.mês"
              class="meta__item-do-ano br999 pl05 pr05 t11"
              :class="subItem.classe"
            >
              <span class="meta__mês">
                {{ subItem.mês }}
              </span>
              <span
                v-if="subItem.variáveis"
                class="meta__numero-de-variaveis tipinfo"
              >
                {{ subItem.variáveis }}
                <div>{{ subItem.variáveis }} variáveis</div>
              </span>
              <span
                v-if="subItem.orçamentos"
                class="meta__orcamento tipinfo"
              >
                $
                <div>há orçamentos em atraso</div>
              </span>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </article>
</template>
<style lang="less" scoped>
.meta__lista-de-eventos {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -0.5rem;

    border-left: 1px solid;
  }
}

.meta__ano {
  flex-basis: calc(50% - 1rem);
  min-width: 10rem;
  flex-shrink: 0;
  flex-grow: 1;
  max-width: max-content;
}

.meta__item-do-ano {
  background: @cinza-claro-azulado;
  white-space: nowrap;

  span + span {
    margin-left: 0.25em;

    &::before {
      content: '| ';
      color: @c300;
    }
  }
}

.meta__mês {}
.meta__numero-de-variaveis {
  font-variant-numeric: tabular-nums;
}

.meta__item-do-ano--mês-orçamento {
  background-color: @bege-claro;
}

.meta__item-do-ano--mês-variáveis {
  background-color: @cinza-claro-azulado;
}

.meta__item-do-ano--mês-variáveis-orçamento {
  background-color: @cinza-claro-avermelhado;
}
</style>
