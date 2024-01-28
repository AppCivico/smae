<template>
  <div class="legenda legenda--tarefas">
    <h2 class="legenda__título mb1 w700 t16">
      Legenda
    </h2>
    <dl class="legenda__lista flex g1 flexwrap">
      <div class="legenda__item flex g05 center">
        <dt class="legenda__ícone f0">
          <svg
            width="20"
            height="20"
            color="#e47d0f"
          ><use xlink:href="#i_circle" /></svg>
        </dt>
        <dd class="legenda__descrição f2">
          Registro de início pendente
        </dd>
      </div>
      <div class="legenda__item flex g05 center">
        <dt class="legenda__ícone f0">
          <svg
            width="20"
            height="20"
            color="#4074bf"
          ><use xlink:href="#i_circle" /></svg>
        </dt>
        <dd class="legenda__descrição f2">
          Registro de término pendente
        </dd>
      </div>
    </dl>
  </div>
</template>
