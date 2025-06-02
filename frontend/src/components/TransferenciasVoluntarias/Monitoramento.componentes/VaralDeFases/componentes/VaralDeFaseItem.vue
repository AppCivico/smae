<script lang="ts" setup>
import useTamanhoDispositivo from '@/hooks/useTamanhoDispositivo';

export type VaralDeItemProps = {
  titulo: string,
  duracao?: number,
  responsavel: string,
  situacao: string,
  situacoes?: any[]
};

type Props = VaralDeItemProps & {
  secundario?: boolean
};

const { web } = useTamanhoDispositivo();

defineProps<Props>();

</script>

<template>
  <article :class="{'varal-de-fase-item__raiz': !$props.secundario}">
    <main
      :class="[
        'varal-de-fase-item',
        { 'varal-de-fase-item--secundario': $props.secundario }
      ]"
    >
      <header v-if="!web">
        <h4 class="varal-de-fase-item__titulo w600">
          {{ $props.titulo }}
        </h4>
      </header>

      <div class="varal-de-fase-item__conteudo">
        <header v-if="web">
          <span v-if="$props.secundario">*</span>
          <h4 class="varal-de-fase-item__titulo w600">
            {{ $props.titulo }}
          </h4>
        </header>

        <div
          v-if="$props.duracao"
          class="varal-de-fase-item__linha varal-de-fase-item__mesma-linha"
        >
          <h5>Duração</h5>

          <h6>{{ $props.duracao }}d</h6>
        </div>

        <div class="varal-de-fase-item__linha varal-de-fase-item__linha--duas">
          <h5>Responsável</h5>

          <h6>{{ $props.responsavel }}</h6>
        </div>

        <div class="varal-de-fase-item__linha varal-de-fase-item__linha--duas">
          <h5>Situação</h5>

          <h6>{{ $props.situacao }}</h6>
        </div>

        <di>
          <button v-if="$props.situacoes?.length">
            {{ 1 }}/ {{ $props.situacoes?.length }}
          </button>

          <button>Editar</button>
        </di>
      </div>
    </main>

    <div
      v-if="$props.situacoes?.length"
      class="varal-de-fase-item__situacoes"
    >
      <VaralDeFaseItem
        v-for="situacaoObjeto in $props.situacoes"
        :key="`fase--${situacaoObjeto.id}`"
        class="varal-de-fase-item__situacao-item"
        secundario
        :titulo="'titulo '+situacaoObjeto.id"
        :situacao="situacaoObjeto.tipo_situacao"
        responsavel="responsavel"
      />
    </div>
  </article>
</template>

<style lang="less" scoped>
@import "@/_less/tamanho-dispostivo.less";

article {
  width: 100%;
}

.varal-de-fase-item {
  width: 100%;
}

.varal-de-fase-item__raiz {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    height: calc(100% - 5px);
    border: 1px dashed #B8C0CC;
    z-index: -1;
  }
}

.varal-de-fase-item--secundario {
  .varal-de-fase-item__conteudo {
    border-style: dashed;
  }
}

.varal-de-fase-item__titulo {
  margin: 0;
  margin-bottom: 9px;

  .breakpoint-web();
  .-aplicar-web() {
    margin-bottom: 12px;
  }
}

.varal-de-fase-item__conteudo {
  background-color: #E0F2FF;
  padding: 8px 12px;
  border-radius: 18px;
  border: 1px solid #B8C0CC;
  width: 100%;
}

.varal-de-fase-item__conteudo:not(:has(.varal-de-fase-item__titulo)) {
  .varal-de-fase-item__linha:first-of-type {
    border-top: initial;
  }
}

.varal-de-fase-item__linha {
  display: flex;
  align-items: center;
  padding: 4px 0;
  border-top: 1px solid #B8C0CC;

  h5, h6 {
    font-size: 1rem;
    margin: 0;
  }

  h5 {
    font-weight: 300;
    line-height: 1.43rem;
    color: #595959;
    margin-right: 8px;
  }

  h6  {
    line-height: 1;
    color: #333333;
  }

  .breakpoint-web();
  .-aplicar-web() {
    padding: 12px 8px;
    justify-content: space-between;

    h5, h6 {
      line-height: 1.71rem;
    }

    h5 {
      font-weight: 300;
      font-size: 1.14rem;
    }

    h6  {
      font-weight: 400;
      font-size: 1.43rem;
    }
  }
}

.varal-de-fase-item__linha--duas {
  flex-direction: column;
  align-items: start;

  h6 {
    margin-top: 4px;
  }

  .breakpoint-mobile();
  .-aplicar-mobile() {
    flex-direction: row;
    h6 {
      margin-top: initial;
    }
  }
}

.varal-de-fase-item__situacoes {
  width: 100%;
  margin-top: 2rem;
}

.varal-de-fase-item__situacao-item {
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: initial;
  }
}
</style>
