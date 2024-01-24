<template>
  <div class="legenda-atrasadas mb1">
    <h2 class="legenda-atrasadas__título mb1 w700 t16">
      Legenda
    </h2>

    <ul class="legenda-atrasadas__lista">
      <li
        class="legenda-atrasadas__item legenda-atrasadas__item--mês-orçamento
        br999 pl05 pr05 ib mr05 mb05 t11"
      >
        <span class="legenda-atrasada__dado legenda-atrasada__dado--mês">
          mês
        </span>
        <span class="legenda-atrasada__dado legenda-atrasada__dado--orcamento">
          orçamento
        </span>
      </li>
      <li
        class="legenda-atrasadas__item legenda-atrasadas__item--mês-variáveis
        br999 pl05 pr05 ib mr05 mt025 mb025 t11"
      >
        <span class="legenda-atrasada__dado legenda-atrasada__dado--mês">
          mês
        </span>
        <span class="legenda-atrasada__dado legenda-atrasada__dado--numero-de-variaveis">
          número variáveis
        </span>
      </li>
      <li
        class="legenda-atrasadas__item legenda-atrasadas__item--mês-variáveis-orçamento
      br999 pl05 pr05 ib mr05 mt025 mb025 t11"
      >
        <span class="legenda-atrasada__dado legenda-atrasada__dado--mês">
          mês
        </span>
        <span class="legenda-atrasada__dado legenda-atrasada__dado--numero-de-variaveis">
          n. variáveis
        </span>
        <span class="legenda-atrasada__dado legenda-atrasada__dado--orcamento">
          orçamento
        </span>
      </li>
    </ul>
  </div>
</template>
<style lang="less">
.legenda-atrasadas {}

.legenda-atrasadas__título {}

.legenda-atrasadas__lista {}

.legenda-atrasadas__item {}

.legenda-atrasadas__item--mês-orçamento {
  background-color: @bege-claro;
}

.legenda-atrasadas__item--mês-variáveis {
  background-color: @cinza-claro-azulado;
}

.legenda-atrasadas__item--mês-variáveis-orçamento {
  background-color: @cinza-claro-avermelhado;
}

.legenda-atrasada__dado {
  + .legenda-atrasada__dado {
    &::before {
      content: ' | ';
      color: @c500;
    }
  }
}

.legenda-atrasada__dado--mês {}

.legenda-atrasada__dado--orcamento {}

.legenda-atrasada__dado--numero-de-variaveis {}

.legenda-atrasada__dado--orcamento {}
</style>
