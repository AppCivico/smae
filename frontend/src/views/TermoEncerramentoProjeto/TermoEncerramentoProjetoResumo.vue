<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import type { SessaoDeDetalheLinhas } from '@/components/ResumoSessao.vue';
import { termoEncerramento as schema } from '@/consts/formSchemas';
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
          {
            label: schema.fields.nome_projeto.spec.label,
            valor: formatarTexto(emFoco.value.nome_projeto),
          },
          {
            label: schema.fields.orgao_responsavel_nome.spec.label,
            valor: formatarTexto(emFoco.value.orgao_responsavel_nome),
          },
          {
            label: schema.fields.portfolios_nomes.spec.label,
            valor: formatarTexto(emFoco.value.portfolios_nomes),
          },
        ],
      ],
    },
    {
      linhas: [
        [{
          label: schema.fields.objeto.spec.label,
          valor: removerHtml(emFoco.value.objeto),
          col: 3,
        }],
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
      {
        label: schema.fields.previsao_inicio.spec.label,
        valor: formatarData(emFoco.value.previsao_inicio),
      },
      {
        label: schema.fields.previsao_termino.spec.label,
        valor: formatarData(emFoco.value.previsao_termino),
      },
    ],
    [
      {
        label: schema.fields.data_inicio_real.spec.label,
        valor: formatarData(emFoco.value.data_inicio_real),
      },
      {
        label: schema.fields.data_termino_real.spec.label,
        valor: formatarData(emFoco.value.data_termino_real),
      },
    ],
    [
      {
        label: schema.fields.previsao_custo.spec.label,
        valor: formatarMoeda(emFoco.value.previsao_custo),
      },
      {
        label: schema.fields.valor_executado_total.spec.label,
        valor: formatarMoeda(emFoco.value.valor_executado_total),
      },
    ],
    [
      {
        label: schema.fields.status_final.spec.label,
        valor: formatarTexto(emFoco.value.status_final),
      },
      {
        label: schema.fields.etapa_nome.spec.label,
        valor: formatarTexto(emFoco.value.etapa_nome),
      },
    ],
    [
      {
        label: schema.fields.justificativa_id.spec.label,
        valor: formatarJustificativa(),
      },
      {
        label: schema.fields.responsavel_encerramento_nome.spec.label,
        valor: formatarTexto(emFoco.value.responsavel_encerramento_nome),
      },
    ],
    [
      {
        label: schema.fields.data_encerramento.spec.label,
        valor: formatarData(emFoco.value.data_encerramento),
      },
      {
        label: schema.fields.assinatura.spec.label,
        valor: formatarTexto(emFoco.value.assinatura),
      },
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
