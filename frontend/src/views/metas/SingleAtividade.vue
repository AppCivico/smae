<script setup>
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { default as SimpleIndicador } from '@/components/metas/SimpleIndicador.vue';
import PlanosMetasRelacionados from '@/components/PlanosMetasRelacionados.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import { useAtividadesStore } from '@/stores/atividades.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEquipesStore } from '@/stores/equipes.store';
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from './helpers/auxiliaresParaFaroisDeAtraso.ts';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const { meta_id } = route.params;
const { iniciativa_id } = route.params;
const { atividade_id } = route.params;

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
MetasStore.getPdM();

const EquipesStore = useEquipesStore();
EquipesStore.buscarTudo();

const parentlink = `${meta_id ? `/metas/${meta_id}` : ''}${iniciativa_id ? `/iniciativas/${iniciativa_id}` : ''}${atividade_id ? `/atividades/${atividade_id}` : ''}`;

const AtividadesStore = useAtividadesStore();
const {
  singleAtividade,
  órgãosResponsáveisNaAtividadeEmFoco,
  relacionadosAtividade,
} = storeToRefs(AtividadesStore);

async function iniciar() {
  if (singleAtividade.value.id !== atividade_id) {
    await AtividadesStore.getById(iniciativa_id, atividade_id);
  }
  if (route.meta.entidadeMãe === 'pdm') {
    if (singleAtividade.value.id) {
      AtividadesStore.getRelacionados({ atividade_id: singleAtividade.value.id });
    }
  }
}

iniciar();
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo mb1">
        {{ activePdm.rotulo_atividade }}
      </div>

      <TítuloDePágina
        :class="classeParaFarolDeAtraso(singleAtividade?.cronograma?.atraso_grau)"
        :title="textoParaFarolDeAtraso(singleAtividade?.cronograma?.atraso_grau)"
        style="padding-right: 4px;"
        :ícone="activePdm?.logo"
      >
        {{ singleAtividade.codigo }} - {{ singleAtividade.titulo }}
      </TítuloDePágina>
    </div>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm'
      ])"
      :to="`/metas/${meta_id}/iniciativas/${iniciativa_id}/atividades/editar/${atividade_id}`"
      class="btn big ml2"
    >
      Editar
    </SmaeLink>
  </div>
  <div class="boards">
    <template v-if="singleAtividade.id">
      <div class="flex g2">
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Código
          </div>
          <div class="t13">
            {{ singleAtividade.codigo }}
          </div>
        </div>
        <div
          v-if="EquipesStore.equipesPorIds(singleAtividade.ps_ponto_focal.equipes).length"
          class="mr2"
        >
          <div class="t12 uc w700 mb05 tamarelo">
            Equipes responsáveis
          </div>
          <div class="t13">
            {{ combinadorDeListas(
              EquipesStore.equipesPorIds(singleAtividade.ps_ponto_focal.equipes),
              false,
              'titulo',
            ) }}
          </div>
        </div>
        <div
          v-if="EquipesStore.equipesPorIds(singleAtividade.ps_tecnico_cp.equipes).length"
          class="mr2"
        >
          <div class="t12 uc w700 mb05 tamarelo">
            Equipe técnica do administrador do plano
          </div>
          <div class="t13">
            {{ combinadorDeListas(
              EquipesStore.equipesPorIds(singleAtividade.ps_tecnico_cp.equipes),
              false,
              'titulo',
            ) }}
          </div>
        </div>
      </div>

      <div v-if="singleAtividade?.tags.length">
        <hr class="mt2 mb2">
        <h4>Tags</h4>
        <ul class="flex flexwrap center g2">
          <li
            v-for="tag in singleAtividade.tags"
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
      </div>

      <template v-if="singleAtividade.contexto">
        <hr class="mt2 mb2">
        <div>
          <h4>Contexto</h4>
          <div>{{ singleAtividade.contexto }}</div>
        </div>
      </template>

      <template v-if="singleAtividade.complemento">
        <hr class="mt2 mb2">
        <div>
          <h4>
            {{ activePdm.rotulo_complementacao_meta || 'Informações Complementares' }}
          </h4>
          <div>{{ singleAtividade.complemento }}</div>
        </div>
      </template>

      <hr class="mt2 mb2">

      <SimpleIndicador
        :parentlink="parentlink"
        :parent_id="atividade_id"
        parent_field="atividade_id"
      />

      <div
        v-if="relacionadosAtividade?.projetos?.length"
        class="mt2 mb2"
      >
        <h2 class="m2">
          Projetos associados
        </h2>
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
              v-for="(projeto, index) in relacionadosAtividade.projetos"
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
        v-if="relacionadosAtividade?.obras?.length"
        class="mt2 mb2"
      >
        <h2 class="">
          Obras associadas
        </h2>

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
              v-for="(obra, index) in relacionadosAtividade.obras"
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
                {{ obra.status || '-' }}
              </td>
              <td>
                {{ obra.percentual_concluido || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PlanosMetasRelacionados :relacionamentos="relacionadosAtividade?.metas" />
    </template>
    <template v-else-if="singleAtividade.loading">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <template v-else-if="singleAtividade.error">
      <div class="error p1">
        <p class="error-msg">
          Error: {{ singleAtividade.error }}
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
</template>
