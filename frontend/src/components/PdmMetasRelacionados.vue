<template>
  <div
    v-if="relacionamentos.length"
    role="region"
    :aria-label="$props.titulo"
    tabindex="0"
  >
    <div class="flex spacebetween center mt4 mb2">
      <h2 class="mb0">
        {{ $props.titulo }}
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
      <thead>
        <tr>
          <th>
            Tipo
          </th>
          <th>
            PdM / Plano Setorial
          </th>
          <th>Órgãos</th>
          <th>Meta</th>
          <th />
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(relacionamento, idx) in listaComOrgaosCombinados"
          :key="idx"
        >
          <td>
            {{ relacionamento.direcao }}

            <abbr
              v-if="tiposDePlanos[relacionamento.tipo as keyof typeof tiposDePlanos]"
              :title="tiposDePlanos[relacionamento.tipo as keyof typeof tiposDePlanos].nome"
            >
              {{ relacionamento.tipo }}
            </abbr>
            <template v-else>
              {{ relacionamento.tipo }}
            </template>
          </td>
          <td>{{ relacionamento.pdm_descricao }}</td>
          <td>{{ combinadorDeListas(relacionamento.orgaos as Array<object>, ', ', 'sigla') }}</td>
          <td
            :title="relacionamento.meta_titulo?.length > 36
              ? truncate(relacionamento.meta_titulo)
              : null"
          >
            <em v-if="relacionamento.meta_codigo">
              {{ relacionamento.meta_codigo }} -
            </em>
            {{ truncate(relacionamento.meta_titulo, 36) || '-' }}
          </td>
          <td
            :title="relacionamento.iniciativa_descricao
              && relacionamento.iniciativa_descricao?.length > 36
              ? truncate(relacionamento.iniciativa_descricao)
              : null"
          >
            <strong v-if="relacionamento.iniciativa_descricao">
              {{ relacionamento.pdm_rotulo_iniciativa || 'Iniciativa' }}:
            </strong>
            <em v-if="relacionamento.iniciativa_codigo">
              {{ relacionamento.iniciativa_codigo }} -
            </em>
            {{ truncate(relacionamento.iniciativa_descricao, 36) || '-' }}
          </td>
          <td
            :title="relacionamento.atividade_descricao
              && relacionamento.atividade_descricao?.length > 36
              ? truncate(relacionamento.atividade_descricao)
              : null"
          >
            <strong v-if="relacionamento.atividade_descricao">
              {{ relacionamento.pdm_rotulo_atividade || 'Atividade' }}:
            </strong>
            <em v-if="relacionamento.atividade_codigo">
              {{ relacionamento.atividade_codigo }} -
            </em>
            {{ truncate(relacionamento.atividade_descricao, 36) || '-' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts" setup>
import type { IdSigla } from '@/../../backend/src/common/dto/IdSigla.dto.ts';
import type { MetaPdmDto } from '@/../../backend/src/meta/entities/meta.entity.ts';

import tiposDePlanos from '@/consts/tiposDePlanos';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import truncate from '@/helpers/truncate';
import { uniqBy } from 'lodash';
import { computed, defineProps } from 'vue';

type MetaPdmDtoComOrgaosCombinados = MetaPdmDto & {
  orgaos: IdSigla[];
};

const props = defineProps({
  relacionamentos: {
    type: Array as () => MetaPdmDto[],
    default: () => [],
  },
  titulo: {
    type: String,
    default: 'Relacionamentos com outros compromissos',
  },
});

function combinadorDeOrgaos(relacionamento: MetaPdmDto): IdSigla[] {
  let todosOsOrgaos: IdSigla[] = [];

  if (Array.isArray(relacionamento.meta_orgaos)) {
    todosOsOrgaos = todosOsOrgaos.concat(relacionamento.meta_orgaos);
  }

  if (Array.isArray(relacionamento.iniciativa_orgaos)) {
    todosOsOrgaos = todosOsOrgaos.concat(relacionamento.iniciativa_orgaos);
  }

  if (Array.isArray(relacionamento.atividade_orgaos)) {
    todosOsOrgaos = todosOsOrgaos.concat(relacionamento.atividade_orgaos);
  }

  return todosOsOrgaos.length
    ? uniqBy(todosOsOrgaos, 'id')
    : todosOsOrgaos;
}

// eslint-disable-next-line max-len
const listaComOrgaosCombinados = computed<MetaPdmDtoComOrgaosCombinados[]>(() => props.relacionamentos.map((relacionamento) => ({
  ...relacionamento,
  orgaos: combinadorDeOrgaos(relacionamento),
})));
</script>
