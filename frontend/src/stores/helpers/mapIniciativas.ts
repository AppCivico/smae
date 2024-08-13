import type { DadosCodTituloAtividadeDto, DadosCodTituloIniciativaDto } from '@/../../backend/src/meta/dto/create-meta.dto';

const mapAtividades = (atividades: DadosCodTituloAtividadeDto[]): any => {
  const resultado: { [k: number]: DadosCodTituloAtividadeDto } = {};
  atividades.forEach((atividade: DadosCodTituloAtividadeDto) => {
    resultado[atividade.id] = atividade;
  });
  return resultado;
};

export default (iniciativas: DadosCodTituloIniciativaDto[]) => {
  const resultado: { [k: number]: DadosCodTituloIniciativaDto } = {};
  iniciativas.forEach((iniciativa: DadosCodTituloIniciativaDto) => {
    resultado[iniciativa.id] = {
      ...iniciativa,
      atividades: mapAtividades(iniciativa.atividades),
    };
  });
  return resultado;
};
