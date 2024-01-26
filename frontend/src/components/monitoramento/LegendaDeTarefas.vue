<template>
  <div class="legenda-de-variáveis">
    <h2 class="legenda-de-variáveis__título mb1 w700 t16">
      Legenda
    </h2>
    <dl class="legenda-de-variáveis__lista flex g1 justifyright flexwrap">
      <div class="legenda-de-variáveis__item flex g05 center">
        <dt class="legenda-de-variáveis__ícone f0">
          <svg
            width="20"
            height="20"
            color="#e47d0f"
          ><use xlink:href="#i_circle" /></svg>
        </dt>
        <dd class="legenda-de-variáveis__descrição f2">
          Registro de início pendente
        </dd>
      </div>
      <div class="legenda-de-variáveis__item flex g05 center">
        <dt class="legenda-de-variáveis__ícone f0">
          <svg
            width="20"
            height="20"
            color="#4074bf"
          ><use xlink:href="#i_circle" /></svg>
        </dt>
        <dd class="legenda-de-variáveis__descrição f2">
          Registro de término pendente
        </dd>
      </div>
    </dl>
  </div>
</template>
