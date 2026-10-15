<script lang="ts" setup>
import type { PSMFQuadroMetasDto } from '@back/mf/ps-dash/dto/ps.dto';

import NumeroComLegenda from '@/components/painelEstrategico/NumeroComLegenda.vue';

type Props = {
  metas: PSMFQuadroMetasDto | null;
};

defineProps<Props>();
</script>
<template>
  <section
    v-if="$props.metas"
    class="painel-grandes-numeros-metas"
  >
    <article
      class="painel-grandes-numeros-metas__coluna painel-grandes-numeros-metas__coluna--grande"
    >
      <NumeroComLegenda
        como-item
        :numero="$props.metas.com_pendencia"
        cor="#a6b6bd"
        legenda="Metas com pendência"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="115"
        :tamanho-da-legenda="12"
      />

      <NumeroComLegenda
        como-item
        :numero="$props.metas.sem_pendencia"
        cor="#005c8a"
        legenda="Metas sem pendência"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="115"
        :tamanho-da-legenda="12"
      />
    </article>
    <div class="painel-grandes-numeros-metas__coluna">
      <article>
        <h2>Metas com variáveis</h2>
        <div class="painel-grandes-numeros-metas__grupo-de-numeros">
          <NumeroComLegenda
            como-item
            :numero="$props.metas.variaveis_a_liberar"
            cor="#a6b6bd"
            legenda="A liberar"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />

          <NumeroComLegenda
            como-item
            :numero="$props.metas.variaveis_liberadas"
            cor="#005c8a"
            legenda="Liberadas"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />
        </div>
      </article>
      <article>
        <h2>Cronogramas</h2>
        <div class="painel-grandes-numeros-metas__grupo-de-numeros">
          <NumeroComLegenda
            como-item
            :numero="$props.metas.cronograma_a_preencher"
            cor="#a6b6bd"
            legenda="Preencher"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />

          <NumeroComLegenda
            como-item
            :numero="$props.metas.cronograma_preenchido"
            cor="#005c8a"
            legenda="Preenchidos"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />
        </div>
      </article>
      <article>
        <h2>Orçamentos</h2>
        <div class="painel-grandes-numeros-metas__grupo-de-numeros">
          <NumeroComLegenda
            como-item
            :numero="$props.metas.orcamento_a_preencher"
            cor="#a6b6bd"
            legenda="Preencher"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />

          <NumeroComLegenda
            como-item
            :numero="$props.metas.orcamento_preenchido"
            cor="#005c8a"
            legenda="Preenchidos"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />
        </div>
      </article>
    </div>
    <div class="painel-grandes-numeros-metas__coluna">
      <article
        v-for="fase in $props.metas.fases_monitoramento"
        :key="fase.id ?? fase.ordem"
      >
        <h2 class="painel-grandes-numeros-metas__titulo-fase">
          {{ fase.rotulo }}
        </h2>
        <div class="painel-grandes-numeros-metas__grupo-de-numeros">
          <NumeroComLegenda
            como-item
            :numero="fase.a_preencher"
            cor="#a6b6bd"
            legenda="Pendentes"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />

          <NumeroComLegenda
            como-item
            :numero="fase.preenchidas"
            cor="#005c8a"
            legenda="Preenchidas"
            cor-de-fundo="#e8e8e866"
            :tamanho-do-numero="58"
            :tamanho-da-legenda="12"
          />
        </div>
      </article>
    </div>
  </section>
</template>
<style lang="less" scoped>
.painel-grandes-numeros-metas {
  display: grid;
  gap: 3rem;
  padding: 2rem 0;
}

.painel-grandes-numeros-metas h2 {
  font-size: 1rem;
  color: #7e858d;
}

.painel-grandes-numeros-metas__titulo-fase {
  overflow-wrap: anywhere;
}

.painel-grandes-numeros-metas__coluna {
  display: grid;
  gap: 3rem;
}

.painel-grandes-numeros-metas__coluna--grande {
  align-items: start;
  align-content: center;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.painel-grandes-numeros-metas__grupo-de-numeros {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}

@container (width > 800px) {
  .painel-grandes-numeros-metas {
    grid-template-columns: 1.2fr 1fr 1fr;
  }

  .painel-grandes-numeros-metas__coluna--grande {
    grid-template-columns: auto;
    justify-items: center;
    border-right: 1px solid #607a9f;
  }
}
</style>
