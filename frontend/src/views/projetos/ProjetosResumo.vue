<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import MapaExibir from '@/components/geo/MapaExibir.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import SmaeTooltip from '@/components/SmaeTooltip/SmaeTooltip.vue';
import { projeto as schema } from '@/consts/formSchemas';
import statuses from '@/consts/projectStatuses';
import combinadorDeListas from '@/helpers/combinadorDeListas.ts';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import subtractDates from '@/helpers/subtractDates';
import truncate from '@/helpers/texto/truncate';
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';

const DotaçãoStore = useDotaçãoStore();
const ÓrgãosStore = useOrgansStore();
const planosSimplificadosStore = usePlanosSimplificadosStore();
const projetosStore = useProjetosStore();

const { FontesDeRecursosPorAnoPorCódigo } = storeToRefs(DotaçãoStore);
const { organs, órgãosPorId } = storeToRefs(ÓrgãosStore);
const { planosPorId } = storeToRefs(planosSimplificadosStore);
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(projetosStore);

const statusesComPlanejamento = ['Validado', 'EmAcompanhamento', 'Fechado', 'Suspenso'];

const informacoesDoProjeto = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  return [
    {
      chave: 'codigo',
      titulo: schema.fields.codigo.spec.label,
      valor: foco.codigo,
    },
    {
      chave: 'status',
      titulo: schema.fields.status.spec.label,
      valor: foco.status,
    },
    {
      chave: 'tags_portfolio',
      titulo: schema.fields.tags_portfolio.spec.label,
      valor: combinadorDeListas(foco.tags_portfolio, ', ', 'descricao'),
    },
    {
      chave: 'resumo',
      titulo: schema.fields.resumo.spec.label,
      valor: foco.resumo,
      larguraBase: '100%',
    },
    {
      chave: 'objeto',
      titulo: schema.fields.objeto.spec.label,
      valor: foco.objeto,
      larguraBase: '100%',
    },
    {
      chave: 'objetivo',
      titulo: schema.fields.objetivo.spec.label,
      valor: foco.objetivo,
      larguraBase: '100%',
    },
    {
      chave: 'publico_alvo',
      titulo: schema.fields.publico_alvo.spec.label,
      valor: foco.publico_alvo,
      larguraBase: '100%',
    },
    {
      chave: 'premissas',
      titulo: schema.fields.premissas.spec.label,
      valor: foco.premissas,
      larguraBase: '100%',
    },
    {
      chave: 'restricoes',
      titulo: schema.fields.restricoes.spec.label,
      valor: foco.restricoes,
      larguraBase: '100%',
    },
    {
      chave: 'principais_etapas',
      titulo: schema.fields.principais_etapas.spec.label,
      valor: foco.principais_etapas,
      larguraBase: '100%',
    },
    {
      chave: 'nao_escopo',
      titulo: schema.fields.nao_escopo.spec.label,
      valor: foco.nao_escopo,
      larguraBase: '100%',
    },
  ];
});

const colunasDeEnderecos = [
  { chave: 'rotulo', label: 'Rótulo' },
  { chave: 'endereco', label: 'Endereço' },
  { chave: 'bairro', label: 'Bairro' },
  { chave: 'subprefeitura', label: 'Subprefeitura' },
  { chave: 'distrito', label: 'Distrito' },
  { chave: 'cep', label: 'CEP' },
];

const dadosDeEnderecos = computed(() => {
  if (!Array.isArray(emFoco.value?.geolocalizacao)) return [];

  return emFoco.value.geolocalizacao.map((item) => ({
    rotulo: item.rotulo || item.endereco_exibicao || '-',
    endereco: item.endereco_exibicao
      || item.endereco?.properties?.string_endereco
      || '-',
    bairro: item.endereco?.properties?.bairro || '-',
    subprefeitura: item.regioes?.nivel_3?.[0]?.descricao || '-',
    distrito: item.regioes?.nivel_4?.[0]?.descricao || '-',
    cep: item.endereco?.properties?.cep || '-',
  }));
});

const mapasAgrupados = computed(() => {
  if (!Array.isArray(emFoco.value?.geolocalizacao)) {
    return {};
  }

  return emFoco.value.geolocalizacao.reduce((acc, cur) => {
    if (!acc?.endereços) {
      acc.endereços = [];
    }

    if (cur.endereco) {
      const enderecoEnriquecido = JSON.parse(JSON.stringify(cur.endereco));

      if (enderecoEnriquecido.properties) {
        enderecoEnriquecido.properties = {
          ...enderecoEnriquecido.properties,
          projeto_nome: emFoco.value?.nome,
          orgao_resp_sigla: emFoco.value?.orgao_responsavel?.sigla,
          projeto_status: emFoco.value?.status,
          projeto_etapa: emFoco.value?.projeto_etapa?.descricao,
          subPrefeitura: cur.regioes?.nivel_3?.[0]?.descricao,
        };
      }

      acc.endereços.push(enderecoEnriquecido);
    }

    if (!acc?.camadas) {
      acc.camadas = [];
    }

    if (Array.isArray(cur.camadas)) {
      acc.camadas = acc.camadas.concat(cur.camadas.filter((c) => c?.id));
    }

    return acc;
  }, {});
});

const colunasDeFontesDeRecursos = [
  { chave: 'fonte_recurso_cod_sof', label: schema.fields.fonte_recursos.innerType.fields.fonte_recurso_cod_sof.spec.label },
  { chave: 'fonte_recurso_detalhamento', label: schema.fields.fonte_recursos.innerType.fields.fonte_recurso_detalhamento_cod.spec.label },
  { chave: 'fonte_recurso_ano', label: schema.fields.fonte_recursos.innerType.fields.fonte_recurso_ano.spec.label },
  { chave: 'valor_nominal', label: schema.fields.fonte_recursos.innerType.fields.valor_nominal.spec.label },
  { chave: 'valor_percentual', label: schema.fields.fonte_recursos.innerType.fields.valor_percentual.spec.label },
];

const dadosDeFontesDeRecursos = computed(() => {
  if (!Array.isArray(emFoco.value?.fonte_recursos)) return [];

  return emFoco.value.fonte_recursos.map((item) => ({
    id: item.id,
    fonte_recurso_cod_sof: item.fonte_recurso_cod_sof,
    fonte_recurso_cod_sof_descricao: FontesDeRecursosPorAnoPorCódigo.value
      ?.[item.fonte_recurso_ano]?.[item.fonte_recurso_cod_sof]?.descricao || '',
    fonte_recurso_detalhamento: item.fonte_recurso_detalhamento_cod
      && item.fonte_recurso_detalhamento_descricao
      ? `${item.fonte_recurso_detalhamento_cod} - ${item.fonte_recurso_detalhamento_descricao}`
      : '-',
    fonte_recurso_ano: item.fonte_recurso_ano,
    valor_nominal: item.valor_nominal != null ? `R$ ${dinheiro(item.valor_nominal)}` : '-',
    valor_percentual: item.valor_percentual != null ? `${dinheiro(item.valor_percentual)}%` : '-',
  }));
});

function formatarCodTitulo(obj, fallback = '-') {
  if (!obj) return fallback;
  if (obj.codigo && obj.titulo) return `${obj.codigo} - ${obj.titulo}`;
  return obj.nome || obj.titulo || String(obj);
}

const origemTipoLista = computed(() => {
  const foco = emFoco.value;
  if (!foco || foco.origem_tipo === 'PdmSistema') return [];

  const titulo = foco.meta_codigo
    ? `Meta ${foco.meta_codigo} do PdM Antigo`
    : 'Fora do PdM';

  return [{
    chave: 'origem_tipo',
    titulo,
    valor: foco.origem_outro,
  }];
});

const colunasDeVinculacao = [
  { chave: 'pdm', label: 'PdM/Plano Setorial' },
  { chave: 'meta', label: 'Meta' },
  { chave: 'iniciativa', label: '' },
  { chave: 'atividade', label: '' },
];

function rotulosDoPlano(pdmId) {
  const plano = pdmId ? planosPorId.value[pdmId] : null;
  return {
    iniciativa: plano?.rotulo_iniciativa || 'Iniciativa',
    atividade: plano?.rotulo_atividade || 'Atividade',
  };
}

const dadosDeVinculacao = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  const linhas = [];

  if (Array.isArray(foco.origens_extra)) {
    foco.origens_extra.forEach((origem) => {
      const rotulos = rotulosDoPlano(origem.pdm?.id);

      linhas.push({
        pdm: origem.pdm?.nome || origem.pdm || '-',
        meta: formatarCodTitulo(origem.meta),
        iniciativa: origem.iniciativa ? formatarCodTitulo(origem.iniciativa) : null,
        iniciativa_rotulo: rotulos.iniciativa,
        atividade: origem.atividade ? formatarCodTitulo(origem.atividade) : null,
        atividade_rotulo: rotulos.atividade,
      });
    });
  }

  if (foco.origem_tipo === 'PdmSistema' && foco.meta_id) {
    const rotulos = rotulosDoPlano(foco.meta?.pdm_id);

    linhas.push({
      pdm: '-',
      meta: foco.meta?.codigo && foco.meta?.titulo
        ? `${foco.meta.codigo} - ${foco.meta.titulo}`
        : String(foco.meta_id),
      iniciativa: foco.iniciativa
        ? formatarCodTitulo(foco.iniciativa)
        : (foco.iniciativa_id || null),
      iniciativa_rotulo: rotulos.iniciativa,
      atividade: foco.atividade
        ? formatarCodTitulo(foco.atividade)
        : (foco.atividade_id || null),
      atividade_rotulo: rotulos.atividade,
    });
  }

  return linhas;
});

const estimativasIniciais = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  const estiloDeColuna = { style: { flex: '0 0 calc(25% - 1.5rem)' } };

  return [
    {
      chave: 'previsao_inicio', titulo: schema.fields.previsao_inicio.spec.label, valor: foco.previsao_inicio, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'previsao_termino', titulo: schema.fields.previsao_termino.spec.label, valor: foco.previsao_termino, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'previsao_custo', titulo: schema.fields.previsao_custo.spec.label, valor: foco.previsao_custo, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'tolerancia_atraso', titulo: schema.fields.tolerancia_atraso.spec.label, valor: foco.tolerancia_atraso, atributosDoItem: estiloDeColuna,
    },
  ];
});

const planejamentoFisicoFinanceiro = computed(() => {
  const foco = emFoco.value;
  if (!foco || !statusesComPlanejamento.includes(foco.status)) return [];

  const crono = foco.tarefa_cronograma;
  if (!crono) return [];

  const estiloDeColuna = { style: { flex: '0 0 calc(25% - 1.5rem)' } };

  return [
    {
      chave: 'inicio_planejado', titulo: 'Início planejado', valor: crono.previsao_inicio, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'termino_planejado', titulo: 'Término planejado', valor: crono.previsao_termino, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'custo_total_planejado', titulo: 'Custo total planejado', valor: crono.previsao_custo, atributosDoItem: estiloDeColuna,
    },
  ];
});

const orgaoGestorLista = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  return [
    {
      chave: 'orgao_gestor_id',
      titulo: schema.fields.orgao_gestor_id.spec.label,
      valor: foco.orgao_gestor ? `${foco.orgao_gestor.sigla} - ${foco.orgao_gestor.descricao}` : null,
    },
    {
      chave: 'secretario_executivo',
      titulo: schema.fields.secretario_executivo.spec.label,
      valor: foco.secretario_executivo,
    },
    {
      chave: 'responsaveis_no_orgao_gestor',
      titulo: schema.fields.responsaveis_no_orgao_gestor.spec.label,
      valor: foco.responsaveis_no_orgao_gestor && Array.isArray(foco.responsaveis_no_orgao_gestor)
        ? foco.responsaveis_no_orgao_gestor.map((x) => x.nome_exibicao || x).join(', ')
        : null,
    },
  ];
});

const orgaoResponsavelLista = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  return [
    {
      chave: 'orgao_responsavel_id',
      titulo: schema.fields.orgao_responsavel_id.spec.label,
      valor: foco.orgao_responsavel ? `${foco.orgao_responsavel.sigla} - ${foco.orgao_responsavel.descricao}` : null,
    },
    {
      chave: 'secretario_responsavel',
      titulo: schema.fields.secretario_responsavel.spec.label,
      valor: foco.secretario_responsavel,
    },
    {
      chave: 'responsavel_id',
      titulo: schema.fields.responsavel_id.spec.label,
      valor: foco.responsavel?.nome_exibicao || foco.responsavel?.id,
    },
  ];
});

const equipeAgrupadaPorÓrgão = computed(() => (Array.isArray(emFoco.value?.equipe)
  ? emFoco.value.equipe.reduce((acc, cur) => {
    if (!acc[`_${cur.orgao_id}`]) {
      acc[`_${cur.orgao_id}`] = { id: cur.orgao_id, pessoas: [] };
    }
    acc[`_${cur.orgao_id}`].pessoas.push(cur.pessoa);

    return acc;
  }, {})
  : {}));

const equipeLista = computed(() => {
  if (!Array.isArray(emFoco.value?.equipe) || !emFoco.value.equipe.length) {
    return [];
  }

  return Object.values(equipeAgrupadaPorÓrgão.value).map((órgão) => ({
    chave: `equipe_${órgão.id}`,
    titulo: órgãosPorId.value[órgão.id]
      ? `${órgãosPorId.value[órgão.id].sigla} - ${órgãosPorId.value[órgão.id].descricao}`
      : String(órgão.id),
    valor: órgão.pessoas?.length
      ? órgão.pessoas.map((p) => p.nome_exibicao).join(', ')
      : '-',
  }));
});

const orgaosParticipantesLista = computed(() => {
  const foco = emFoco.value;
  if (!foco?.orgaos_participantes?.length) return [];

  return [{
    chave: 'orgaos_participantes',
    titulo: schema.fields.orgaos_participantes.spec.label,
    valor: foco.orgaos_participantes
      .map((item) => `${item.sigla} - ${item.descricao}`)
      .join(', '),
  }];
});

const controleDeVersoes = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  return [
    { chave: 'versao', titulo: schema.fields.versao.spec.label, valor: foco.versao },
    { chave: 'data_aprovacao', titulo: schema.fields.data_aprovacao.spec.label, valor: foco.data_aprovacao },
    { chave: 'data_revisao', titulo: schema.fields.data_revisao.spec.label, valor: foco.data_revisao },
  ];
});

const colunasDeEncerramento = [
  { chave: 'indicador', label: '' },
  { chave: 'planejado', label: 'Planejado' },
  { chave: 'realizado', label: 'Realizado' },
  { chave: 'desvio', label: 'Desvio' },
];

const dadosDeEncerramento = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  function desvioData(realizado, planejado) {
    return realizado && planejado
      ? `${subtractDates(realizado, planejado)} dias`
      : '-';
  }

  return [
    {
      indicador: 'Data de início',
      planejado: foco.previsao_inicio ? dateToField(foco.previsao_inicio) : '-',
      realizado: foco.realizado_inicio ? dateToField(foco.realizado_inicio) : '-',
      desvio: desvioData(foco.realizado_inicio, foco.previsao_inicio),
    },
    {
      indicador: 'Data de término',
      planejado: foco.previsao_termino ? dateToField(foco.previsao_termino) : '-',
      realizado: foco.realizado_termino ? dateToField(foco.realizado_termino) : '-',
      desvio: desvioData(foco.realizado_termino, foco.previsao_termino),
    },
    {
      indicador: 'Duração',
      planejado: foco.previsao_duracao ? `${foco.previsao_duracao} dias` : '-',
      realizado: foco.realizado_duracao ? `${foco.realizado_duracao} dias` : '-',
      desvio: foco.realizado_duracao && foco.previsao_duracao
        ? `${foco.realizado_duracao - foco.previsao_duracao} dias`
        : '-',
    },
    {
      indicador: 'Custo',
      planejado: foco.previsao_custo != null ? `R$ ${dinheiro(foco.previsao_custo)}` : '-',
      realizado: foco.realizado_custo != null ? `R$ ${dinheiro(foco.realizado_custo)}` : '-',
      desvio: foco.realizado_custo != null && foco.previsao_custo != null
        ? `R$ ${dinheiro(foco.realizado_custo - foco.previsao_custo)}`
        : '-',
    },
  ];
});

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

if (!Array.isArray(organs.value) || !organs.value.length) {
  ÓrgãosStore.getAll();
}

if (!planosSimplificadosStore.planosSimplificados.length
  && !planosSimplificadosStore.chamadasPendentes.planosSimplificados) {
  planosSimplificadosStore.buscarPlanos();
}
</script>
<template>
  <CabecalhoDePagina>
    <template #titulo>
      {{ emFoco?.nome }}
    </template>
    <template #acoes>
      <MenuDeMudançaDeStatusDeProjeto />
      <SmaeLink
        v-if="
          emFoco?.id
            && (
              !emFoco?.arquivado
              || emFoco?.permissoes?.pode_editar_apenas_responsaveis_pos_planejamento
            )
        "
        :to="{ name: 'projetosEditar', params: { projetoId: emFoco.id } }"
        class="btn big"
      >
        Editar
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <div
    v-if="emFoco"
    class="flex column g2"
  >
    <section>
      <h2>Informações do Projeto</h2>

      <SmaeDescriptionList
        :lista="informacoesDoProjeto"
        layout="grid"
        largura-minima="13rem"
      >
        <template #descricao--status="{ item }">
          {{ statuses[item.valor]?.nome || item.valor || '—' }}
        </template>

        <template #descricao--objeto="{ item }">
          <span v-html="item.valor || '—'" />
        </template>

        <template #descricao--objetivo="{ item }">
          <span v-html="item.valor || '—'" />
        </template>

        <template #descricao--publico_alvo="{ item }">
          <span v-html="item.valor || '—'" />
        </template>

        <template #descricao--premissas="{ item }">
          <ul>
            <li v-if="!item.valor?.length">
              -
            </li>
            <li
              v-for="premissa in item.valor"
              v-else
              :key="premissa.id"
            >
              {{ premissa.premissa }}
            </li>
          </ul>
        </template>

        <template #descricao--restricoes="{ item }">
          <ul>
            <li v-if="!item.valor?.length">
              -
            </li>
            <li
              v-for="restricao in item.valor"
              v-else
              :key="restricao.id"
            >
              {{ restricao.restricao }}
            </li>
          </ul>
        </template>

        <template #descricao--principais_etapas="{ item }">
          <span v-html="item.valor || '—'" />
        </template>

        <template #descricao--nao_escopo="{ item }">
          <span v-html="item.valor || '—'" />
        </template>
      </SmaeDescriptionList>
    </section>

    <section v-if="emFoco?.geolocalizacao?.length" class="borda-inferior">
      <SmaeTable
        titulo="Localização"
        :colunas="colunasDeEnderecos"
        :dados="dadosDeEnderecos"
        :rolagem-horizontal="true"
        class="mb2"
      />

      <MapaExibir
        :geo-json="mapasAgrupados.endereços"
        :camadas="mapasAgrupados.camadas"
        :opcoes-do-poligono="{
          fill: true,
          opacity: 0.5,
        }"
        zoom="16"
      >
        <template #painel-flutuante="dados">
          <p
            v-if="dados.projeto_nome"
            class="painel-flutuante__titulo"
          >
            {{ dados.projeto_nome }}
          </p>

          <dl
            v-if="dados.orgao_resp_sigla
              || dados.subPrefeitura
              || dados.projeto_status
              || dados.projeto_etapa"
          >
            <div v-if="dados.orgao_resp_sigla">
              <dt>Órgão responsável</dt>
              <dd>{{ dados.orgao_resp_sigla }}</dd>
            </div>
            <div v-if="dados.subPrefeitura">
              <dt>Subprefeitura</dt>
              <dd>{{ dados.subPrefeitura }}</dd>
            </div>
            <div v-if="dados.projeto_status">
              <dt>Status</dt>
              <dd>{{ statuses[dados.projeto_status]?.nome || dados.projeto_status }}</dd>
            </div>
            <div v-if="dados.projeto_etapa">
              <dt>Etapa</dt>
              <dd>{{ dados.projeto_etapa }}</dd>
            </div>
          </dl>
        </template>
      </MapaExibir>
    </section>

    <section class="borda-inferior">
      <SmaeTable
        :titulo-para-rolagem-horizontal="schema.fields.fonte_recursos.spec.label"
        :colunas="colunasDeFontesDeRecursos"
        :dados="dadosDeFontesDeRecursos"
        :rolagem-horizontal="true"
      >
        <template #celula:fonte_recurso_cod_sof="{ linha }">
          {{ linha.fonte_recurso_cod_sof }}
          <template v-if="linha.fonte_recurso_cod_sof_descricao">
            - {{ truncate(linha.fonte_recurso_cod_sof_descricao, 36) }}
          </template>
        </template>
      </SmaeTable>
    </section>

    <section class="borda-inferior">
      <h2>Vinculação Estratégica (Programa de Metas e outros)</h2>

      <SmaeTable
        v-if="dadosDeVinculacao.length"
        :colunas="colunasDeVinculacao"
        :dados="dadosDeVinculacao"
        class="mb2"
      >
        <template #celula:iniciativa="{ linha }">
          <template v-if="linha.iniciativa">
            <strong>{{ linha.iniciativa_rotulo }}:</strong>
            {{ linha.iniciativa }}
          </template>
          <template v-else>
            -
          </template>
        </template>

        <template #celula:atividade="{ linha }">
          <template v-if="linha.atividade">
            <strong>{{ linha.atividade_rotulo }}:</strong>
            {{ linha.atividade }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </SmaeTable>

      <SmaeDescriptionList
        v-if="origemTipoLista.length"
        :lista="origemTipoLista"
        layout="grid"
        largura-minima="100%"
      />
    </section>

    <section class="pl1 pr1">
      <h2>Estimativas iniciais pré-planejamento</h2>

      <SmaeDescriptionList
        :lista="estimativasIniciais"
        layout="flex"
      >
        <template #descricao--previsao_inicio="{ item }">
          {{ item.valor ? dateToField(item.valor) : '—' }}
        </template>
        <template #descricao--previsao_termino="{ item }">
          {{ item.valor ? dateToField(item.valor) : '—' }}
        </template>
        <template #descricao--previsao_custo="{ item }">
          {{ item.valor != null ? `R$ ${dinheiro(item.valor)}` : '—' }}
        </template>
      </SmaeDescriptionList>
    </section>

    <section
      v-if="planejamentoFisicoFinanceiro.length"
      class="destaque"
    >
      <h2>Planejamento Físico-financeiro</h2>

      <SmaeDescriptionList
        :lista="planejamentoFisicoFinanceiro"
        layout="flex"
      >
        <template #descricao--inicio_planejado="{ item }">
          {{ item.valor ? dateToField(item.valor) : '—' }}
        </template>
        <template #descricao--termino_planejado="{ item }">
          {{ item.valor ? dateToField(item.valor) : '—' }}
        </template>
        <template #descricao--custo_total_planejado="{ item }">
          {{ item.valor != null ? `R$ ${dinheiro(item.valor)}` : '—' }}
        </template>
      </SmaeDescriptionList>
    </section>

    <section>
      <h2>Órgãos/Partes interessadas</h2>

      <SmaeDescriptionList
        :lista="orgaoGestorLista"
        layout="grid"
        largura-minima="13rem"
      >
        <template #termo--orgao_gestor_id="{ item }">
          {{ item.titulo }}
          <SmaeTooltip :texto="schema.fields.orgao_gestor_id.spec.meta.balaoInformativo" />
        </template>

        <template #termo--secretario_executivo="{ item }">
          {{ item.titulo }}
          <SmaeTooltip :texto="schema.fields.secretario_executivo.spec.meta.balaoInformativo" />
        </template>

        <template #termo--responsaveis_no_orgao_gestor="{ item }">
          {{ item.titulo }}
          <SmaeTooltip
            :texto="schema.fields.responsaveis_no_orgao_gestor.spec.meta.balaoInformativo"
          />
        </template>
      </SmaeDescriptionList>
    </section>

    <section>
      <SmaeDescriptionList
        :lista="orgaoResponsavelLista"
        layout="grid"
        largura-minima="13rem"
      >
        <template #termo--orgao_responsavel_id="{ item }">
          {{ item.titulo }}
          <SmaeTooltip :texto="schema.fields.orgao_responsavel_id.spec.meta.balaoInformativo" />
        </template>

        <template #termo--secretario_responsavel="{ item }">
          {{ item.titulo }}
          <SmaeTooltip :texto="schema.fields.secretario_responsavel.spec.meta.balaoInformativo" />
        </template>

        <template #termo--responsavel_id="{ item }">
          {{ item.titulo }}
          <SmaeTooltip :texto="schema.fields.responsavel_id.spec.meta.balaoInformativo" />
        </template>
      </SmaeDescriptionList>

      <template v-if="equipeLista.length">
        <h3 class="t12 uc w700 mt2 mb1">
          {{ schema.fields.equipe.spec.label }}
          <SmaeTooltip :texto="schema.fields.equipe.spec.meta.balaoInformativo" />
        </h3>

        <SmaeDescriptionList
          :lista="equipeLista"
          layout="grid"
          largura-minima="13rem"
        />
      </template>

      <SmaeDescriptionList
        v-if="orgaosParticipantesLista.length"
        :lista="orgaosParticipantesLista"
        layout="grid"
        largura-minima="100%"
        class="mt2"
      >
        <template #termo--orgaos_participantes="{ item }">
          {{ item.titulo }}
          <SmaeTooltip :texto="schema.fields.orgaos_participantes.spec.meta.balaoInformativo" />
        </template>
      </SmaeDescriptionList>
    </section>

    <section>
      <h2>Controle de versões</h2>

      <SmaeDescriptionList
        :lista="controleDeVersoes"
        layout="grid"
        largura-minima="13rem"
      >
        <template #descricao--data_aprovacao="{ item }">
          {{ item.valor ? dateToField(item.valor) : '—' }}
        </template>
        <template #descricao--data_revisao="{ item }">
          {{ item.valor ? dateToField(item.valor) : '—' }}
        </template>
      </SmaeDescriptionList>
    </section>

    <section v-if="emFoco?.status === 'Fechado'">
      <SmaeTable
        titulo="Encerramento do projeto"
        :colunas="colunasDeEncerramento"
        :dados="dadosDeEncerramento"
      />
    </section>
  </div>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
<style scoped>
.destaque {
  padding: 1.5rem 1rem;
  border-block: 1px solid #ccc;
  background-color: #f9f9f9;
}

</style>
