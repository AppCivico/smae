<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import type { SessaoDeDetalheLinhas } from '@/components/ResumoSessao.vue';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import dinheiro from '@/helpers/dinheiro';
import removerHtml from '@/helpers/html/removerHtml';
import { usePortfolioStore } from '@/stores/portfolios.store';
import { useProjetosStore } from '@/stores/projetos.store';
import { useTermoEncerramentoStore } from '@/stores/termoEncerramento.store';

type Props = {
  escopoId: number;
};

type SessaoResumo = {
  titulo?: string;
  linhas: SessaoDeDetalheLinhas;
  quantidadeColunas?: number;
};

const props = defineProps<Props>();

const route = useRoute();

// @ts-expect-error - VITE_API_URL está definido no ambiente
const BASE_URL = `${import.meta.env.VITE_API_URL}`;

const termoEncerramentoStore = useTermoEncerramentoStore(route.meta.entidadeMãe);
const projetosStore = useProjetosStore();
const portfoliosStore = usePortfolioStore();

const {
  emFoco,
  chamadasPendentes,
} = storeToRefs(termoEncerramentoStore);

const classeAlinhamentoIcone = computed(() => {
  const alinhamentoIcone = {
    Esquerda: 'justifyleft',
    Centro: 'justifycenter',
    Direita: 'justifyright',
  };

  return alinhamentoIcone[emFoco.value?.posicao_logotipo as keyof typeof alinhamentoIcone] || 'justify-start';
});

const urlIcone = computed(() => {
  if (!emFoco.value?.icone) return null;

  if (emFoco.value.icone.download_token.includes('http')) {
    return emFoco.value.icone;
  }

  return `${BASE_URL}/download/${emFoco.value.icone.download_token}`;
});

async function verificarIcone() {
  if (!emFoco.value || emFoco.value.icone) return;

  const projetoId = emFoco.value.projeto_id;

  if (projetosStore.emFoco?.id !== projetoId) {
    await projetosStore.buscarItem(projetoId);
  }

  const projeto = projetosStore.emFoco;
  if (!projeto) return;

  if (portfoliosStore.emFoco?.id !== projeto.portfolio_id) {
    await portfoliosStore.buscarItem(projeto.portfolio_id);
  }

  const portfolio = portfoliosStore.emFoco;

  if (portfolio?.icone_impressao) {
    if (emFoco.value) {
      emFoco.value.icone = portfolio.icone_impressao.download_token;
    }
  }
}

onMounted(async () => {
  await termoEncerramentoStore.buscarItem(props.escopoId);
  await verificarIcone();
});

function formatarData(data: Date | string | null): string | null {
  if (!data) {
    return '-';
  }

  return dateIgnorarTimezone(String(data), 'dd/MM/yyyy');
}

function formatarMoeda(valor: number | null): string {
  if (valor === null || valor === undefined) {
    return '-';
  }

  return dinheiro(valor, { style: 'currency' });
}

function formatarTexto(texto: string | null): string {
  if (!texto) {
    return '-';
  }

  return texto;
}

function formatarJustificativa(): string {
  if (!emFoco.value?.justificativa) {
    return '-';
  }

  let resultado = emFoco.value.justificativa.descricao;

  if (
    emFoco.value.justificativa.habilitar_info_adicional
    && emFoco.value.justificativa_complemento
  ) {
    resultado += `\n\nComplemento: ${emFoco.value.justificativa_complemento}`;
  }

  return resultado;
}

const sessaoPrincipal = computed<SessaoResumo[]>(() => {
  if (!emFoco.value) {
    return [];
  }

  return [
    {
      linhas: [
        [
          { label: 'Projeto', valor: formatarTexto(emFoco.value.nome_projeto) },
          { label: 'Órgão Responsável', valor: formatarTexto(emFoco.value.orgao_responsavel_nome) },
          { label: 'Portfólio', valor: formatarTexto(emFoco.value.portfolios_nomes) },
        ],
      ],
    },
    {
      linhas: [
        [{ label: 'Objeto', valor: removerHtml(emFoco.value.objeto), col: 3 }],
      ],
    },
  ];
});

const sessoes = computed<SessaoDeDetalheLinhas | null>(() => {
  if (!emFoco.value) {
    return null;
  }

  return [
    [
      { label: 'Data de início planejado', valor: formatarData(emFoco.value.previsao_inicio) },
      { label: 'Data de término planejado', valor: formatarData(emFoco.value.previsao_termino) },
    ],
    [
      { label: 'Data de início real', valor: formatarData(emFoco.value.data_inicio_real) },
      { label: 'Data de término real', valor: formatarData(emFoco.value.data_termino_real) },
    ],
    [
      { label: 'Data de início planejado', valor: formatarData(emFoco.value.previsao_inicio) },
      { label: 'Data de término planejado', valor: formatarData(emFoco.value.previsao_termino) },
    ],
    [
      { label: 'Data de início real', valor: formatarData(emFoco.value.data_inicio_real) },
      { label: 'Data de término real', valor: formatarData(emFoco.value.data_termino_real) },
    ],
    [
      { label: 'Custo planejado', valor: formatarMoeda(emFoco.value.previsao_custo) },
      { label: 'Custo executado real', valor: formatarMoeda(emFoco.value.valor_executado_total) },
    ],
    [
      { label: 'Status final', valor: formatarTexto(emFoco.value.status_final) },
      { label: 'Etapa do projeto', valor: formatarTexto(emFoco.value.etapa_nome) },
    ],
    [
      { label: 'Justificativa do encerramento', valor: formatarJustificativa() },
      { label: 'Responsável pelo encerramento', valor: formatarTexto(emFoco.value.responsavel_encerramento_nome) },
    ],
    [
      { label: 'Data', valor: formatarData(emFoco.value.data_encerramento) },
      { label: 'Assinatura', valor: formatarTexto(emFoco.value.assinatura) },
    ],
  ];
});
</script>

<template>
  <header class="flex spacebetween center mb2 g2">
    <TítuloDePágina />

    <hr class="f1">

    <SmaeLink
      :to="{ name: '.termoEncerramento.editar' }"
      class="btn big"
    >
      Editar
    </SmaeLink>
  </header>

  <div
    v-if="urlIcone"
    class="flex mb2"
    :class="classeAlinhamentoIcone"
  >
    <img
      :src="urlIcone"
      alt="Ícone do termo de encerramento"
      class="icone-termo"
    >
  </div>

  <section
    v-if="sessoes"
    class="termo-encerramento-resumo"
  >
    <ResumoSessao
      v-for="(sessao, sessaoIndex) in sessaoPrincipal"
      :key="`sessao--${sessaoIndex}`"
      :linhas="sessao.linhas"
    />

    <ResumoSessao
      :linhas="sessoes"
      :quantidade-colunas="3"
    />
  </section>

  <LoadingComponent v-else-if="chamadasPendentes.emFoco" />
</template>

<style lang="less" scoped>
.termo-encerramento-resumo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.icone-termo {
  max-width: 200px;
  max-height: 200px;
  object-fit: contain;
}
</style>
