<script setup>
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { default as SimpleIndicador } from '@/components/metas/SimpleIndicador.vue';
import PlanosMetasRelacionados from '@/components/PlanosMetasRelacionados.vue';
import statusObras from '@/consts/statusObras';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import rolarTelaPara from '@/helpers/rolarTelaPara.ts';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useIniciativasStore } from '@/stores/iniciativas.store';
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import { nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from './helpers/auxiliaresParaFaroisDeAtraso.ts';

defineOptions({
  inheritAttrs: false,
});

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const { meta_id } = route.params;

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}`;

const MetasStore = useMetasStore();
const { activePdm, singleMeta, relacionadosMeta } = storeToRefs(MetasStore);
const IniciativasStore = useIniciativasStore();
const { Iniciativas } = storeToRefs(IniciativasStore);
const EquipesStore = useEquipesStore();

async function iniciar() {
  const promessas = [];

  if (meta_id && singleMeta.value.id != meta_id) {
    promessas.push(MetasStore.getById(meta_id));
    promessas.push(EquipesStore.buscarTudo());
  }
  if (meta_id && !activePdm.value.id) {
    promessas.push(MetasStore.getPdM());
  }
  if (!Iniciativas.value[meta_id]) {
    promessas.push(IniciativasStore.getAll(meta_id));
  }

  if (promessas.length) {
    await Promise.allSettled(promessas);
  }

  if (meta_id && activePdm.value.id) {
    MetasStore.getRelacionados({
      meta_id, pdm_id: activePdm.value.id,
    });
  }

  nextTick().then(() => {
    rolarTelaPara();
  });
}

iniciar();
</script>
<template>
  <div>
    <MigalhasDeMetas class="mb1" />

    <header class="flex spacebetween center mb2">
      <div>
        <div class="t12 uc w700 tamarelo mb1">
          Meta
        </div>

        <TítuloDePágina
          :ícone="activePdm?.logo"
          :class="classeParaFarolDeAtraso(singleMeta?.cronograma?.atraso_grau)"
          :title="textoParaFarolDeAtraso(singleMeta?.cronograma?.atraso_grau)"
          style="padding-right: 4px;"
        >
          {{ singleMeta.codigo }} - {{ singleMeta.titulo }}
        </TítuloDePágina>
      </div>
      <hr class="ml2 f1">
      <SmaeLink
        v-if="temPermissãoPara([
          'CadastroMeta.administrador_no_pdm',
          'CadastroMetaPS.administrador_no_pdm'
        ]) && activePdm?.pode_editar"
        :to="`/metas/editar/${singleMeta.id}`"
        class="btn big ml2"
      >
        Editar
      </SmaeLink>
    </header>

    <div class="boards">
      <template v-if="singleMeta.id">
        <div class="flex g2">
          <div
            v-if="activePdm.possui_macro_tema"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              {{ activePdm.rotulo_macro_tema }}
            </div>
            <div class="t13">
              {{ singleMeta?.macro_tema?.descricao }}
            </div>
          </div>
          <div
            v-if="activePdm.possui_tema"
            class="mr2 f2"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              {{ activePdm.rotulo_tema }}
            </div>
            <div class="t13">
              {{ singleMeta?.tema?.descricao }}
            </div>
          </div>
          <div
            v-if="activePdm.possui_sub_tema"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              {{ activePdm.rotulo_sub_tema }}
            </div>
            <div class="t13">
              {{ singleMeta?.sub_tema?.descricao }}
            </div>
          </div>
        </div>
        <hr class="mt2 mb2">
        <div class="flex g2">
          <div
            v-if="EquipesStore.equipesPorIds(singleMeta.ps_ponto_focal.equipes).length"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Equipes Responsáveis
            </div>
            <div class="t13">
              {{ combinadorDeListas(
                EquipesStore.equipesPorIds(singleMeta.ps_ponto_focal.equipes),
                false,
                'titulo',
              ) }}
            </div>
          </div>
          <div
            v-if="EquipesStore.equipesPorIds(singleMeta.ps_tecnico_cp.equipes).length"
            class="mr2 f1"
          >
            <div class="t12 uc w700 mb05 tamarelo">
              Equipe técnica do administrador do plano
            </div>
            <div class="t13">
              {{ combinadorDeListas(
                EquipesStore.equipesPorIds(singleMeta.ps_tecnico_cp.equipes),
                false,
                'titulo',
              ) }}
            </div>
          </div>
        </div>
        <hr class="mt2 mb2">
        <div v-if="singleMeta?.tags.length">
          <h4>Tags</h4>
          <ul class="flex flexwrap center g2">
            <li
              v-for="tag in singleMeta.tags"
              :key="tag.id"
              class="fb10em"
            >
              <a
                v-if="tag.download_token"
                class="block"
                :href="baseUrl + '/download/' + tag.download_token"
                download
              >
                <img
                  :src="`${baseUrl}/download/${tag.download_token}?inline=true`"
                  width="140"
                  height="140"
                  class="icone-de-tag"
                >
              </a>
              <strong
                v-else
                class="block"
              >
                {{ tag.descricao }}
              </strong>
            </li>
          </ul>
          <hr class="mt2 mb2">
        </div>
        <div
          v-if="activePdm.possui_contexto_meta"
          class="mr2 f2"
        >
          <h4>{{ activePdm.rotulo_contexto_meta }}</h4>
          <div>{{ singleMeta.contexto }}</div>
          <hr class="mt2 mb2">
        </div>
        <div
          v-if="activePdm.possui_complementacao_meta && singleMeta.complemento"
          class=""
        >
          <h4>{{ activePdm.rotulo_complementacao_meta }}</h4>
          <div>{{ singleMeta.complemento }}</div>
          <hr class="mt2 mb2">
        </div>

        <SimpleIndicador
          :parentlink="parentlink"
          :parent_id="meta_id"
          parent_field="meta_id"
        />
        <template v-if="activePdm.possui_iniciativa">
          <div class="flex spacebetween center mt4 mb2">
            <h2 class="mb0">
              {{ activePdm.rotulo_iniciativa }}
            </h2>
            <hr class="ml2 f1">
            <SmaeLink
              v-if="temPermissãoPara([
                'CadastroMeta.administrador_no_pdm',
                'CadastroMetaPS.administrador_no_pdm'
              ])
                && activePdm.possui_iniciativa
                && activePdm?.pode_editar"
              :to="`${parentlink}/iniciativas/novo`"
              class="btn ml2"
            >
              Adicionar {{ activePdm.rotulo_iniciativa }}
            </SmaeLink>
          </div>

          <template
            v-if="Array.isArray(Iniciativas[meta_id])"
          >
            <div
              v-for="ini in Iniciativas[meta_id]"
              :id="`iniciativa__${ini.id}`"
              :key="ini.id"
              class="board_variavel mb2"
            >
              <header class="p1">
                <div class="flex center g2 mb1">
                  <SmaeLink
                    :to="`${parentlink}/iniciativas/${ini.id}`"
                    class="f0"
                    style="flex-basis: 2rem;"
                  >
                    <svg
                      width="28"
                      height="33"
                      viewBox="0 0 32 38"
                      color="#8EC122"
                      xmlns="http://www.w3.org/2000/svg"
                    ><use xlink:href="#i_iniciativa" /></svg>
                  </SmaeLink>
                  <SmaeLink
                    :to="`${parentlink}/iniciativas/${ini.id}`"
                    class="f1 mt1"
                  >
                    <h2 class="mb1">
                      {{ ini.titulo }}
                    </h2>
                  </SmaeLink>
                  <div
                    v-if="temPermissãoPara([
                      'CadastroMeta.administrador_no_pdm',
                      'CadastroMetaPS.administrador_no_pdm'
                    ])"
                    class="f0"
                  >
                    <SmaeLink
                      :to="`${parentlink}/iniciativas/editar/${ini.id}`"
                      class="tprimary"
                    >
                      <svg
                        width="20"
                        height="20"
                      ><use xlink:href="#i_edit" /></svg>
                    </SmaeLink>
                  </div>
                </div>
                <div class="f1 ml2">
                  <div class="flex g2 ml2">
                    <div class="mr1 f0">
                      <div class="t12 uc w700 mb05 tc300">
                        Código
                      </div>
                      <div class="t13">
                        {{ ini.codigo }}
                      </div>
                    </div>
                    <div class="mr1 f1">
                      <div class="t12 uc w700 mb05 tc300">
                        Órgão participante
                      </div>
                      <div class="t13">
                        {{ ini?.orgaos_participantes?.map(x => x.orgao.descricao).join(', ') }}
                      </div>
                    </div>
                    <div class="f1">
                      <div class="t12 uc w700 mb05 tc300">
                        Responsável na coordenadoria de planejamento
                      </div>
                      <div class="t13">
                        {{ ini?.coordenadores_cp?.map(x => x.nome_exibicao).join(', ') }}
                      </div>
                    </div>
                  </div>
                </div>
              </header>
            </div>
          </template>

          <div
            v-if="Iniciativas[meta_id].loading"
            class="board_vazio"
          >
            <div class="tc">
              <div class="p1">
                <span>Carregando</span> <svg
                  class="ml1 ib"
                  width="20"
                  height="20"
                ><use xlink:href="#i_spin" /></svg>
              </div>
            </div>
          </div>
          <ErrorComponent
            v-else-if="Iniciativas[meta_id].error"
            class="board_vazio"
          >
            {{ Iniciativas[meta_id].error }}
          </ErrorComponent>

          <div
            v-if="relacionadosMeta?.projetos?.length"
            class="mt2 mb2"
          >
            <div class="flex spacebetween center mt4 mb2">
              <h2 class="mb0">
                Projetos associados
              </h2>
              <hr class="ml2 f1">
            </div>

            <table class="tablemain">
              <col>
              <col>
              <col>
              <col>
              <thead>
                <th>Portfólio </th>
                <th>Código</th>
                <th> Nome </th>
                <th>Etapa</th>
              </thead>
              <tbody>
                <tr
                  v-for="(projeto, index) in relacionadosMeta.projetos"
                  :key="index"
                >
                  <td>
                    {{ projeto.portfolio?.titulo || '-' }}
                  </td>
                  <td>
                    {{ projeto.codigo || '-' }}
                  </td>
                  <td>
                    {{ projeto.nome || '-' }}
                  </td>
                  <td>
                    {{ projeto.projeto_etapa?.descricao || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="relacionadosMeta?.obras?.length"
            class="mt2 mb2"
          >
            <div class="flex spacebetween center mt4 mb2">
              <h2 class="mb0">
                Obras associadas
              </h2>
              <hr class="ml2 f1">
            </div>
            <table class="tablemain">
              <col>
              <col>
              <col>
              <col>
              <col>
              <col>
              <col>
              <thead>
                <th>
                  Código da obra
                </th>
                <th>Nome</th>
                <th>
                  Tipo obra/intervenção
                </th>
                <th>
                  Subprefeitura
                </th>
                <th>
                  Equipamento
                </th>
                <th>
                  Status
                </th>
                <th>
                  Percentual concluído
                </th>
              </thead>
              <tbody>
                <tr
                  v-for="(obra, index) in relacionadosMeta.obras"
                  :key="index"
                >
                  <td>{{ obra.codigo }}</td>
                  <td>
                    {{ obra.nome }}
                  </td>
                  <td>
                    {{ obra.tipo_intervencao?.nome || '-' }}
                  </td>
                  <td>
                    {{ obra.subprefeituras?.map(x => x.descricao).join(', ') || '-' }}
                  </td>
                  <td>
                    {{ obra.equipamento?.nome || '-' }}
                  </td>
                  <td>
                    {{ statusObras[obra.status]?.nome || '-' }}
                  </td>
                  <td>
                    {{ obra.percentual_concluido || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <PlanosMetasRelacionados :relacionamentos="relacionadosMeta?.metas || []" />
      </template>
      <template v-else-if="singleMeta.loading">
        <div class="p1">
          <span>Carregando</span> <svg
            class="ml1 ib"
            width="20"
            height="20"
          ><use xlink:href="#i_spin" /></svg>
        </div>
      </template>
      <template v-else-if="singleMeta.error">
        <div class="error p1">
          <p class="error-msg">
            Erro: {{ singleMeta.error }}
          </p>
        </div>
      </template>
      <template v-else>
        <div class="error p1">
          <p class="error-msg">
            Nenhum item encontrado.
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
<style lang="less" scoped>
.icone-de-tag {
  max-width: 140px;
  max-height: 140px;
  object-fit: cover;
}
</style>
