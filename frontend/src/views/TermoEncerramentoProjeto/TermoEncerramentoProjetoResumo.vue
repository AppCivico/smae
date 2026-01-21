<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { SessaoDeDetalheLinhas } from '@/components/ResumoSessao.vue';
import { termoEncerramento as schema } from '@/consts/formSchemas';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import dinheiro from '@/helpers/dinheiro';
import removerHtml from '@/helpers/html/removerHtml';
import { useAlertStore } from '@/stores/alert.store';
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
const router = useRouter();

const alertStore = useAlertStore();

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
  if (!emFoco.value?.icone?.download_token) return null;

  if (emFoco.value.icone.download_token.includes('http')) {
    return emFoco.value.icone.download_token;
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
      emFoco.value.icone = portfolio.icone_impressao;
    }
  }
}

function imprimirDocumento() {
  window.print();
}

async function iniciar() {
  await termoEncerramentoStore.buscarItem(props.escopoId);
  await verificarIcone();
}

function excluirTermo() {
  alertStore.confirmAction('Deseja resetar o termo de encerramento para padrão?', async () => {
    await termoEncerramentoStore.excluirItem(props.escopoId);
    alertStore.success('Termo de encerramento resetado com sucesso!');

    termoEncerramentoStore.$reset();

    iniciar();
  }, 'Resetar');
}

onMounted(() => {
  iniciar();
});

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
            valor: emFoco.value.nome_projeto,
          },
          {
            label: schema.fields.orgao_responsavel_nome.spec.label,
            valor: emFoco.value.orgao_responsavel_nome,
          },
          {
            label: schema.fields.portfolios_nomes.spec.label,
            valor: emFoco.value.portfolios_nomes,
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
        valor: dateIgnorarTimezone(emFoco.value.previsao_inicio, 'dd/MM/yyyy'),
      },
      {
        label: schema.fields.previsao_termino.spec.label,
        valor: dateIgnorarTimezone(emFoco.value.previsao_termino, 'dd/MM/yyyy'),
      },
    ],
    [
      {
        label: schema.fields.data_inicio_real.spec.label,
        valor: dateIgnorarTimezone(emFoco.value.data_inicio_real, 'dd/MM/yyyy'),
      },
      {
        label: schema.fields.data_termino_real.spec.label,
        valor: dateIgnorarTimezone(emFoco.value.data_termino_real, 'dd/MM/yyyy'),
      },
    ],
    [
      {
        label: schema.fields.previsao_custo.spec.label,
        valor: dinheiro(emFoco.value.previsao_custo, { style: 'currency' }),
      },
      {
        label: schema.fields.valor_executado_total.spec.label,
        valor: dinheiro(emFoco.value.valor_executado_total, { style: 'currency' }),
      },
    ],
    [
      {
        label: schema.fields.status_final.spec.label,
        valor: emFoco.value.status_final,
      },
      {
        label: schema.fields.etapa_nome.spec.label,
        valor: emFoco.value.etapa_nome,
      },
    ],
    [
      {
        label: schema.fields.justificativa_id.spec.label,
        valor: emFoco.value.justificativa?.descricao,
      },
      {
        label: schema.fields.responsavel_encerramento_nome.spec.label,
        valor: emFoco.value.responsavel_encerramento_nome,
      },
    ],
    [
      {
        label: schema.fields.justificativa_complemento.spec.label,
        valor: emFoco.value.justificativa_complemento,
        esconder: !emFoco.value.justificativa_complemento,
      },
    ],
    [
      {
        label: schema.fields.data_encerramento.spec.label,
        valor: dateIgnorarTimezone(emFoco.value.data_encerramento, 'dd/MM/yyyy'),
      },
      {
        label: schema.fields.assinatura.spec.label,
        valor: emFoco.value.assinatura,
        class: 'hide-on-print',
      },
    ],
  ];
});
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <button
        type="button"
        class="btn outline bgnone tcprimary big"
        @click="imprimirDocumento"
      >
        Imprimir
      </button>

      <button
        v-if="emFoco?.id"
        type="button"
        class="btn outline bgnone tcprimary big"
        @click="excluirTermo"
      >
        Resetar
      </button>

      <SmaeLink
        :to="{ name: '.termoEncerramento.editar' }"
        class="btn big"
      >
        Editar
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

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

    <div class="assinatura-impressao">
      <p
        v-if="emFoco?.assinatura"
        class="nome-assinante"
      >
        {{ emFoco.assinatura }}
      </p>
    </div>
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

.assinatura-impressao {
  display: none;
  text-align: center;
  margin-top: 10rem;
  page-break-before: avoid;
  page-break-inside: avoid;

  &::before {
    content: '';
    display: block;
    width: 300px;
    margin: 0 auto;
    border-top: 1px solid #000;
  }

  .nome-assinante {
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
}

@media print {
  .assinatura-impressao {
    display: block;
  }

  // Tendo que reforçar especificidade
  // pois helpers com !important e estilo scoped
  // estão sendo usados no que queremos sobrescrever
  :deep(.hide-on-print) {
    display: none !important;
  }
}
</style>
