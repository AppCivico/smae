<script setup lang="ts">
import { computed } from 'vue';
import type { AnyObjectSchema } from 'yup';

import buscarDadosDoYup from './camposDeFormulario/helpers/buscarDadosDoYup';

type ObjetoGenerico = Record<string, string | number | null | undefined>;

type ConfigDeItem = {
  chave: string;
  titulo?: string;
  larguraBase?: string;
  atributosDoItem?: Record<string, unknown>;
};

type ItemDeLista = ConfigDeItem & {
  valor: string | number | null | undefined;
  metadados?: Record<string, unknown>;
};

type ConfigOuChave = string | ConfigDeItem;

type Props = {
  objeto?: ObjetoGenerico;
  lista?: Array<ItemDeLista>;
};

const props = defineProps({
  objeto: {
    type: Object as () => ObjetoGenerico,
    required: false,
    default: () => null,
    validator(value: ObjetoGenerico | null, allProps: Props) {
      return (value !== null && typeof value === 'object') || allProps.lista !== undefined;
    },
  },
  lista: {
    type: Array as () => Array<ItemDeLista>,
    required: false,
    default: () => undefined,
    validator(value: Array<ItemDeLista>, allProps: Props) {
      return (value !== undefined && Array.isArray(value)) || allProps.objeto !== undefined;
    },
  },
  itensSelecionados: {
    type: Array as () => Array<ConfigOuChave>,
    required: false,
    default: () => undefined,
  },
  schema: {
    type: Object as () => AnyObjectSchema,
    required: false,
    default: () => null,
  },
});

function tituloDoSchema(chave: string): string | undefined {
  return !props.schema
    ? undefined
    : buscarDadosDoYup(props.schema, chave)?.spec?.label || undefined;
}

function normalizarItem(campo: ConfigOuChave): ConfigDeItem {
  return typeof campo === 'string'
    ? { chave: campo }
    : campo;
}

const itensNormalizados = computed(() => props.itensSelecionados?.map(normalizarItem));

function aplicarLarguraBase(
  atributos: Record<string, unknown>,
  larguraBase?: string,
): Record<string, unknown> {
  if (!larguraBase) {
    return atributos;
  }

  const resultado = { ...atributos };
  const styleExistente = resultado.style;

  if (typeof styleExistente === 'string') {
    const separator = styleExistente.trim().endsWith(';') ? ' ' : '; ';
    resultado.style = `${styleExistente}${separator}flex-basis: ${larguraBase};`;
  } else if (typeof styleExistente === 'object' && styleExistente !== null) {
    resultado.style = {
      ...styleExistente as Record<string, unknown>,
      flexBasis: larguraBase,
    };
  } else {
    resultado.style = { flexBasis: larguraBase };
  }

  return resultado;
}

function resolverTitulo(chave: string, tituloExplicito?: string): string | undefined {
  if (tituloExplicito) {
    return tituloExplicito;
  }

  const configDoItem = itensNormalizados.value?.find((c) => c.chave === chave);

  return configDoItem?.titulo
    || tituloDoSchema(chave)
    || undefined;
}

const listaConvertida = computed(() => {
  if (Array.isArray(props.lista)) {
    return props.lista.map((item) => {
      const configDoItem = itensNormalizados.value?.find((c) => c.chave === item.chave);
      const larguraBase = item.larguraBase || configDoItem?.larguraBase;
      const atributosMesclados = { ...configDoItem?.atributosDoItem, ...item.atributosDoItem };

      return {
        ...item,
        titulo: resolverTitulo(item.chave, item.titulo),
        atributosDoItem: aplicarLarguraBase(atributosMesclados, larguraBase),
      };
    });
  }

  if (!props.objeto) {
    return [];
  }

  const { objeto } = props;

  return itensNormalizados.value
    ? itensNormalizados.value.reduce<ItemDeLista[]>((acc, item) => {
      if (item.chave in objeto) {
        acc.push({
          chave: item.chave,
          valor: objeto[item.chave],
          titulo: resolverTitulo(item.chave, item.titulo),
          atributosDoItem: aplicarLarguraBase(
            { ...item.atributosDoItem },
            item.larguraBase,
          ),
          metadados: undefined,
        });
      }
      return acc;
    }, [])
    : Object.entries(objeto).map(([chave, valor]) => ({
      chave,
      valor,
      titulo: resolverTitulo(chave),
      atributosDoItem: undefined,
      metadados: undefined,
    }));
});

</script>

<template>
  <dl
    v-if="listaConvertida.length"
    class="description-list flex g2 mb1 flexwrap"
  >
    <div
      v-for="(item, index) in listaConvertida"
      :key="index"
      class="description-list__item f1 mb1"
      v-bind="item.atributosDoItem"
    >
      <dt
        class="description-list__term t12 uc w700 mb05 tamarelo"
      >
        <slot
          :name="`termo--${item.chave}`"
          :item="item"
        >
          <slot
            name="termo"
            :item="item"
          >
            {{ item.titulo || item.chave }}
          </slot>
        </slot>
      </dt>
      <dd
        class="description-list__description t13"
      >
        <slot
          :name="`descricao--${item.chave}`"
          :item="item"
        >
          <slot
            name="descricao"
            :item="item"
          >
            {{ item.valor === 0 ? 0 : item.valor || '—' }}
          </slot>
        </slot>
      </dd>
    </div>
  </dl>
</template>

<style lang="less">
.description-list {
  + .description-list {
      border-top: 1px solid @c100;
      padding-top: 1rem;
      margin-top: 1rem;
    }
}

.description-list__item {

}

.description-list__term {

}

.description-list__description {

}
</style>
