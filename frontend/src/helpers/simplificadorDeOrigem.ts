import type { DetalheOrigensDto } from '@back/common/dto/origem-pdm.dto';

type OrigemSimplificada = {
  atividade_id?: number | null;
  id?: number | null;
  iniciativa_id?: number | null;
  meta_id?: number | null;
  origem_tipo?: string | null;
  pdm_escolhido?: number | null;
};

type Origem = DetalheOrigensDto | OrigemSimplificada;

export default (origem :Origem, valorPadrao:OrigemSimplificada | null = null) => ({
  atividade_id: 'atividade_id' in origem
    ? (origem as OrigemSimplificada).atividade_id
    : (origem as DetalheOrigensDto)?.atividade?.id
    || valorPadrao?.atividade_id
    || null,
  id: origem?.id
    || valorPadrao?.id
    || null,
  iniciativa_id: 'iniciativa_id' in origem
    ? (origem as OrigemSimplificada).iniciativa_id
    : (origem as DetalheOrigensDto)?.iniciativa?.id
    || valorPadrao?.iniciativa_id
    || null,
  meta_id: 'meta_id' in origem
    ? (origem as OrigemSimplificada).meta_id
    : (origem as DetalheOrigensDto)?.meta?.id
    || valorPadrao?.meta_id
    || null,
  origem_tipo: origem?.origem_tipo
    || origem?.origem_tipo
    || valorPadrao?.origem_tipo
    || null,
  pdm_escolhido: 'pdm_escolhido' in origem
    ? (origem as OrigemSimplificada).pdm_escolhido
    : (origem as DetalheOrigensDto)?.pdm?.id
    || valorPadrao?.pdm_escolhido
    || null,
});
