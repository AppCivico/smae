<script setup>
import { Dashboard } from "@/components";
function toggleAccordeon(t) {
  t.target.closest(".tzaccordeon").classList.toggle("active");
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Painel Indicador</h1>
      <hr class="ml2 f1" />
      <a href="/paineis/novo" class="btn big ml2">Novo Modelo</a>
    </div>
    <div class="flex center mb2">
      <div class="f2 search">
        <input placeholder="Buscar" type="text" class="inputtext" />
      </div>
    </div>

    <table class="tablemain">
      <thead>
        <tr>
          <th style="width: 45%">Nome</th>
          <th style="width: 15%">Status</th>
          <th style="width: 15%">Periodicidade</th>
          <th style="width: 15%">Metas monitoradas</th>
          <th style="width: 10%"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Painel visão XYZ</td>
          <td>Ativo s</td>
          <td>Mensal</td>
          <td>10 de 77</td>
          <td style="white-space: nowrap; text-align: right">
            <a href="#" class="tprimary"
              ><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg
            ></a>
          </td>
        </tr>
        <tr>
          <td>Painel visão XYZ</td>
          <td>Ativo s</td>
          <td>Mensal</td>
          <td>10 de 77</td>
          <td style="white-space: nowrap; text-align: right">
            <a href="#" class="tprimary"
              ><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg
            ></a>
          </td>
        </tr>
        <tr>
          <td>Painel visão XYZ</td>
          <td>Ativo s</td>
          <td>Mensal</td>
          <td>10 de 77</td>
          <td style="white-space: nowrap; text-align: right">
            <a href="#" class="tprimary"
              ><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg
            ></a>
          </td>
        </tr>
        <tr>
          <td>Painel visão XYZ</td>
          <td>Ativo s</td>
          <td>Mensal</td>
          <td>10 de 77</td>
          <td style="white-space: nowrap; text-align: right">
            <a href="#" class="tprimary"
              ><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg
            ></a>
          </td>
        </tr>
      </tbody>
    </table>
  </Dashboard>
</template>
