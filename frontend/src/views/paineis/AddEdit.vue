<script setup>
import { Dashboard } from "@/components";
function toggleAccordeon(t) {
  t.target.closest(".tzaccordeon").classList.toggle("active");
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Novo painel</h1>
      <hr class="ml2 f1" />
      <button @click="checkClose" class="btn round ml2">
        <svg width="12" height="12"><use xlink:href="#i_x"></use></svg>
      </button>
    </div>
    <div class="flex spacebetween center mb2 mt2">
      <hr class="mr2 f1" />
      <button class="btn big" :disabled="isSubmitting">SALVAR PAINEL</button>
      <hr class="ml2 f1" />
    </div>
    <hr class="f1 mb1 mt1" />
    <h5 class="tc500 uc">Conteúdo</h5>
    <hr class="f1 mb1 mt1" />
    <div class="flex center mb2">
      <div class="f2 search">
        <input placeholder="Buscar" type="text" class="inputtext" />
      </div>
    </div>
    <!--TABELA-->

    <table class="tablemain">
      <tbody>
        <tr class="tzaccordeon" @click="toggleAccordeon">
          <td style="widht: 50%">
            <div class="flex">
              <svg class="arrow" width="13" height="8">
                <use xlink:href="#i_down"></use></svg
              ><span>Meta 1</span>
            </div>
          </td>

          <td style="text-align: right; width: 50%">
            <a href="#" class="tprimary"
              ><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg
            ></a>
          </td>
        </tr>
        <tz>
          <td colspan="5" style="">
            <table class="tablemain">
              <thead>
                <tr>
                  <th>Periodicidade</th>
                  <th>Período</th>
                  <th>Meses</th>
                  <th>Planejado</th>
                  <th>Acumulado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mensal</td>
                  <td>Meses anteriores</td>
                  <td>12</td>
                  <td>Sim</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tz>

        <!-- MODELO 
        <tr class="tzaccordeon" @click="toggleAccordeon">
          <td>
            <div class="flex">
              <svg class="arrow" width="13" height="8">
                <use xlink:href="#i_down"></use></svg
              ><span>Programa de Metas 1900 - 1910</span>
            </div>
          </td>
          <td>Programa de Metas da Janis Joplin</td>
          <td>Janis Joplin</td>
          <td>Não</td>
          <td style="white-space: nowrap; text-align: right">
            <a href="/pdm/2" class="tprimary"
              ><svg width="20" height="20"><use xlink:href="#i_edit"></use></svg
            ></a>
          </td>
        </tr>
        <tz>
          <td colspan="56" style="padding-left: 2rem">
            <table class="tablemain mb1">
              <thead>
                <tr>
                  <th style="width: 90%">Pilares</th>
                  <th style="width: 10%"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ET - Alto e bom som2</td>
                  <td style="white-space: nowrap; text-align: right">
                    <a href="/pdm/2/macrotemas/1" class="tprimary"
                      ><svg width="20" height="20">
                        <use xlink:href="#i_edit"></use></svg
                    ></a>
                  </td>
                </tr>
              </tbody>
            </table>
            <a href="/pdm/2/macrotemas/novo" class="addlink mb2"
              ><svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
              <span>Adicionar Pilares</span></a
            ><br />
            <table class="tablemain mb1">
              <thead>
                <tr>
                  <th style="width: 90%">Tema</th>
                  <th style="width: 10%"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Objetivo - teste auditivo</td>
                  <td style="white-space: nowrap; text-align: right">
                    <a href="/pdm/2/temas/1" class="tprimary"
                      ><svg width="20" height="20">
                        <use xlink:href="#i_edit"></use></svg
                    ></a>
                  </td>
                </tr>
                <tr>
                  <td>nov ooe</td>
                  <td style="white-space: nowrap; text-align: right">
                    <a href="/pdm/2/temas/7" class="tprimary"
                      ><svg width="20" height="20">
                        <use xlink:href="#i_edit"></use></svg
                    ></a>
                  </td>
                </tr>
                <tr>
                  <td>Mais um tema</td>
                  <td style="white-space: nowrap; text-align: right">
                    <a href="/pdm/2/temas/9" class="tprimary"
                      ><svg width="20" height="20">
                        <use xlink:href="#i_edit"></use></svg
                    ></a>
                  </td>
                </tr>
              </tbody>
            </table>
            <a href="/pdm/2/temas/novo" class="addlink mb2"
              ><svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
              <span>Adicionar Tema</span></a
            ><br />
            <table class="tablemain mb1">
              <thead>
                <tr>
                  <th style="width: 90%">Sub Tema</th>
                  <th style="width: 10%"></th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
            <a href="/pdm/2/subtemas/novo" class="addlink mb2"
              ><svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
              <span>Adicionar Sub Tema</span></a
            ><br />
            <table class="tablemain mb1">
              <thead>
                <tr>
                  <th style="width: 60%">Tag</th>
                  <th style="width: 30%">Icone</th>
                  <th style="width: 10%"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>TAG2sdas</td>
                  <td></td>
                  <td style="white-space: nowrap; text-align: right">
                    <a href="/pdm/2/tags/6" class="tprimary"
                      ><svg width="20" height="20">
                        <use xlink:href="#i_edit"></use></svg
                    ></a>
                  </td>
                </tr>
                <tr>
                  <td>nova tag</td>
                  <td></td>
                  <td style="white-space: nowrap; text-align: right">
                    <a href="/pdm/2/tags/13" class="tprimary"
                      ><svg width="20" height="20">
                        <use xlink:href="#i_edit"></use></svg
                    ></a>
                  </td>
                </tr>
              </tbody>
            </table>
            <a href="/pdm/2/tags/novo" class="addlink mb1"
              ><svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
              <span>Adicionar Tag</span></a
            >
            <table class="tablemain mb1">
              <thead>
                <tr>
                  <th style="width: 30%">Arquivos</th>
                  <th style="width: 60%">Descrição</th>
                  <th style="width: 10%"></th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
            <a href="/pdm/2/arquivos/novo" class="addlink mb1"
              ><svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
              <span>Adicionar arquivo</span></a
            >
          </td>
        </tz>
        -->
      </tbody>
    </table>

    <!-- BOTAO -->
    <label class="addlink mt2">
      <svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
      <span>Adicionar Meta(s)</span>
    </label>
    <hr class="mt1 mb2" />
  </Dashboard>
</template>
