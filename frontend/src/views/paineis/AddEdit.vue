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

    <div class="flex">
      <label class="block mb1">
        <input
          class="inputcheckbox"
          type="checkbox"
          name="desativado"
          value="1"
        /><span>Painel ativo</span>
      </label>
    </div>

    <div class="flex g2">
      <div class="f2">
        <label class="label">Nome<span class="tvermelho">*</span></label
        ><input type="text" class="inputtext light mb1" name="codigo" />
        <div class="error-msg"></div>
      </div>
      <div class="f1">
        <label class="label">
          Periodicidade<span class="tvermelho">*</span>
        </label>
        <select class="inputtext light">
          <option value="">Periodicidade</option>
          <option value="86">opt1</option>
          <option value="115">opt2</option>
          <option value="116">opt3</option>
        </select>
      </div>
    </div>

    <div class="flex g2">
      <div class="">
        <label class="block mb1">
          <input
            class="inputcheckbox"
            type="checkbox"
            name="desativado"
            value="1"
          /><span>Exibir planejado por padrão</span>
        </label>
      </div>
      <div class="">
        <label class="block mb1">
          <input
            class="inputcheckbox"
            type="checkbox"
            name="desativado"
            value="1"
          /><span>Exibir acumulado por padrão</span>
        </label>
      </div>
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
                <use xlink:href="#i_down"></use>
              </svg>
              <span class="w700">Meta 1</span>
            </div>
          </td>

          <td style="text-align: right; width: 50%">
            <a href="#" class="tprimary mr1">
              <svg width="20" height="20" class="blue">
                <use xlink:href="#i_edit"></use>
              </svg>
            </a>
            <a href="#" class="tprimary">
              <svg width="20" height="20" class="blue">
                <use xlink:href="#i_waste"></use>
              </svg>
            </a>
          </td>
        </tr>
        <tz>
          <td colspan="56" style="padding-left: 0">
            <table class="tablemain no-border mb1">
              <thead>
                <tr class="no-border">
                  <th>Periodicidade</th>
                  <th>Período</th>
                  <th>Meses</th>
                  <th>Planejado</th>
                  <th>Acumulado</th>
                </tr>
              </thead>
              <tbody>
                <tr class="no-border bgc50">
                  <td>Mensal</td>
                  <td>Meses anteriores</td>
                  <td>12</td>
                  <td>Sim</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>

            <table class="tablemain no-border">
              <thead>
                <tr class="no-border">
                  <th>
                    Conteúdo da meta incluso na visão de evolução
                    <a href="#" style="float: right">
                      <svg width="20" height="20" class="blue">
                        <use xlink:href="#i_edit"></use>
                      </svg>
                    </a>
                  </th>
                </tr>
              </thead>
              <hr />
              <thead class="subtable">
                <tr>
                  <th class="">
                    <a href="#" class="tprimary">
                      <svg width="20" height="20" class="blue mr05">
                        <use xlink:href="#i_graf"></use>
                      </svg>
                    </a>
                    Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                  </th>
                </tr>
                <tr>
                  <td class="w700">Indicador da Iniciativa 1.1</td>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
                <tr>
                  <th class="pl2">
                    <a href="#" class="tprimary">
                      <svg width="20" height="20" class="blue mr05">
                        <use xlink:href="#i_graf"></use>
                      </svg>
                    </a>
                    Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                  </th>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
                <tr>
                  <th class="pl2">
                    <a href="#" class="tprimary">
                      <svg width="20" height="20" class="blue mr05">
                        <use xlink:href="#i_graf"></use>
                      </svg>
                    </a>
                    Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                  </th>
                </tr>
                <tr>
                  <td class="pl2 w700">
                    Variável simples 1 da Atividade 1.1.1
                  </td>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
              </thead>
            </table>
          </td>
        </tz>
      </tbody>
    </table>
    <!--TABELA-->
    <table class="tablemain">
      <tbody>
        <tr class="tzaccordeon" @click="toggleAccordeon">
          <td style="widht: 50%">
            <div class="flex">
              <svg class="arrow" width="13" height="8">
                <use xlink:href="#i_down"></use>
              </svg>
              <span class="w700">Meta 2</span>
            </div>
          </td>

          <td style="text-align: right; width: 50%">
            <a href="#" class="tprimary mr1">
              <svg width="20" height="20" class="blue">
                <use xlink:href="#i_edit"></use>
              </svg>
            </a>
            <a href="#" class="tprimary">
              <svg width="20" height="20" class="blue">
                <use xlink:href="#i_waste"></use>
              </svg>
            </a>
          </td>
        </tr>
        <tz>
          <td colspan="56" style="padding-left: 0">
            <table class="tablemain no-border mb1">
              <thead>
                <tr class="no-border">
                  <th>Periodicidade</th>
                  <th>Período</th>
                  <th>Meses</th>
                  <th>Planejado</th>
                  <th>Acumulado</th>
                </tr>
              </thead>
              <tbody>
                <tr class="no-border bgc50">
                  <td>Mensal</td>
                  <td>Meses anteriores</td>
                  <td>12</td>
                  <td>Sim</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>

            <table class="tablemain no-border">
              <thead>
                <tr class="no-border">
                  <th>
                    Conteúdo da meta incluso na visão de evolução

                    <a href="#" style="float: right">
                      <svg width="20" height="20" class="blue">
                        <use xlink:href="#i_edit"></use>
                      </svg>
                    </a>
                  </th>
                </tr>
              </thead>
              <hr />
              <thead class="subtable">
                <tr>
                  <th class="">
                    <a href="#" class="tprimary">
                      <svg width="20" height="20" class="blue mr05">
                        <use xlink:href="#i_graf"></use>
                      </svg>
                    </a>
                    Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                  </th>
                </tr>
                <tr>
                  <td class="w700">Indicador da Iniciativa 1.1</td>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
                <tr>
                  <th class="pl2">
                    <a href="#" class="tprimary">
                      <svg width="20" height="20" class="blue mr05">
                        <use xlink:href="#i_graf"></use>
                      </svg>
                    </a>
                    Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                  </th>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
                <tr>
                  <th class="pl2">
                    <a href="#" class="tprimary">
                      <svg width="20" height="20" class="blue mr05">
                        <use xlink:href="#i_graf"></use>
                      </svg>
                    </a>
                    Iniciativa 1.1 Lorem Ipsum Dolor - integra indicador da meta
                  </th>
                </tr>
                <tr>
                  <td class="pl2 w700">
                    Variável simples 1 da Atividade 1.1.1
                  </td>
                </tr>
                <tr>
                  <td class="pl2">Variável simples 1 da Atividade 1.1.1</td>
                </tr>
              </thead>
            </table>
          </td>
        </tz>
      </tbody>
    </table>
    <!--TABELA-->
    <table class="tablemain">
      <tbody>
        <tr class="tzaccordeon" @click="toggleAccordeon">
          <td style="widht: 50%">
            <div class="flex">
              <svg class="arrow" width="13" height="8">
                <use xlink:href="#i_down"></use>
              </svg>
              <span class="w700">Meta 3</span>
            </div>
          </td>

          <td style="text-align: right; width: 50%">
            <a href="#" class="tprimary">
              <svg width="20" height="20" class="blue">
                <use xlink:href="#i_waste"></use>
              </svg>
            </a>
          </td>
        </tr>
        <tz> </tz>
      </tbody>
    </table>
    <div class="bgc50">
      <div class="tc">
        <div class="addlink center flex f0 tc p1 no-border bgc50">
          <svg width="20" height="20"><use xlink:href="#i_+"></use></svg
          ><span>Adicionar Meta(s)</span>
        </div>
      </div>
    </div>

    <!-- BOTAO -->
    <label class="addlink mt2">
      <svg width="20" height="20"><use xlink:href="#i_+"></use></svg>
      <span>Adicionar Meta(s)</span>
    </label>
    <hr class="mt1 mb2" />
  </Dashboard>
</template>
