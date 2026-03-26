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
    validator(value: string) {
      return ['flex', 'grid'].includes(value);
    },
  },
  maximoDeColunas: {
    type: [Number, String],
    required: false,
    default: undefined,
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
      resultado.class = [classeExistente, 'description-list__item--full'].filter(Boolean);
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
  if (!isGrid.value) return undefined;

  const estilo: Record<string, string> = {};

  if (props.larguraMinima) {
    estilo['--dl-item-min-width'] = props.larguraMinima;
  }

  if (props.maximoDeColunas) {
    estilo['--dl-max-col-count'] = String(props.maximoDeColunas);
  }

  return Object.keys(estilo).length ? estilo : undefined;
});

const classeContainer = computed(() => [
  'description-list',
  isGrid.value ? 'description-list--grid' : 'description-list--flex',
  isGrid.value && props.maximoDeColunas ? 'description-list--grid-limitado' : '',
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
      :aria-field="item.chave"
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

<style>
.description-list {}

.description-list--flex {
  display: flex;
  flex-wrap: wrap;
  gap: 2.5rem 2rem;

  .description-list__item {
    flex: 1 1 auto;
  }
}

.description-list--grid {
  --dl-item-min-width: 13rem;
  --dl-gap: 2rem;

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--dl-item-min-width), 1fr));
  gap: 2.5rem var(--dl-gap);
}

/*
 * Limita o número máximo de colunas mantendo o auto-fit responsivo.
 * @link https://codepen.io/kevinpowell/pen/GgRwqxJ
 *
 * 1. --dl-col-size-calc: calcula o tamanho que cada coluna teria se
 *    houvesse exatamente N colunas (descontando os gaps).
 * 2. --dl-col-min-size-calc: usa min(100%, max(mínimo, cálculo)) para
 *    garantir que o valor nunca exceda 100% (evita overflow em telas
 *    estreitas) e nunca fique abaixo do mínimo responsivo.
 * 3. Esse valor calculado é usado como o mínimo do minmax(), e o
 *    auto-fit cuida do resto.
 */
.description-list--grid-limitado {
  --dl-col-size-calc: calc(
    (100% - var(--dl-gap) * var(--dl-max-col-count)) /
      var(--dl-max-col-count)
  );
  --dl-col-min-size-calc: min(
    100%,
    max(var(--dl-item-min-width), var(--dl-col-size-calc))
  );

  grid-template-columns: repeat(
    auto-fit,
    minmax(var(--dl-col-min-size-calc), 1fr)
  );
}

.description-list__item--full {
  grid-column: 1 / -1;
}

.description-list__term {

}

.description-list__description {

}
</style>
