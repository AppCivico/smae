<script setup lang="ts">
import type { VinculoDetalheObraDto } from '@back/casa-civil/vinculo/entities/vinculo.entity';
import { computed } from 'vue';

import ListaLegendas from '@/components/ListaLegendas.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import SmaeTooltip from '@/components/SmaeTooltip/SmaeTooltip.vue';
import statusObras from '@/consts/statusObras';
import dinheiro from '@/helpers/dinheiro';
import { useAuthStore } from '@/stores/auth.store';
import { LegendasStatus } from '@/stores/entidadesProximas.store';
import type { Vinculo } from '@/stores/transferenciasVinculos.store';

interface Props {
  dados: Vinculo[];
  tipo: 'endereco' | 'dotacao' | 'demanda';
  temPermissao: boolean;
}

const props = defineProps<Props>();

const temVinculosInvalidados = computed(() => props.dados.some((v) => v.invalidado_em));

const emit = defineEmits<{
  excluir: [vinculo: Vinculo];
}>();

const { temPermissãoPara } = useAuthStore();

const labelsDetalhesVinculo: Record<keyof VinculoDetalheObraDto, string> = {
  grupo_tematico_nome: 'Grupo Temático',
  equipamento_nome: 'Equipamento/Estrutura Pública',
  subprefeitura_nome: 'Subprefeitura',
  tipo_intervencao_nome: 'Tipo de Obra',
};

function obterObjetoVinculado(linha: Vinculo) {
  return linha.projeto || linha.meta || linha.iniciativa || linha.atividade || null;
}

function formatarDetalhes(detalhes: VinculoDetalheObraDto | null) {
  if (!detalhes || Object.keys(detalhes).length === 0) {
    return [];
  }

  return (Object.entries(detalhes) as [keyof VinculoDetalheObraDto, string | null][])
    .map(([chave, valor]) => ({
      label: labelsDetalhesVinculo[chave],
      valor: valor || '-',
    }));
}

function obterStatusTraduzido(linha: Vinculo): string {
  const objetoVinculado = obterObjetoVinculado(linha);
  if (!objetoVinculado?.status) return '-';

  if (linha.projeto?.tipo === 'MDO') {
    return statusObras[objetoVinculado.status as keyof typeof statusObras]?.nome
      || objetoVinculado.status;
  }

  return objetoVinculado.status;
}

function obterModuloDoVinculo(vinculo: Vinculo): { label: string; cor: string } {
  if (vinculo.projeto?.tipo === 'MDO') {
    return { label: LegendasStatus.obras.item, cor: LegendasStatus.obras.color };
  }
  if (vinculo.projeto?.tipo === 'PP') {
    return { label: LegendasStatus.projetos.item, cor: LegendasStatus.projetos.color };
  }
  if (vinculo.meta || vinculo.iniciativa || vinculo.atividade) {
    if (vinculo.pdm?.tipo === 'PS') {
      return {
        label: LegendasStatus.planoSetorial.item,
        cor: LegendasStatus.planoSetorial.color,
      };
    }
    return {
      label: LegendasStatus.programaDeMetas.item,
      cor: LegendasStatus.programaDeMetas.color,
    };
  }
  return { label: '-', cor: '#cccccc' };
}

const colunas = computed(() => {
  const colunasBase = [
    {
      chave: 'distribuicao_recurso.orgao.sigla',
      label: 'Órgão Responsável',
    },
    {
      chave: 'distribuicao_recurso.nome',
      label: 'Distribuição',
    },
    {
      chave: 'distribuicao_recurso.valor',
      label: 'Valor',
      formatador: (valor: number | null) => {
        if (valor === null || valor === undefined) return '-';
        const formatado = dinheiro(valor);
        return formatado ? `R$ ${formatado}` : '-';
      },
      atributosDaCelula: {
        class: 'cell--number',
      },
      atributosDoCabecalhoDeColuna: {
        class: 'cell--number',
      },
    },
    {
      chave: 'tipo_vinculo.nome',
      label: 'Tipo de Vínculo',
    },
    {
      chave: 'objeto_vinculado',
      label: 'Projeto/Obra/Meta',
    },
    {
      chave: 'valor_vinculo',
      label: (() => {
        if (props.tipo === 'endereco') return 'Endereço';
        if (props.tipo === 'dotacao') return 'Dotação';
        return 'Demanda';
      })(),
    },
  ];

  if (props.tipo === 'endereco' || props.tipo === 'dotacao') {
    colunasBase.push({
      chave: 'modulo',
      label: 'Módulo',
    });
  }

  return colunasBase;
});
</script>

<template>
  <div
    v-if="dados.length === 0"
    class="p2 tc"
  >
    <template v-if="tipo === 'endereco'">
      Nenhum vínculo por endereço cadastrado.
    </template>
    <template v-else-if="tipo === 'dotacao'">
      Nenhum vínculo por dotação cadastrado.
    </template>
    <template v-else>
      Nenhum vínculo por demanda cadastrado.
    </template>
  </div>

  <div v-else>
    <ListaLegendas
      v-if="temVinculosInvalidados"
      :legendas="{
        principal: [{
          item: 'Vínculo invalidado',
          icon: 'i_alert',
          usarCssColor: true,
          color: 'var(--laranja)',
        }]
      }"
      :duas-linhas="true"
      align="right"
      :borda="false"
      titulo=""
    />

    <SmaeTable
      :colunas="colunas"
      :dados="dados"
      :rota-editar="temPermissao
        ? { name: 'TransferenciasVoluntariasVinculosEditar' }
        : undefined
      "
      parametro-da-rota-editar="vinculoId"
      parametro-no-objeto-para-editar="id"
      parametro-no-objeto-para-excluir="id"
      :esconder-deletar="!temPermissao"
      :personalizar-linhas="{
        parametro: 'invalidado_em',
        alvo: null,
        classe: ''
      }"
      :titulo-para-rolagem-horizontal="`Lista de vínculos por ${tipo}`"
      rolagem-horizontal
      @deletar="(vinculo: Vinculo) => emit('excluir', vinculo)"
    >
      <template #celula:modulo="{ linha }">
        <span
          class="modulo-badge"
          :style="{ backgroundColor: obterModuloDoVinculo(linha).cor }"
        >
          {{ obterModuloDoVinculo(linha).label }}
        </span>
      </template>

      <template #acoes="{ linha }">
        <SmaeTooltip
          v-if="linha.invalidado_em"
          :texto="`Vínculo invalidado${linha.motivo_invalido
            ? `: ${linha.motivo_invalido}`
            : ''}`"
          as="span"
          class="fs0"
        >
          <template #botao>
            <svg
              width="20"
              height="20"
              color="var(--laranja)"
              aria-label="Vínculo invalidado"
            >
              <use xlink:href="#i_alert" />
            </svg>
          </template>
        </SmaeTooltip>
        <SmaeLink
          v-else-if="temPermissao"
          :to="{
            name: 'TransferenciasVoluntariasVinculosEditar',
            params: { vinculoId: linha.id }
          }"
        >
          <svg
            width="20"
            height="20"
            class="fs0"
          >
            <use xlink:href="#i_edit" />
          </svg>
        </SmaeLink>

        <button
          v-if="!!temPermissãoPara('CadastroVinculo.remover')"
          class="like-a__text"
          type="button"
          aria-label="Remover item"
          title="Remover item"
          @click="emit('excluir', linha)"
        >
          <svg
            width="20"
            height="20"
            class="fs0"
          >
            <use xlink:href="#i_waste" />
          </svg>
        </button>
      </template>

      <template #sub-linha="{ linha }">
        <td :colspan="colunas.length + 1">
          <div class="flex flexwrap g2">
            <dl
              v-if="linha.projeto?.portfolio"
              class="flex column g05"
            >
              <dt class="t12 uc w700 tc300">
                {{ `Portfolio: ${linha.projeto.portfolio.nome}` }}
              </dt>
              <dd>
                {{ obterObjetoVinculado(linha)?.nome || '-' }}
              </dd>
            </dl>

            <dl class="flex column g05">
              <dt class="t12 uc w700 tc300">
                Órgão
              </dt>
              <dd>
                {{ obterObjetoVinculado(linha)?.orgao?.sigla || '-' }}
              </dd>
            </dl>

            <dl class="flex column g05">
              <dt class="t12 uc w700 tc300">
                Status
              </dt>
              <dd>
                {{ obterStatusTraduzido(linha) }}
              </dd>
            </dl>

            <dl
              v-if="linha.detalhes && linha.projeto?.tipo === 'MDO'"
              class="flex column g05"
            >
              <dt class="t12 uc w700 tc300">
                Detalhes
              </dt>
              <dd>
                <dl>
                  <div
                    v-for="detalhe in formatarDetalhes(linha.detalhes)"
                    :key="detalhe.label"
                    class="flex g025"
                  >
                    <dt>
                      {{ detalhe.label }}:
                    </dt>
                    <dd>
                      {{ detalhe.valor }}
                    </dd>
                  </div>
                </dl>
              </dd>
            </dl>

            <dl
              v-if="linha.iniciativa || linha.atividade"
              class="flex column g05"
            >
              <dt class="t12 uc w700 tc300">
                Detalhes
              </dt>
              <dd>
                <dl>
                  <div
                    v-if="linha.iniciativa"
                    class="flex g025"
                  >
                    <dt>
                      {{ (linha.pdm?.rotulo_iniciativa ?? 'Iniciativa') + ':' }}
                    </dt>
                    <dd>
                      {{ linha.iniciativa.nome }}
                    </dd>
                  </div>
                  <div
                    v-if="linha.atividade"
                    class="flex g025"
                  >
                    <dt>
                      {{ (linha.pdm?.rotulo_atividade ?? 'Atividade') + ':' }}
                    </dt>
                    <dd>
                      {{ linha.atividade.nome }}
                    </dd>
                  </div>
                </dl>
              </dd>
            </dl>

            <dl
              v-if="linha.demanda"
              class="flex column g05"
            >
              <dt class="t12 uc w700 tc300">
                Área Temática
              </dt>
              <dd>
                {{ linha.demanda.area_tematica?.nome || '-' }}
              </dd>
            </dl>

            <dl
              v-if="linha.demanda"
              class="flex column g05"
            >
              <dt class="t12 uc w700 tc300">
                Órgão da Demanda
              </dt>
              <dd>
                {{ linha.demanda.orgao?.sigla || '-' }}
              </dd>
            </dl>

            <dl
              v-if="linha.demanda"
              class="flex column g05"
            >
              <dt class="t12 uc w700 tc300">
                Valor da Demanda
              </dt>
              <dd>
                {{
                  linha.demanda.valor !== null && linha.demanda.valor !== undefined
                    ? `R$ ${dinheiro(linha.demanda.valor)}`
                    : '-'
                }}
              </dd>
            </dl>

            <dl
              v-if="linha.observacao"
              class="flex column g05"
            >
              <dt class="t12 uc w700 tc300">
                Observação
              </dt>
              <dd>
                {{ linha.observacao }}
              </dd>
            </dl>
          </div>
        </td>
      </template>
    </SmaeTable>
  </div>
</template>

<style lang="less" scoped>
.modulo-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.2rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-align: center;
  white-space: nowrap;
}
</style>
