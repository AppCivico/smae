<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import MapaExibir from '@/components/geo/MapaExibir.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { obra as schema } from '@/consts/formSchemas';
import statusesObras from '@/consts/statusObras';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import dateToField from '@/helpers/dateToField';
import dinheiro from '@/helpers/dinheiro';
import subtractDates from '@/helpers/subtractDates';
import { useObrasStore } from '@/stores/obras.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store.ts';

const ÓrgãosStore = useOrgansStore();
const obrasStore = useObrasStore();
const planosSimplificadosStore = usePlanosSimplificadosStore();

const { planosPorId } = storeToRefs(planosSimplificadosStore);

if (!planosSimplificadosStore.planosSimplificados.length
  && !planosSimplificadosStore.chamadasPendentes.planosSimplificados) {
  planosSimplificadosStore.buscarPlanos();
}

const { organs, órgãosPorId } = storeToRefs(ÓrgãosStore);
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(obrasStore);

const equipeAgrupadaPorÓrgão = computed(() => (Array.isArray(emFoco.value?.equipe)
  ? emFoco.value.equipe.reduce((acc, cur) => {
    if (!acc[`_${cur.orgao_id}`]) {
      acc[`_${cur.orgao_id}`] = { id: cur.orgao_id, pessoas: [] };
    }
    acc[`_${cur.orgao_id}`].pessoas.push(cur.pessoa);

    return acc;
  }, {})
  : {}));

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
          obra_nome: emFoco.value?.nome,
          orgao_resp_sigla: emFoco.value?.orgao_responsavel?.sigla,
          obra_status: emFoco.value?.status,
          obra_etapa: emFoco.value?.projeto_etapa?.descricao,
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
    rotulo: item.rotulo || '-',
    endereco: item.endereco_exibicao
      || item.endereco?.properties?.string_endereco
      || '-',
    bairro: item.endereco?.properties?.bairro || '-',
    subprefeitura: item.regioes?.nivel_3?.[0]?.descricao || '-',
    distrito: item.regioes?.nivel_4?.[0]?.descricao || '-',
    cep: item.endereco?.properties?.cep || '-',
  }));
});

const exibeBlocoHabitacional = computed(() => {
  const foco = emFoco.value;
  return foco?.mdo_n_familias_beneficiadas
      || foco?.mdo_n_unidades_habitacionais
      || foco?.mdo_n_unidades_atendidas
      || foco?.programa?.nome
      || foco?.programa;
});

const colaboradoresPorGrupo = computed(() => {
  if (emFoco.value?.colaboradores_no_orgao.length === 0) {
    return null;
  }

  const grupos = emFoco.value?.colaboradores_no_orgao.reduce((amount, item) => {
    const { orgao, ...colaborador } = item;

    if (!amount[item.orgao.sigla]) {
      amount[item.orgao.sigla] = {
        ...item.orgao,
        colaboradores: [],
      };
    }

    amount[item.orgao.sigla].colaboradores.push(colaborador);

    return amount;
  }, {});

  return grupos;
});

const informacoesDaObra = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  const itens = [
    { chave: 'codigo', titulo: schema.fields.codigo.spec.label, valor: foco.codigo },
    { chave: 'status', titulo: schema.fields.status.spec.label, valor: foco.status },
    { chave: 'tags', titulo: schema.fields.tags.spec.label, valor: foco.tags },
    { chave: 'grupo_tematico', titulo: schema.fields.grupo_tematico.spec.label, valor: foco.grupo_tematico?.nome },
    { chave: 'tipo_intervencao', titulo: schema.fields.tipo_intervencao.spec.label, valor: foco.tipo_intervencao?.nome },
    { chave: 'equipamento', titulo: schema.fields.equipamento.spec.label, valor: foco.equipamento?.nome },
    { chave: 'empreendimento', titulo: schema.fields.empreendimento.spec.label, valor: foco.empreendimento?.identificador },
    { chave: 'orgao_origem', titulo: schema.fields.orgao_origem_id.spec.label, valor: foco.orgao_origem ? `${foco.orgao_origem.sigla} - ${foco.orgao_origem.descricao}` : null },
    { chave: 'orgao_executor', titulo: schema.fields.orgao_executor_id.spec.label, valor: foco.orgao_executor ? `${foco.orgao_executor.sigla} - ${foco.orgao_executor.descricao}` : null },
    { chave: 'projeto_etapa', titulo: schema.fields.projeto_etapa.spec.label, valor: foco.projeto_etapa?.descricao },
    {
      chave: 'mdo_detalhamento',
      titulo: schema.fields.mdo_detalhamento.spec.label,
      valor: foco.mdo_detalhamento,
      larguraBase: '100%',
    },
    {
      chave: 'mdo_observacoes',
      titulo: schema.fields.mdo_observacoes.spec.label,
      valor: foco.mdo_observacoes,
      larguraBase: '100%',
    },
  ];

  return itens;
});

const informacoesHabitacional = computed(() => {
  const foco = emFoco.value;
  if (!foco || !exibeBlocoHabitacional.value) return [];

  return [
    { chave: 'mdo_n_familias_beneficiadas', titulo: schema.fields.mdo_n_familias_beneficiadas.spec.label, valor: foco.mdo_n_familias_beneficiadas },
    { chave: 'mdo_n_unidades_habitacionais', titulo: schema.fields.mdo_n_unidades_habitacionais.spec.label, valor: foco.mdo_n_unidades_habitacionais },
    { chave: 'mdo_n_unidades_atendidas', titulo: schema.fields.mdo_n_unidades_atendidas.spec.label, valor: foco.mdo_n_unidades_atendidas },
    { chave: 'programa', titulo: schema.fields.programa_id.spec.label, valor: foco.programa?.nome || foco.programa },
  ];
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

function formatarCodTitulo(obj, fallback = '-') {
  if (!obj) return fallback;
  if (obj.codigo && obj.titulo) return `${obj.codigo} - ${obj.titulo}`;
  return obj.nome || obj.titulo || String(obj);
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

  if (foco.origem_tipo === 'PdmSistema') {
    if (foco.meta_id) {
      const rotulos = rotulosDoPlano(foco.meta?.pdm_id);

      linhas.push({
        pdm: planosPorId.value[foco.meta?.pdm_id]?.nome || '-',
        meta: foco.meta?.codigo && foco.meta?.titulo
          ? `${foco.meta.codigo} - ${foco.meta.titulo}`
          : String(foco.meta_id),
        iniciativa: foco.iniciativa
          ? formatarCodTitulo(foco.iniciativa)
          : null,
        iniciativa_rotulo: rotulos.iniciativa,
        atividade: foco.atividade
          ? formatarCodTitulo(foco.atividade)
          : null,
        atividade_rotulo: rotulos.atividade,
      });
    }
  }

  return linhas;
});

const estimativasIniciais = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  const estiloDeColuna = { style: { flex: '0 0 calc(20% - 1.6rem)' } };

  return [
    {
      chave: 'previsao_inicio', titulo: schema.fields.previsao_inicio.spec.label, valor: foco.previsao_inicio, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'previsao_termino', titulo: schema.fields.previsao_termino.spec.label, valor: foco.previsao_termino, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'mdo_previsao_inauguracao', titulo: schema.fields.mdo_previsao_inauguracao.spec.label, valor: foco.mdo_previsao_inauguracao, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'tolerancia_atraso', titulo: schema.fields.tolerancia_atraso.spec.label, valor: foco.tolerancia_atraso, atributosDoItem: estiloDeColuna,
    },
    {
      chave: 'previsao_custo', titulo: schema.fields.previsao_custo.spec.label, valor: foco.previsao_custo, atributosDoItem: estiloDeColuna,
    },
  ];
});

const planejamentoFisicoFinanceiro = computed(() => {
  const foco = emFoco.value;
  if (!foco || foco.status === 'MDO_NaoIniciada') return [];

  const crono = foco.tarefa_cronograma;
  if (!crono) return [];

  const estiloDeColuna = { style: { flex: '0 0 calc(20% - 1.6rem)' } };

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
    { chave: 'orgao_gestor', titulo: schema.fields.orgao_gestor_id.spec.label, valor: foco.orgao_gestor ? `${foco.orgao_gestor.sigla} - ${foco.orgao_gestor.descricao}` : null },
    { chave: 'secretario_executivo', titulo: schema.fields.secretario_executivo.spec.label, valor: foco.secretario_executivo },
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
    { chave: 'orgao_responsavel', titulo: schema.fields.orgao_responsavel_id.spec.label, valor: foco.orgao_responsavel ? `${foco.orgao_responsavel.sigla} - ${foco.orgao_responsavel.descricao}` : null },
    { chave: 'secretario_responsavel', titulo: schema.fields.secretario_responsavel.spec.label, valor: foco.secretario_responsavel },
    { chave: 'responsavel', titulo: schema.fields.responsavel_id.spec.label, valor: foco.responsavel?.nome_exibicao || foco.responsavel?.id },
  ];
});

const colunasDeColaboradores = [
  {
    chave: 'orgao',
    label: schema.fields.orgaos_participantes.spec.label,
  },
  {
    chave: 'colaboradores',
    label: schema.fields.ponto_focal_colaborador.spec.label,
  },
];

const dadosDeColaboradores = computed(() => {
  if (!colaboradoresPorGrupo.value) {
    return [{ orgao: '-', colaboradores: '-' }];
  }

  return Object.values(colaboradoresPorGrupo.value).map((grupo) => ({
    orgao: grupo.sigla,
    colaboradores: combinadorDeListas(
      grupo.colaboradores,
      ', ',
      'nome_exibicao',
    ),
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

const grupoPortfolioLista = computed(() => {
  const foco = emFoco.value;
  if (!foco) return [];

  const grupos = foco.grupo_portfolio;
  return [{
    chave: 'grupo_portfolio',
    titulo: schema.fields.grupo_portfolio.spec.label,
    valor: Array.isArray(grupos) && grupos.length
      ? grupos.map((g) => g.titulo).join(', ')
      : null,
  }];
});

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
      planejado: foco.previsao_custo ? `R$ ${dinheiro(foco.previsao_custo)}` : '-',
      realizado: foco.realizado_custo ? `R$ ${dinheiro(foco.realizado_custo)}` : '-',
      desvio: foco.realizado_custo && foco.previsao_custo
        ? `R$ ${dinheiro(foco.realizado_custo - foco.previsao_custo)}`
        : '-',
    },
  ];
});

defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
});

if (!Array.isArray(organs.value) || !organs.value.length) {
  ÓrgãosStore.getAll();
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
        v-if="emFoco?.id && !emFoco?.arquivado && !emFoco?.permissoes?.apenas_leitura"
        :to="{
          name: 'obrasEditar',
          params: { obraId: emFoco.id },
          query: { escape: { name: 'obrasResumo' } }
        }"
        class="btn big ml2"
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
      <h2>Informações da Obra</h2>

      <SmaeDescriptionList
        :lista="informacoesDaObra"
        layout="grid"
        largura-minima="13rem"
      >
        <template #descricao--status="{ item }">
          {{ statusesObras[item.valor]?.nome || item.valor || '—' }}
        </template>

        <template #descricao--tags="{ item }">
          <ul class="listaComoTexto">
            <li v-if="!item.valor?.length">
              -
            </li>
            <li
              v-for="tag in item.valor"
              :key="tag.id"
            >
              {{ tag.descricao }}
            </li>
          </ul>
        </template>

        <template #descricao--mdo_detalhamento="{ item }">
          <span v-html="item.valor || '—'" />
        </template>

        <template #descricao--mdo_observacoes="{ item }">
          <span v-html="item.valor || '—'" />
        </template>
      </SmaeDescriptionList>

    </section>

    <section>
      <SmaeDescriptionList
        v-if="informacoesHabitacional.length"
        :lista="informacoesHabitacional"
        layout="grid"
        largura-minima="13rem"
      />
    </section>

    <section
      v-if="emFoco?.geolocalizacao?.length"
      class="borda-inferior"
    >
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
        class="mb1"
        :opcoes-do-poligono="{
          fill: true,
          opacity: 0.5,
        }"
        zoom="16"
      >
        <template #painel-flutuante="dados">
          <p
            v-if="dados.obra_nome"
            class="painel-flutuante__titulo"
          >
            {{ dados.obra_nome }}
          </p>

          <dl
            v-if="dados.orgao_resp_sigla
              || dados.subPrefeitura
              || dados.obra_status
              || dados.obra_etapa"
          >
            <div v-if="dados.orgao_resp_sigla">
              <dt>Órgão responsável</dt>
              <dd>{{ dados.orgao_resp_sigla }}</dd>
            </div>
            <div v-if="dados.subPrefeitura">
              <dt>Subprefeitura</dt>
              <dd>{{ dados.subPrefeitura }}</dd>
            </div>
            <div v-if="dados.obra_status">
              <dt>Status</dt>
              <dd>{{ statusesObras[dados.obra_status]?.nome || dados.obra_status }}</dd>
            </div>
            <div v-if="dados.obra_etapa">
              <dt>Etapa</dt>
              <dd>{{ dados.obra_etapa }}</dd>
            </div>
          </dl>
        </template>
      </MapaExibir>
    </section>

    <section class="borda-inferior">
      <h2>Vinculação Estratégica (Programa de Metas e outros)</h2>

      <SmaeTable
        v-if="dadosDeVinculacao.length"
        :colunas="colunasDeVinculacao"
        :dados="dadosDeVinculacao"
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
        <template #descricao--mdo_previsao_inauguracao="{ item }">
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
      />
    </section>

    <section>
      <SmaeDescriptionList
        :lista="orgaoResponsavelLista"
        layout="grid"
        largura-minima="13rem"
      />

      <SmaeTable
        :colunas="colunasDeColaboradores"
        :dados="dadosDeColaboradores"
        class="mb2 mt2"
      />

      <SmaeDescriptionList
        v-if="orgaosParticipantesLista.length"
        :lista="orgaosParticipantesLista"
        layout="grid"
        largura-minima="100%"
      />

      <SmaeDescriptionList
        :lista="grupoPortfolioLista"
        layout="grid"
        largura-minima="100%"
      />
    </section>

    <section v-if="equipeLista.length">
      <h2>
        {{ schema.fields.equipe.spec.label }}
      </h2>

      <SmaeDescriptionList
        :lista="equipeLista"
        layout="grid"
        largura-minima="13rem"
      />
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
