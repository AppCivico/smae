import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { PSMFSituacaoVariavelDto } from '@back/mf/ps-dash/dto/ps.dto';
import { ListaVariaveis } from '@/components/graficos/GraficoBarraEmLinha.vue';
import { usePanoramaPlanoSetorialStore } from '@/stores/planoSetorial.panorama.store';

type OpcoesChave = 'associadas_plano_atual' | 'nao_associadas_plano_atual';
type ListaVariaveisPreparacao = Omit<ListaVariaveis, 'valor'>;

function useGraficoEmBarra(chave: OpcoesChave, metadados: ListaVariaveisPreparacao) {
  const route = useRoute();

  const panoramaStore = usePanoramaPlanoSetorialStore(route.meta.entidadeMãe);

  const { variaveis } = storeToRefs(panoramaStore);

  const grupoDeVariavel = computed<PSMFSituacaoVariavelDto | null>(() => {
    if (!chave) {
      return null;
    }

    if (!variaveis.value?.[chave]) {
      return null;
    }

    return variaveis.value[chave];
  });

  const variaveisPreparadas = computed<ListaVariaveis>(() => {
    if (!grupoDeVariavel.value) {
      return {};
    }

    const dados = Object.keys(grupoDeVariavel.value)
      .reduce<ListaVariaveis>((acumulador, chaveVariavel) => {
      if (!metadados[chaveVariavel]) {
        return acumulador;
      }

      return {
        ...acumulador,
        [chaveVariavel]: {
          ...metadados[chaveVariavel],
          valor: grupoDeVariavel.value[chaveVariavel] || (0 as number),
        },
      };
    }, {});

    return dados;
  });

  return {
    variaveisPreparadas,
  };
}

export default useGraficoEmBarra;
