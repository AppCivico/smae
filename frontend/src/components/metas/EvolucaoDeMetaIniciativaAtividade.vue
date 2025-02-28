<template>
  <article
    class="board_variavel mb2"
    :aria-busy="haChamadasPendentes"
  >
    <header class="p1">
      <div class="flex center g2">
        <div class="flex center f1">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            class="f0"
            color="#8EC122"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24.9091 0.36377H3.09091C2.36759 0.36377 1.6739 0.651104
              1.16244 1.16257C0.650975 1.67403 0.36364 2.36772 0.36364
              3.09104V24.9092C0.36364 25.6325 0.650975 26.3262 1.16244
              26.8377C1.6739 27.3492 2.36759 27.6365 3.09091
              27.6365H24.9091C25.6324 27.6365 26.3261 27.3492 26.8376
              26.8377C27.349 26.3262 27.6364 25.6325 27.6364
              24.9092V3.09104C27.6364 2.36772 27.349 1.67403 26.8376
              1.16257C26.3261 0.651104 25.6324 0.36377 24.9091
              0.36377ZM24.9091 3.09104V8.54559H24.3636L22.1818
              10.7274L16.5909 5.1365L11.1364 11.9547L7.18182 8.00012L3.90909
              11.2729H3.09091V3.09104H24.9091ZM3.09091
              24.9092V14.0001H5L7.18182 11.8183L11.4091 16.0456L16.8636
              9.22741L22.1818 14.5456L25.5909
              11.2729H24.9091V24.9092H3.09091Z"
              fill="currentColor"
            />
            <path
              d="M7.18182 19.4547H4.45455V23.5456H7.18182V19.4547Z"
              fill="currentColor"
            />
            <path
              d="M12.6364 18.091H9.90909V23.5456H12.6364V18.091Z"
              fill="currentColor"
            />
            <path
              d="M18.0909 15.3638H15.3636V23.5456H18.0909V15.3638Z"
              fill="currentColor"
            />
            <path
              d="M23.5455 18.091H20.8182V23.5456H23.5455V18.091Z"
              fill="currentColor"
            />
          </svg>
          <h2 class="mt1 mb1 ml1 f1">
            {{ variavel.codigo }} - {{ variavel.titulo }}
          </h2>
          <div
            v-if="variavel.suspendida"
            class="tipinfo left"
          >
            <svg
              width="24"
              height="24"
              color="#F2890D"
            ><use xlink:href="#i_alert" /></svg><div>
              Suspensa do monitoramento físico em {{ dateToField(variavel.suspendida_em) }}
            </div>
          </div>
        </div>

        <div
          v-if="$route.meta.entidadeMãe === 'pdm'
            && !variavel.etapa
            && temPermissãoPara([
              'CadastroMeta.administrador_no_pdm',
              'CadastroMetaPS.administrador_no_pdm',
              'CadastroMetaPDM.administrador_no_pdm'
            ])"
          class="f0 dropbtn right"
        >
          <span class="tamarelo"><svg
            width="20"
            height="20"
          ><use xlink:href="#i_more" /></svg></span>
          <ul>
            <li>
              <SmaeLink
                :to="`${parentLink}/evolucao/${indicador.id}/variaveis/${variavel.id}`"
                class="tprimary"
              >
                Editar variável
              </SmaeLink>
            </li>
            <li>
              <SmaeLink
                :to="`${parentLink}/evolucao/${indicador.id}/variaveis/${variavel.id}/valores`"
                class="tprimary"
              >
                Valores previstos
              </SmaeLink>
            </li>
            <li>
              <SmaeLink
                v-if="temPermissãoPara(['CadastroPessoa.administrador'])"
                :to="`${parentLink}/evolucao/${indicador.id}/variaveis/${variavel.id}/retroativos`"
                class="tprimary"
              >
                Valores realizados retroativos
              </SmaeLink>
            </li>
          </ul>
        </div>
      </div>

      <LoadingComponent v-if="haChamadasPendentes" />
      <GraficoHeatmapVariavelCategorica
        v-else-if="variavel.variavel_categorica_id > 0"
        :valores="Valores[(variavel.id as keyof {})]"
      />
      <GraficoLinhasEvolucao
        v-else
        :valores="Valores[(variavel.id as keyof {})]"
      />
    </header>

    <section>
      <div class="tablepreinfo">
        <div class="flex spacebetween">
          <div class="flex center">
            <div class="t12 lh1 w700 uc tc400">
              Previsto X Realizado
            </div>
            <div class="tipinfo ml1">
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_i" /></svg><div>
                Indicador calculado pela média móvel das variáveis
              </div>
            </div>
          </div>
          <!-- <div>
                <a class="addlink"><svg width="20"
                  height="20"><use xlink:href="#i_+"></use></svg><span>
                  Adicionar período
                </span></a>
            </div> -->
        </div>
      </div>
      <table class="tablemain">
        <thead>
          <tr>
            <th>
              Mês/Ano
            </th>
            <th>
              Previsto Mensal
            </th>
            <th>
              Realizado Mensal
            </th>
            <th>
              Previsto Acumulado
            </th>
            <th>
              Realizado Acumulado
            </th>
            <th />
          </tr>
        </thead>

        <tbody v-if="haChamadasPendentes">
          <tr>
            <td colspan="6">
              <LoadingComponent class="horizontal" />
            </td>
          </tr>
        </tbody>
        <GruposDeSerie
          v-else
          :g="Valores[(variavel.id as keyof {})]"
          variavel="true"
          :tem-variavel-acumulada="!!variavel.acumulativa"
        />
      </table>
    </section>
  </article>
</template>
<script lang="ts" setup>
import type { Indicador } from '@back/indicador/entities/indicador.entity';
import type { VariavelItemDto } from '@back/variavel/entities/variavel.entity';
import { storeToRefs } from 'pinia';
import { ref, watch, type PropType } from 'vue';
import GraficoLinhasEvolucao from '@/components/GraficoLinhasEvolucao.vue';
import GruposDeSerie from '@/components/metas/GruposDeSerie.vue';
import GraficoHeatmapVariavelCategorica from '@/components/GraficoHeatmapVariavelCategorica.vue';
import dateToField from '@/helpers/dateToField';
import { useAuthStore } from '@/stores/auth.store';
import { useVariaveisStore } from '@/stores/variaveis.store';

const authStore = useAuthStore();
const { temPermissãoPara } = authStore;

const props = defineProps({
  indicador: {
    type: Object as PropType<Indicador>,
    default: () => ({}),
    required: true,
  },
  variavel: {
    type: Object as PropType<VariavelItemDto>,
    required: true,
  },
  parentLink: {
    type: String,
    required: true,
  },
});

const VariaveisStore = useVariaveisStore();
const { Valores } = storeToRefs(VariaveisStore);

const haChamadasPendentes = ref(false);

watch(() => props.variavel.id, () => {
  if (props.variavel.id) {
    haChamadasPendentes.value = true;
    VariaveisStore.getValores(props.variavel.id, { leitura: true })
      .then(() => {
        haChamadasPendentes.value = false;
      });
  }
}, { immediate: true });
</script>
