<script setup>
import TransitionExpand from '@/components/TransitionExpand.vue';
import { usePdMStore } from '@/stores/pdm.store';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const PdMStore = usePdMStore();

const exibirMensagemDeSucessoNoEnvio = ref(false);

if (!PdMStore.PdM.length) {
  PdMStore.getAll().then(() => {
    const currentPdM = PdMStore.PdM.find((x) => !!x.ativo);
    if (currentPdM?.id && !route.query.pdm_id) {
      router.replace({
        name: route.name,
        query: { pdm_id: currentPdM?.id },
      });
    }
  });
}
</script>
<template>
  <div
    v-bind="$attrs"
    class="flex spacebetween center mb2"
  >
    <h1>
      {{ typeof $route?.meta?.título === 'function'
        ? $route.meta.título()
        : $route?.meta?.título || 'Projetos' }}
    </h1>
    <hr class="ml2 f1">
    <router-link
      :to="{
        name: 'EnviosOrcamentosMetasPdmNovo',
        query: $route.query
      }"
      class="btn big ml1"
      @click="exibirMensagemDeSucessoNoEnvio = false"
    >
      Enviar arquivo
    </router-link>
  </div>

  <router-view
    v-slot="{ Component }"
    @enviado="exibirMensagemDeSucessoNoEnvio = true"
  >
    <component :is="Component">
      <template #filtro>
        <div class="f1">
          <label
            for="pdm_id"
            class="label"
          >
            <abbr title="Programa de metas">PdM</abbr>&nbsp;<span
              class="tvermelho"
            >*</span>
          </label>
          <select
            id="pdm_id"
            name="pdm_id"
            class="inputtext light mb1"
            :value="$route.query.pdm_id"
            :class="{
              loading: PdMStore.PdM?.loading
            }"
            :disabled="PdMStore.PdM?.loading"
            @change="($event) => $router.push({
              name: $route.name,
              query: { pdm_id: $event.target.value || undefined }
            })"
          >
            <option
              v-for="item in PdMStore.PdM"
              :key="item.id"
              :value="item.id"
              :selected="item.id == $route.query.pdm_id"
            >
              {{ item.nome }}
            </option>
          </select>
        </div>

        <hr class="ml1 mr1 f1">
      </template>

      <template #pre-lista>
        <TransitionExpand>
          <div
            v-if="exibirMensagemDeSucessoNoEnvio"
            class="mensagem-de-sucesso card-shadow p1 mb2 contentStyle"
          >
            <button
              type="button"
              class="like-a__text block mr0 mlauto"
              aria-label="fechar mensagem"
              @click="exibirMensagemDeSucessoNoEnvio = false"
            >
              <svg
                width="12"
                height="12"
              ><use xlink:href="#i_x" /></svg>
            </button>

            <h2>
              <svg
                width="24"
                height="24"
                color="#F2890D"
                class="ib"
              ><use xlink:href="#i_alert" /></svg>
              O upload do arquivo foi realizado com sucesso.
            </h2>

            <p>
              Para que não haja pendências de entregas em relação ao monitoramento
              orçamentário desse trimestre, é necessário conferir se todas as informações
              foram aceitas e lidas pelo SMAE, conforme orientações abaixo:
            </p>

            <ul>
              <li>
                aguarde o processamento do arquivo para verificar se há informações em
                formato inválido ou mesmo valores informados em discrepância com o SOF.
                Assim que o arquivo for processado verifique na coluna "Status" se todas
                as linhas foram importadas. Caso não, efetue o download e verifique as
                correções necessárias de acordo com as orientações do próprio
                arquivo;
              </li>

              <li>
                após revisar as informações, submeta novamente o arquivo e aguarde o
                processamento, conforme o item anterior. Se o arquivo tiver todas as
                linhas importadas pelo SMAE, não haverá pendências no monitoramento
                orçamentário;
              </li>
            </ul>

            <p>
              Após essa conferência, abra cada meta de seu órgão, verifique os valores
              globais e clique na opção Concluir para enviar os dados à SEPEP/CP.
            </p>

            <p>
              Dúvidas sobre a correção dos arquivos podem ser compartilhadas com a
              equipe do Programa de Metas - <a
                href="mailto:programademetas@prefeitura.sp.gov.br"
              >programademetas@prefeitura.sp.gov.br</a>.
            </p>
          </div>
        </TransitionExpand>
      </template>
    </component>
  </router-view>
</template>
