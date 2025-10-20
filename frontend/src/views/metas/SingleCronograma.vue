<script setup>
import { storeToRefs } from 'pinia';
import {
  computed,
  watchEffect,
} from 'vue';
import { useRoute } from 'vue-router';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import MarcadorDeMapa from '@/components/geo/MarcadorDeMapa.vue';
import ListaLegendas from '@/components/ListaLegendas.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { gerarSvgMarcador } from '@/helpers/gerarSvgMarcador';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useCronogramasStore } from '@/stores/cronogramas.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useEtapasStore } from '@/stores/etapas.store';
import { useMetasStore } from '@/stores/metas.store';
import AddEditEtapa from '@/views/metas/AddEditEtapa.vue';
import AddEditFase from '@/views/metas/AddEditFase.vue';
import AddEditMonitorar from '@/views/metas/AddEditMonitorar.vue';
import achatarGeoLocalizacao from './helpers/achatarGeoLocalizacao';
import { classeParaFarolDeAtraso, textoParaFarolDeAtraso } from './helpers/auxiliaresParaFaroisDeAtraso.ts';

const props = defineProps(['group', 'recorte']);
const route = useRoute();

const alertStore = useAlertStore();
const authStore = useAuthStore();
const EtapasStore = useEtapasStore();
const { temPermissãoPara } = storeToRefs(authStore);
const CronogramasStore = useCronogramasStore();
const { singleCronograma, singleCronogramaEtapas } = storeToRefs(CronogramasStore);
const editModalStore = useEditModalStore();

const MetasStore = useMetasStore();
const { activePdm, singleMeta } = storeToRefs(MetasStore);

const metaId = computed(() => {
  const id = Number(route.params.meta_id);
  return Number.isNaN(id) ? undefined : id;
});
const iniciativaId = computed(() => {
  const id = Number(route.params.iniciativa_id);
  return Number.isNaN(id) ? undefined : id;
});
const atividadeId = computed(() => {
  const id = Number(route.params.atividade_id);
  return Number.isNaN(id) ? undefined : id;
});

const parentLink = computed(() => {
  let link = '';
  if (metaId?.value) {
    link += `/metas/${metaId?.value}`;
  }

  if (iniciativaId?.value) {
    link += `/iniciativas/${iniciativaId?.value}`;
  }

  if (atividadeId?.value) {
    link += `/atividades/${atividadeId?.value}`;
  }

  return link;
});

const parentVar = computed(() => atividadeId?.value
  ?? iniciativaId?.value
  ?? metaId?.value
  ?? false);

const parentField = computed(() => {
  if (atividadeId?.value) {
    return 'atividade_id';
  }

  if (iniciativaId?.value) {
    return 'iniciativa_id';
  }

  if (metaId?.value) {
    return 'meta_id';
  }

  return false;
});

const parentLabel = computed(() => {
  if (atividadeId?.value) {
    return activePdm.value.rotulo_atividade;
  }

  if (iniciativaId?.value) {
    return activePdm.value.rotulo_iniciativa;
  }

  return 'Meta';
});

const marcadoresDasEtapas = computed(() => (singleCronogramaEtapas.value?.loading
  || !singleCronogramaEtapas.value.length
  ? []
  : achatarGeoLocalizacao(singleCronogramaEtapas.value)
    .map((x) => x.endereco)));

function excluirEtapa(id) {
  alertStore.confirmAction('Deseja mesmo excluir?', async () => {
    const r = await EtapasStore.delete(id);
    if (r) {
      EtapasStore.clear();
      CronogramasStore.clear();
      CronogramasStore.getActiveByParent(parentVar.value, parentField.value);
    }
  }, 'Excluir');
}

watchEffect(() => {
  MetasStore.getPdM();

  CronogramasStore.clearEdit();
  CronogramasStore.getActiveByParent(parentVar.value, parentField.value);

  switch (props.group) {
    case 'etapas':
      editModalStore.modal(AddEditEtapa, props);
      break;
    case 'fase':
    case 'subfase':
      editModalStore.modal(AddEditFase, props);
      break;
    case 'monitorar':
      editModalStore.modal(AddEditMonitorar, props);
      break;

    default:
      editModalStore.$reset();
      break;
  }
});
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo mb1">
        {{ parentLabel }}
      </div>
      <TítuloDePágina
        :class="classeParaFarolDeAtraso(singleCronograma?.atraso_grau)"
        :title="textoParaFarolDeAtraso(singleCronograma?.atraso_grau)"
        style="padding-right: 8px;"
        :ícone="activePdm?.logo"
      >
        Cronograma
      </TítuloDePágina>
    </div>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm',
        'SMAE.GrupoVariavel.participante',
      ])
        && !singleCronograma?.loading
        && singleCronograma?.id
        && singleMeta?.pode_editar"
      :to="`${parentLink}/cronograma/${singleCronograma?.id}`"
      class="btn ml2"
    >
      Editar Cronograma
    </SmaeLink>
    <div
      v-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm',
        'SMAE.GrupoVariavel.participante',
      ])
        && !singleCronograma?.loading
        && singleCronograma?.id
        && singleMeta?.pode_editar"
      class="ml1 dropbtn"
    >
      <span class="btn">Nova etapa</span>
      <ul>
        <li
          v-if="temPermissãoPara([
            'CadastroMeta.administrador_no_pdm',
            'CadastroMetaPS.administrador_no_pdm',
            'CadastroMetaPDM.administrador_no_pdm',
            'SMAE.GrupoVariavel.participante',
          ])"
        >
          <SmaeLink
            :to="`${parentLink}/cronograma/${singleCronograma?.id}/etapas/novo`"
          >
            Etapa da {{ parentLabel }}
          </SmaeLink>
        </li>
        <li
          v-if="temPermissãoPara([
            'CadastroMeta.administrador_no_pdm',
            'CadastroMetaPS.administrador_no_pdm',
            'CadastroMetaPDM.administrador_no_pdm'
          ])
            && activePdm.possui_iniciativa && metaId && !iniciativaId"
        >
          <SmaeLink
            :to="`${parentLink}/cronograma/${singleCronograma?.id}/monitorar/iniciativa`"
          >
            A partir de {{ activePdm.rotulo_iniciativa }}
          </SmaeLink>
        </li>
        <li
          v-if="temPermissãoPara([
            'CadastroMeta.administrador_no_pdm',
            'CadastroMetaPS.administrador_no_pdm',
            'CadastroMetaPDM.administrador_no_pdm'
          ])
            && activePdm.possui_atividade && metaId && !atividadeId"
        >
          <SmaeLink
            :to="`${parentLink}/cronograma/${singleCronograma?.id}/monitorar/atividade`"
          >
            A partir de {{ activePdm.rotulo_atividade }}
          </SmaeLink>
        </li>
      </ul>
    </div>
    <div
      v-else
      class="ml2"
    >
      <button class="btn disabled">
        Nova etapa
      </button>
    </div>
  </div>

  <template v-if="!singleCronograma?.loading && singleCronograma?.id">
    <div class="boards">
      <div class="flex g2">
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Inicio previsto
          </div>
          <div class="t13">
            {{
              singleCronograma.inicio_previsto
                ? singleCronograma.inicio_previsto
                : '--/--/----'
            }}
          </div>
        </div>
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Término previsto
          </div>
          <div class="t13">
            {{
              singleCronograma.termino_previsto
                ? singleCronograma.termino_previsto
                : '--/--/----'
            }}
          </div>
        </div>
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Inicio real
          </div>
          <div class="t13">
            {{ singleCronograma.inicio_real ? singleCronograma.inicio_real : '--/--/----' }}
          </div>
        </div>
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo">
            Término real
          </div>
          <div class="t13">
            {{ singleCronograma.termino_real ? singleCronograma.termino_real : '--/--/----' }}
          </div>
        </div>
        <div class="mr2">
          <div class="t12 uc w700 mb05 tamarelo tr">
            Execução
          </div>
          <div class="t13 tr">
            {{ typeof singleCronograma.percentual_execucao === 'number'
              ? `${singleCronograma.percentual_execucao}%`
              : '-' }}
          </div>
        </div>
      </div>
      <div v-if="singleCronograma.descricao">
        <hr class="mt2 mb2">
        <h4>Descrição</h4>
        <div>{{ singleCronograma.descricao }}</div>
      </div>
      <div v-if="singleCronograma.observacao">
        <hr class="mt2 mb2">
        <h4>Observação</h4>
        <div>{{ singleCronograma.observacao }}</div>
      </div>
      <hr class="mt2 mb2">
    </div>

    <ListaLegendas
      class="mb1"
      titulo=""
      orientacao="horizontal"
      align="right"
      :legendas="[
        { item: 'Concluído', html: gerarSvgMarcador('verde') },
        { item: 'Atraso moderado', html: gerarSvgMarcador('laranja') },
        { item: 'Atraso alto', html: gerarSvgMarcador('vermelho') },
      ]"
    />

    <MapaExibir
      v-if="marcadoresDasEtapas.length"
      :geo-json="marcadoresDasEtapas"
      class="mb2"
      zoom="16"
    />

    <hr class="mb2">

    <div
      v-if="!singleCronogramaEtapas?.loading && singleCronogramaEtapas.length"
      class="etapas"
    >
      <ListaLegendas
        titulo=""
        orientacao="horizontal"
        align="right"
        :legendas="[
          {
            item: 'Endereço preenchido',
            html: gerarSvgMarcador('padrao', { variante: 'sem-contorno' })
          },
          {
            item: 'Endereço obrigatório não preenchido',
            html: gerarSvgMarcador('laranja', { variante: 'so-contorno' })
          },
          {
            item: 'Endereço obrigatório preenchido',
            html: gerarSvgMarcador('laranja', { variante: 'com-contorno' })
          },
        ]"
      />

      <div
        v-for="(r, index) in singleCronogramaEtapas?.filter(x => !x.inativo)"
        :key="r.etapa.id"
        class="etapa"
      >
        <div class="status">
          <span
            :class="classeParaFarolDeAtraso(r.etapa.atraso_grau)"
            :title="textoParaFarolDeAtraso(r.etapa.atraso_grau)"
          >{{ index + 1 }}</span>
        </div>
        <div class="title mb1">
          <h3>{{ r.etapa.titulo }}</h3>
        </div>
        <div class="pl3 flex center mb05 tc300 w700 t12 uc">
          <div class="f1">
            Início Prev.
          </div>
          <div class="ml1 f1">
            Término Prev.
          </div>
          <div class="ml1 f1">
            Duração
          </div>
          <div class="ml1 f1">
            Início Real
          </div>
          <div class="ml1 f1">
            Término Real
          </div>
          <div class="ml1 f1 tr">
            Execução
          </div>
          <div class="ml1 f1">
            Atraso
          </div>
          <div class="ml1 f0" />
          <div
            class="ml1 f0"
            style="flex-basis:20px;"
          />
        </div>
        <hr>

        <div class="pl3 flex center t13">
          <div class="f1">
            {{ r.etapa.inicio_previsto }}
          </div>
          <div class="ml1 f1">
            {{ r.etapa.termino_previsto }}
          </div>
          <div class="ml1 f1">
            {{ r.etapa.duracao ?? '-' }}
          </div>
          <div class="ml1 f1">
            {{ r.etapa.inicio_real }}
          </div>
          <div class="ml1 f1">
            {{ r.etapa.termino_real }}
          </div>
          <div class="ml1 f1 tr">
            {{ typeof r.etapa.percentual_execucao === 'number'
              ? `${r.etapa.percentual_execucao}%`
              : '-' }}
          </div>
          <div class="ml1 f1">
            {{ r.etapa.atraso ? r.etapa.atraso + ' dias' : '-' }}
          </div>
          <div class="ml1 f0">
            <pre v-scrollLockDebug>
                endereco obrigatório: {{ !!r?.etapa?.endereco_obrigatorio }}
                geolocalizações: {{ r?.etapa?.geolocalizacao?.length || 0 }}
              </pre>

            <span
              v-if="r?.etapa?.variavel"
              class="tipinfo left"
            >
              <svg
                width="24"
                height="24"
              ><use xlink:href="#i_variavel" /></svg>
              <div>
                Vinculada à variável
                <strong v-if="r.etapa?.variavel?.codigo">
                  {{ r.etapa.variavel.codigo }}
                </strong>
                {{ r.etapa.variavel?.titulo }}
              </div>
            </span>

            <span
              v-if="r?.etapa?.endereco_obrigatorio && !r?.etapa?.geolocalizacao?.length"
              class="tipinfo left"
            >
              <MarcadorDeMapa
                cor="laranja"
                variante="so-contorno"
              />
              <div>Endereço obrigatório não preenchido</div>
            </span>
            <span
              v-else-if="r?.etapa?.endereco_obrigatorio"
              class="tipinfo left"
            >
              <MarcadorDeMapa
                cor="laranja"
                variante="com-contorno"
              />
              <div>Endereço obrigatório preenchido</div>
            </span>
            <span
              v-else-if="r?.etapa?.geolocalizacao?.length"
              class="tipinfo left"
            >
              <MarcadorDeMapa
                cor="padrao"
                variante="sem-contorno"
              />
              <div>Endereço preenchido</div>
            </span>
          </div>
          <div
            class="ml1 f0"
            style="flex-basis:20px; height: calc(20px + 1rem);"
          >
            <div
              v-if="temPermissãoPara([
                'CadastroMeta.administrador_no_pdm',
                'CadastroMetaPS.administrador_no_pdm',
                'CadastroMetaPDM.administrador_no_pdm',
                'SMAE.GrupoVariavel.participante',
              ])
                && singleMeta?.pode_editar || r.pode_editar_realizado"
              class="dropbtn right"
            >
              <span class=""><svg
                width="20"
                height="20"
              ><use xlink:href="#i_more" /></svg></span>
              <ul>
                <li>
                  <SmaeLink
                    v-if="!r.cronograma_origem_etapa
                      || r.cronograma_origem_etapa.id == singleCronograma?.id"
                    :to="`${parentLink}/cronograma/${singleCronograma?.id}/etapas/${r.etapa.id}`"
                  >
                    Editar Etapa
                  </SmaeLink>
                </li>
                <li>
                  <SmaeLink
                    v-if="r.cronograma_origem_etapa
                      && r.cronograma_origem_etapa?.id != singleCronograma?.id"
                    :to="`${parentLink}/cronograma/${singleCronograma?.id}/monitorar/${r.etapa.id}`"
                  >
                    Editar Monitoramento
                  </SmaeLink>
                </li>

                <li
                  v-if="!r.cronograma_origem_etapa
                    || r.cronograma_origem_etapa.id == singleCronograma?.id"
                >
                  <button
                    class="like-a__link"
                    type="button"
                    :disabled="r.etapa?.etapa_filha?.length"
                    @click="excluirEtapa(r.etapa_id)"
                  >
                    Excluir Etapa
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr class="mb05">
        <div
          v-if="r.cronograma_origem_etapa
            && r.cronograma_origem_etapa?.id != singleCronograma?.id"
          class="pl3 flex center t11 w700 tc600"
        >
          <SmaeLink
            v-if="r.cronograma_origem_etapa.atividade"
            :to="`/metas/${r.cronograma_origem_etapa.atividade.iniciativa.meta.id}/iniciativas/${r.cronograma_origem_etapa.atividade.iniciativa.id}/atividades/${r.cronograma_origem_etapa.atividade.id}/cronograma`"
          >
            <svg
              class="mr1"
              width="12"
              height="14"
              viewBox="0 0 12 14"
              xmlns="http://www.w3.org/2000/svg"
            ><use xlink:href="#i_atividade" /></svg>
            <span>Etapa via atividade {{ r.cronograma_origem_etapa.atividade.codigo }} {{ r.cronograma_origem_etapa.atividade.titulo }}</span>
          </SmaeLink>
          <SmaeLink
            v-else-if="r.cronograma_origem_etapa.iniciativa"
            :to="`/metas/${r.cronograma_origem_etapa.iniciativa.meta.id}/iniciativas/${r.cronograma_origem_etapa.iniciativa.id}/cronograma`"
          >
            <svg
              class="mr1"
              width="12"
              height="14"
              viewBox="0 0 12 14"
              xmlns="http://www.w3.org/2000/svg"
            ><use xlink:href="#i_iniciativa" /></svg>
            <span>
              Etapa via iniciativa
              {{ r.cronograma_origem_etapa.iniciativa.codigo }}
              {{ r.cronograma_origem_etapa.iniciativa.titulo }}
            </span>
          </SmaeLink>
        </div>

        <div
          v-for="(rr, rrindex) in r.etapa.etapa_filha"
          :key="rr.id"
          class="etapa sub"
        >
          <div class="status">
            <span
              :class="classeParaFarolDeAtraso(rr.atraso_grau)"
              :title="textoParaFarolDeAtraso(rr.atraso_grau)"
            >
              <small class="niveis-pais">{{ index + 1 }}.</small>{{ rrindex + 1 }}
            </span>
          </div>
          <div class="title">
            <h4>{{ rr.titulo }}</h4>
          </div>
          <div class="pl3 flex center mb05 tc300 w700 t12 uc">
            <div class="f1">
              Início Prev.
            </div>
            <div class="ml1 f1">
              Término Prev.
            </div>
            <div class="ml1 f1">
              Duração
            </div>
            <div class="ml1 f1">
              Início Real
            </div>
            <div class="ml1 f1">
              Término Real
            </div>
            <div class="ml1 f1 tr">
              Execução
            </div>
            <div class="ml1 f1">
              Atraso
            </div>
            <div class="ml1 f0" />
            <div
              v-if="temPermissãoPara([
                'CadastroMeta.administrador_no_pdm',
                'CadastroMetaPS.administrador_no_pdm',
                'CadastroMetaPDM.administrador_no_pdm',
                'SMAE.GrupoVariavel.participante',
              ])
                && singleMeta?.pode_editar"
              class="ml1 f0"
              style="flex-basis:20px;"
            />
            <div
              v-if="temPermissãoPara([
                'CadastroMeta.administrador_no_pdm',
                'CadastroMetaPS.administrador_no_pdm',
                'CadastroMetaPDM.administrador_no_pdm',
                'SMAE.GrupoVariavel.participante',
              ])
                && singleMeta?.pode_editar"
              class="ml1 f0"
              style="flex-basis:20px;"
            />
          </div>
          <hr>
          <div class="pl3 flex center t13">
            <div class="f1">
              {{ rr.inicio_previsto }}
            </div>
            <div class="ml1 f1">
              {{ rr.termino_previsto }}
            </div>
            <div class="ml1 f1">
              {{ rr.duracao ?? '-' }}
            </div>
            <div class="ml1 f1">
              {{ rr.inicio_real }}
            </div>
            <div class="ml1 f1">
              {{ rr.termino_real }}
            </div>
            <div class="ml1 f1 tr">
              {{ typeof rr.percentual_execucao === 'number'
                ? `${rr.percentual_execucao}%`
                : '-' }}
            </div>
            <div class="ml1 f1">
              {{ rr.atraso ? rr.atraso + ' dias' : '-' }}
            </div>
            <div class="ml1 f0">
              <pre v-scrollLockDebug>
                  endereco obrigatório: {{ !!rr?.endereco_obrigatorio }}
                  geolocalizações: {{ rr?.geolocalizacao?.length || 0 }}
                </pre>

              <span
                v-if="rr?.variavel"
                class="tipinfo left"
              >
                <svg
                  width="24"
                  height="24"
                ><use xlink:href="#i_variavel" /></svg>
                <div>
                  Vínculada à variável
                  <strong v-if="rr.variavel?.codigo">
                    {{ rr.variavel.codigo }}
                  </strong>
                  {{ rr.variavel?.titulo }}
                </div>
              </span>

              <span
                v-if="rr?.endereco_obrigatorio && !rr?.geolocalizacao?.length"
                class="tipinfo left"
              >
                <MarcadorDeMapa
                  cor="laranja"
                  variante="so-contorno"
                />
                <div>Endereço obrigatório não preenchido</div>
              </span>
              <span
                v-else-if="rr?.endereco_obrigatorio"
                class="tipinfo left"
              >
                <MarcadorDeMapa
                  cor="laranja"
                  variante="com-contorno"
                />
                <div>Endereço obrigatório preenchido</div>
              </span>
              <span
                v-else-if="rr?.geolocalizacao?.length"
                class="tipinfo left"
              >
                <MarcadorDeMapa
                  cor="padrao"
                  variante="sem-contorno"
                />
                <div>Endereço preenchido</div>
              </span>
            </div>
            <div
              v-if="temPermissãoPara([
                'CadastroMeta.administrador_no_pdm',
                'CadastroMetaPS.administrador_no_pdm',
                'CadastroMetaPDM.administrador_no_pdm',
                'SMAE.GrupoVariavel.participante',
              ])
                && singleMeta?.pode_editar || rr.pode_editar_realizado"
              class="ml1 f0 flex center mr05"
              style="flex-basis:20px; height: calc(20px + 1rem);"
            >
              <button
                v-if="!rr.cronograma_origem_etapa
                  || rr.cronograma_origem_etapa.id == singleCronograma?.id"
                type="button"
                class="like-a__text"
                title="Excluir Fase"
                :disabled="rr.etapa_filha?.length"
                @click="excluirEtapa(rr.etapa_id)"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_remove" /></svg>
              </button>
            </div>

            <div
              v-if="temPermissãoPara([
                'CadastroMeta.administrador_no_pdm',
                'CadastroMetaPS.administrador_no_pdm',
                'CadastroMetaPDM.administrador_no_pdm',
                'SMAE.GrupoVariavel.participante',
              ])
                && singleMeta?.pode_editar || rr.pode_editar_realizado"
              class="ml1 f0 flex center mr05"
              style="flex-basis:20px; height: calc(20px + 1rem);"
            >
              <SmaeLink
                v-if="!r.cronograma_origem_etapa
                  || r.cronograma_origem_etapa.id == singleCronograma?.id"
                :to="{
                  name: '.faseCronograma.editar',
                  params: {
                    cronograma_id: singleCronograma.id,
                    etapa_id: r.etapa.id,
                    fase_id: rr.id,
                  }
                }"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </SmaeLink>
            </div>
          </div>

          <hr class="mb3">

          <div
            v-if="rr?.etapa_filha?.length"
            class="list mt2"
          >
            <div class="pl3 flex center mb05 tc300 w700 t12 uc ">
              <div class="f2">
                SUBFASE
              </div>
              <div class="ml1 f1">
                início prev.
              </div>
              <div class="ml1 f1">
                Término Prev.
              </div>
              <div class="ml1 f1">
                Duração
              </div>
              <div class="ml1 f1">
                Início Real
              </div>
              <div class="ml1 f1">
                Término Real
              </div>
              <div class="ml1 f1 tr">
                Execução
              </div>
              <div class="ml1 f1">
                Atraso
              </div>
              <div class="ml1 f0" />
              <div
                v-if="temPermissãoPara([
                  'CadastroMeta.administrador_no_pdm',
                  'CadastroMetaPS.administrador_no_pdm',
                  'CadastroMetaPDM.administrador_no_pdm',
                  'SMAE.GrupoVariavel.participante',
                ])
                  && singleMeta?.pode_editar"
                class="ml1 f0"
                style="flex-basis:20px;"
              />
              <div
                v-if="temPermissãoPara([
                  'CadastroMeta.administrador_no_pdm',
                  'CadastroMetaPS.administrador_no_pdm',
                  'CadastroMetaPDM.administrador_no_pdm',
                  'SMAE.GrupoVariavel.participante',
                ])
                  && singleMeta?.pode_editar"
                class="ml1 f0"
                style="flex-basis:20px;"
              />
            </div>
            <hr>
            <template
              v-for="(rrr, rrrindex) in rr.etapa_filha"
              :key="rrr.id"
            >
              <div class="pl3 flex center t13">
                <div class="f2 flex center">
                  <span
                    class="farol f0"
                    :class="classeParaFarolDeAtraso(rrr.atraso_grau)"
                    :title="textoParaFarolDeAtraso(rrr.atraso_grau)"
                  >
                    <small class="niveis-pais">{{ index + 1 }}.{{ rrindex + 1 }}.</small>{{ rrrindex + 1 }}
                  </span>
                  <span>{{ rrr.titulo }}</span>
                </div>
                <div class="ml1 f1">
                  {{ rrr.inicio_previsto }}
                </div>
                <div class="ml1 f1">
                  {{ rrr.termino_previsto }}
                </div>
                <div class="ml1 f1">
                  {{ rrr.duracao ?? '-' }}
                </div>
                <div class="ml1 f1">
                  {{ rrr.inicio_real }}
                </div>
                <div class="ml1 f1">
                  {{ rrr.termino_real }}
                </div>
                <div class="ml1 f1 tr">
                  {{ typeof rrr.percentual_execucao === 'number'
                    ? `${rrr.percentual_execucao}%`
                    : '-' }}
                </div>
                <div class="ml1 f1">
                  {{ rrr.atraso ? rrr.atraso + ' dias' : '-' }}
                </div>
                <div class="ml1 f0">
                  <pre v-scrollLockDebug>
                      endereco obrigatório: {{ !!rrr?.endereco_obrigatorio }}
                      geolocalizações: {{ rrr?.geolocalizacao?.length || 0 }}
                    </pre>

                  <span
                    v-if="rrr?.variavel"
                    class="tipinfo left"
                  >
                    <svg
                      width="24"
                      height="24"
                    ><use xlink:href="#i_variavel" /></svg>
                    <div>
                      Vínculada à variável
                      <strong v-if="rrr.variavel?.codigo">
                        {{ rrr.variavel.codigo }}
                      </strong>
                      {{ rrr.variavel?.titulo }}
                    </div>
                  </span>

                  <span
                    v-if="rrr?.endereco_obrigatorio && !rrr?.geolocalizacao?.length"
                    class="tipinfo left"
                  >
                    <MarcadorDeMapa
                      cor="laranja"
                      variante="so-contorno"
                    />
                    <div>Endereço obrigatório não preenchido</div>
                  </span>
                  <span
                    v-else-if="rrr?.endereco_obrigatorio"
                    class="tipinfo left"
                  >
                    <MarcadorDeMapa
                      cor="laranja"
                      variante="com-contorno"
                    />
                    <div>Endereço obrigatório preenchido</div>
                  </span>
                  <span
                    v-else-if="rrr?.geolocalizacao?.length"
                    class="tipinfo left"
                  >
                    <MarcadorDeMapa
                      cor="padrao"
                      variante="sem-contorno"
                    />
                    <div>Endereço preenchido</div>
                  </span>
                </div>
                <div
                  v-if="temPermissãoPara([
                    'CadastroMeta.administrador_no_pdm',
                    'CadastroMetaPS.administrador_no_pdm',
                    'CadastroMetaPDM.administrador_no_pdm',
                    'SMAE.GrupoVariavel.participante',
                  ])
                    && singleMeta?.pode_editar || rrr.pode_editar_realizado"
                  class="ml1 f0 flex center mr05"
                >
                  <button
                    v-if="!rrr.cronograma_origem_etapa
                      || rrr.cronograma_origem_etapa.id == singleCronograma?.id"
                    type="button"
                    class="like-a__text"
                    title="Excluir Subfase"
                    :disabled="rrr.etapa_filha?.length"
                    @click="excluirEtapa(rrr.etapa_id)"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_remove" /></svg>
                  </button>
                </div>

                <div
                  v-if="temPermissãoPara([
                    'CadastroMeta.administrador_no_pdm',
                    'CadastroMetaPS.administrador_no_pdm',
                    'CadastroMetaPDM.administrador_no_pdm',
                    'SMAE.GrupoVariavel.participante',
                  ])
                    && singleMeta?.pode_editar || rrr.pode_editar_realizado"
                  class="ml1 f0 flex center mr05"
                  style="flex-basis:20px; height: calc(20px + 1rem);"
                >
                  <SmaeLink
                    v-if="
                      !r.cronograma_origem_etapa
                        || r.cronograma_origem_etapa.id == singleCronograma?.id
                    "
                    :to="{
                      name: '.subfaseCronograma.editar',
                      params: {
                        cronograma_id: singleCronograma.id,
                        etapa_id: r.etapa.id,
                        fase_id: rr.id,
                        subfase_id: rrr.id
                      }
                    }"
                  >
                    <svg
                      width="20"
                      height="20"
                    ><use xlink:href="#i_edit" /></svg>
                  </SmaeLink>
                </div>
              </div>
              <hr>
            </template>
          </div>
          <div
            v-if="temPermissãoPara([
              'CadastroMeta.administrador_no_pdm',
              'CadastroMetaPS.administrador_no_pdm',
              'CadastroMetaPDM.administrador_no_pdm',
              'SMAE.GrupoVariavel.participante',
            ])
              && singleMeta?.pode_editar"
            class="pl3"
          >
            <SmaeLink
              v-if="!r.cronograma_origem_etapa
                || r.cronograma_origem_etapa.id == singleCronograma?.id"
              :to="{
                name: '.subfaseCronograma.novo',
                params: {
                  cronograma_id: singleCronograma.id,
                  etapa_id: r.etapa.id,
                  fase_id: rr.id,
                }
              }"

              class="addlink mt05 mb05"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_+" /></svg> <span>Adicionar Subfase</span>
            </SmaeLink>
          </div>
          <hr class="mb1">
        </div>
        <div
          v-if="temPermissãoPara([
            'CadastroMeta.administrador_no_pdm',
            'CadastroMetaPS.administrador_no_pdm',
            'CadastroMetaPDM.administrador_no_pdm',
            'SMAE.GrupoVariavel.participante',
          ])
            && singleMeta?.pode_editar"
          class="pl1"
        >
          <SmaeLink
            v-if="!r.cronograma_origem_etapa
              || r.cronograma_origem_etapa.id == singleCronograma?.id"
            :to="{
              name: '.faseCronograma.novo',
              params: {
                cronograma_id: singleCronograma.id,
                etapa_id: r.etapa.id,
              }
            }"
            class="addlink"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg> <span>Adicionar Fase</span>
          </SmaeLink>
        </div>
      </div>
    </div>
    <template v-else-if="singleCronogramaEtapas?.loading">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <div
      v-else-if="temPermissãoPara([
        'CadastroMeta.administrador_no_pdm',
        'CadastroMetaPS.administrador_no_pdm',
        'CadastroMetaPDM.administrador_no_pdm',
        'SMAE.GrupoVariavel.participante',
      ])
        && singleMeta?.pode_editar"
      class="p1 bgc50"
    >
      <div class="tc">
        <SmaeLink
          :to="`${parentLink}/cronograma/${singleCronograma?.id}/etapas/novo`"
          class="btn mt1 mb1"
        >
          <span>Adicionar Etapa</span>
        </SmaeLink>
      </div>
    </div>
  </template>
  <template v-else-if="singleCronograma?.loading">
    <div class="p1">
      <span>Carregando</span> <svg
        class="ml1 ib"
        width="20"
        height="20"
      ><use xlink:href="#i_spin" /></svg>
    </div>
  </template>
  <div
    v-else-if="temPermissãoPara([
      'CadastroMeta.administrador_no_pdm',
      'CadastroMetaPS.administrador_no_pdm',
      'CadastroMetaPDM.administrador_no_pdm',
      'SMAE.GrupoVariavel.participante',
    ])
      && singleMeta?.pode_editar"
    class="p1 bgc50 mb2"
  >
    <div class="tc">
      <SmaeLink
        :to="`${parentLink}/cronograma/novo`"
        class="btn mt1 mb1"
      >
        <span>Adicionar Cronograma</span>
      </SmaeLink>
    </div>
  </div>
</template>
