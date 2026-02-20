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
  larguraMinima: {
    type: String,
    required: false,
    default: '',
  },
  layout: {
    type: String as () => 'flex' | 'grid',
    required: false,
    default: 'flex',
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

const isGrid = computed(() => props.layout === 'grid');

const mapaDeItens = computed<Map<string, ConfigDeItem>>(() => {
  if (!props.itensSelecionados) {
    return new Map();
  }

  return new Map(
    props.itensSelecionados.map((campo) => {
      const config = normalizarItem(campo);
      return [config.chave, config];
    }),
  );
});

function aplicarLarguraBase(
  atributos: Record<string, unknown>,
  larguraBase?: string,
): Record<string, unknown> {
  if (!larguraBase) {
    return atributos;
  }

  const resultado = { ...atributos };

  if (isGrid.value) {
    if (larguraBase === '100%') {
      const classeExistente = resultado.class;
      resultado.class = [classeExistente, 'description-list__item--full'].filter(Boolean).join(' ');
    }
  } else {
    const styleExistente = resultado.style;

    if (typeof styleExistente === 'string') {
      const trimmed = styleExistente.trim();

      if (!trimmed) {
        resultado.style = `flex-basis: ${larguraBase};`;
      } else {
        const separator = trimmed.endsWith(';')
          ? ' '
          : '; ';
        resultado.style = `${styleExistente}${separator}flex-basis: ${larguraBase};`;
      }
    } else if (Array.isArray(styleExistente)) {
      resultado.style = [...styleExistente, { flexBasis: larguraBase }];
    } else if (typeof styleExistente === 'object' && styleExistente !== null) {
      resultado.style = {
        ...styleExistente as Record<string, unknown>,
        flexBasis: larguraBase,
      };
    } else {
      resultado.style = { flexBasis: larguraBase };
    }
  }

  return resultado;
}

function resolverTitulo(chave: string, tituloExplicito?: string): string | undefined {
  return tituloExplicito
    || mapaDeItens.value.get(chave)?.titulo
    || tituloDoSchema(chave)
    || undefined;
}

function montarItem(config: ConfigDeItem, item: ItemDeLista): ItemDeLista {
  const larguraBase = item.larguraBase || config.larguraBase;
  const atributosMesclados = { ...config.atributosDoItem, ...item.atributosDoItem };

  return {
    ...item,
    titulo: resolverTitulo(item.chave, item.titulo),
    atributosDoItem: aplicarLarguraBase(atributosMesclados, larguraBase),
  };
}

const listaConvertida = computed(() => {
  const mapa = mapaDeItens.value;

  if (Array.isArray(props.lista)) {
    return props.lista.map((item) => {
      const config = mapa.get(item.chave);
      return montarItem(config || { chave: item.chave }, item);
    });
  }

  if (!props.objeto) {
    return [];
  }

  const { objeto } = props;

  if (mapa.size) {
    return [...mapa.entries()].reduce<ItemDeLista[]>((acc, [chave, config]) => {
      if (chave in objeto) {
        acc.push(montarItem(config, {
          chave,
          valor: objeto[chave],
        }));
      }
      return acc;
    }, []);
  }

  return Object.entries(objeto).map(([chave, valor]) => ({
    chave,
    valor,
    titulo: resolverTitulo(chave),
    atributosDoItem: undefined,
    metadados: undefined,
  }));
});

const estiloContainer = computed(() => {
  if (isGrid.value && props.larguraMinima) {
    return { '--dl-item-min-width': props.larguraMinima };
  }
  return undefined;
});

const classeContainer = computed(() => [
  'description-list',
  isGrid.value ? 'description-list--grid' : 'description-list--flex',
]);
</script>

<template>
  <dl
    v-if="listaConvertida.length"
    :class="classeContainer"
    :style="estiloContainer"
  >
    <div
      v-for="(item, index) in listaConvertida"
      :key="index"
      class="description-list__item"
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
  margin-bottom: 1rem;

  + .description-list {
    border-top: 1px solid @c100;
    padding-top: 1rem;
    margin-top: 1rem;
  }
}

.description-list--flex {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;

  .description-list__item {
    flex: 1 1 auto;
  }
}

.description-list--grid {
  --dl-item-min-width: 180px;

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--dl-item-min-width), 1fr));
  gap: 2rem;
}

.description-list__item--full {
  grid-column: 1 / -1;
}

.description-list__term {

}

.description-list__description {

}
</style>
