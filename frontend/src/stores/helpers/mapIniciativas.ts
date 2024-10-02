import type { DadosCodTituloAtividadeDto, DadosCodTituloIniciativaDto } from '@/../../backend/src/meta/dto/create-meta.dto';

type AtividadesPorId = {
  [k: number]: DadosCodTituloAtividadeDto;
};

const mapAtividades = (atividades: DadosCodTituloAtividadeDto[]): AtividadesPorId => {
  const resultado: { [k: number]: DadosCodTituloAtividadeDto } = {};
  atividades.forEach((atividade: DadosCodTituloAtividadeDto) => {
    resultado[atividade.id] = atividade;
  });
  return resultado;
};

type ArvoreDeIniciativas = {
  [k: number]: Omit<DadosCodTituloAtividadeDto, 'atividades'> & {
    atividades: AtividadesPorId;
  };
};

export default (iniciativas: DadosCodTituloIniciativaDto[]) => {
  const resultado: ArvoreDeIniciativas = {};
  iniciativas.forEach((iniciativa: DadosCodTituloIniciativaDto) => {
    resultado[iniciativa.id] = {
      ...iniciativa,
      atividades: mapAtividades(iniciativa.atividades),
    };
  });
  return resultado;
};
