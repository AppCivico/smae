<script lang="js" setup>
import { storeToRefs } from 'pinia';
import { computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import rotasDosNiveisDeMetas from '@/consts/rotasDosNiveisDeMetas';
import truncate from '@/helpers/texto/truncate';
import {
  useAtividadesStore,
  useIniciativasStore,
  useMetasStore,
} from '@/stores';

const route = useRoute();
const router = useRouter();

const MetasStore = useMetasStore();
const { singleMeta, activePdm } = storeToRefs(MetasStore);
const IniciativasStore = useIniciativasStore();
const { singleIniciativa } = storeToRefs(IniciativasStore);

const AtividadesStore = useAtividadesStore();
const { singleAtividade } = storeToRefs(AtividadesStore);

const groupBy = localStorage.getItem('groupBy') ?? 'todas';

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

function rotaCorrenteCoincide(caminho) {
  return route.path === caminho
    || route.path === String(caminho).replace(/\/$/, '');
}

function compilarTextoDoLink(meta, name, limite) {
  return truncate(
    (meta?.tituloMigalhaDeMeta && (
      typeof meta.tituloMigalhaDeMeta === 'function'
        ? meta.tituloMigalhaDeMeta(route)
        : meta.tituloMigalhaDeMeta
    ))
    || meta?.títuloParaMenu
    || (meta?.título && (
      typeof meta.título === 'function'
        ? meta.título()
        : meta.título
    ))
    || name,
    limite,
  );
}

const listaDeMigalhas = computed(() => {
  const migalhas = [];
  // vamos conferir se a rota corrente já está presente nas migalhas de pão.
  // Caso não esteja, adicionamos ao final, sem link
  let rotaCorrentePresenteNaMigalha = false;

  // Dentro de Planos Setoriais, os caminhos das rotas de metas
  // são prefixados com `/plano-setorial/$ID}` direto no componente `<SmaeLink>`.
  // Precisamos levar isso em consideração para verificar se
  // a rota corrente já está presente nas migalhas ou não.
  const prefixoDeCaminhos = route.meta?.prefixoDosCaminhos ?? '';

  // As primeiras rotas estão definidas manualmente por arquitetura legada da versão original
  if (activePdm.value?.id) {
    migalhas.push({
      to: '/metas',
      textoDoItem: activePdm.value?.nome,
      desabilitar: !metaId.value || !activePdm.value?.id,
    });
  }

  if (metaId.value && activePdm.value?.id) {
    Object.values(rotasDosNiveisDeMetas).forEach((item) => {
      const possuiNivel = activePdm.value?.[`possui_${item.nível}`];
      const nivelDaMeta = singleMeta.value?.[item.nível];

      if (
        possuiNivel
        && nivelDaMeta
        && [item.nível, 'todas'].includes(groupBy)
      ) {
        const rotuloNivel = activePdm.value?.[`rotulo_${item.nível}`];
        const desabilitar = rotaCorrenteCoincide(`${prefixoDeCaminhos}/metas/${item.segmento}/${nivelDaMeta?.id}`);
        rotaCorrentePresenteNaMigalha ||= desabilitar;
        migalhas.push({
          to: `/metas/${item.segmento}/${nivelDaMeta?.id}`,
          textoDoItem: `${rotuloNivel} ${nivelDaMeta?.descricao}`,
          desabilitar,
        });
      }
    });
  }

  if (metaId.value && singleMeta.value.id) {
    const desabilitar = rotaCorrenteCoincide(`${prefixoDeCaminhos}/metas/${metaId.value}`);
    rotaCorrentePresenteNaMigalha ||= desabilitar;
    migalhas.push({
      to: `/metas/${metaId.value}`,
      textoDoItem: `${singleMeta.value?.codigo} ${singleMeta.value?.titulo}`,
      desabilitar,
    });
  }

  if (iniciativaId.value && activePdm.value?.possui_iniciativa && singleIniciativa.value.id) {
    const desabilitar = rotaCorrenteCoincide(`${prefixoDeCaminhos}/metas/${metaId.value}/iniciativas/${iniciativaId.value}`);
    rotaCorrentePresenteNaMigalha ||= desabilitar;
    migalhas.push({
      to: `/metas/${metaId.value}/iniciativas/${iniciativaId.value}`,
      textoDoItem: `${activePdm.value?.rotulo_iniciativa} ${singleIniciativa.value?.codigo} ${singleIniciativa.value?.titulo}`,
      desabilitar,
    });
  }

  if (atividadeId.value && activePdm.value?.possui_atividade && singleAtividade.value.id) {
    const desabilitar = rotaCorrenteCoincide(`${prefixoDeCaminhos}/metas/${metaId.value}/iniciativas/${iniciativaId.value}/atividades/${atividadeId.value}`);
    rotaCorrentePresenteNaMigalha ||= desabilitar;
    migalhas.push({
      to: `/metas/${metaId.value}/iniciativas/${iniciativaId.value}/atividades/${atividadeId.value}`,
      textoDoItem: `${activePdm.value?.rotulo_atividade} ${singleAtividade.value?.codigo} ${singleAtividade.value?.titulo}`,
      desabilitar,
    });
  }

  // Adicionar rotas extras que podem ter sido definidas por metadados da rota corrente
  route.meta.migalhasDeMetas?.forEach((x) => {
    let rotaParaResolver = x;
    let desabilitar;

    if (typeof x === 'string') {
      if (x.includes('/')) {
        if (rotaCorrenteCoincide(x)) {
          rotaCorrentePresenteNaMigalha = true;
          desabilitar = true;
        }
        rotaParaResolver = { path: x };
      } else {
        if (x === route.name) {
          rotaCorrentePresenteNaMigalha = true;
          desabilitar = true;
        }
        rotaParaResolver = { name: x };
      }
    }

    const item = router.resolve({ ...rotaParaResolver, params: route.params });

    migalhas.push({
      to: item.href,
      textoDoItem: compilarTextoDoLink(item.meta, item.name, 50),
      desabilitar,
    });
  });

  if (!rotaCorrentePresenteNaMigalha) {
    migalhas.push({
      // Não sei o motivo de o carte aqui ser em 150 caracteres,
      // mas é o que estava sendo usado antes.
      // Talvez seja para evitar que títulos muito longos quebrem a linha.
      textoDoItem: compilarTextoDoLink(route.meta, route.name, 150),
      desabilitar: true,
    });
  }

  return migalhas;
});

watchEffect(() => {
  if (metaId.value && singleMeta.value.id !== metaId.value) {
    MetasStore.getById(metaId.value);
  }

  if (metaId.value && !activePdm.value?.id) {
    MetasStore.getPdM();
  }

  if (
    iniciativaId.value
    && singleIniciativa.value.id !== iniciativaId.value
    && !singleIniciativa.value.loading
  ) {
    IniciativasStore.getByIdReal(iniciativaId.value);
  }
  if (
    atividadeId.value
    && singleAtividade.value.id !== atividadeId.value
    && !singleAtividade.value.loading
  ) {
    AtividadesStore.getByIdReal(atividadeId.value);
  }
});

</script>
<template>
  <nav class="migalhas-de-pão migalhas-de-pão--metas">
    <ul class="migalhas-de-pão__lista">
      <li
        v-for="(item, index) in listaDeMigalhas"
        :key="`rota-migalha--${index}`"
        class="migalhas-de-pão__item"
      >
        <SmaeLink
          v-if="!item.desabilitar && item.to"
          :to="item.to"
          class="migalhas-de-pão__link"
        >
          {{ item.textoDoItem }}
        </SmaeLink>
        <template v-else>
          {{ item.textoDoItem }}
        </template>
      </li>
    </ul>
  </nav>
</template>
