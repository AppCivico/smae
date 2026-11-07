import {
  boolean,
  number,
  object,
  string,
} from './initSchema';

export default object({
  concluido: boolean()
    .label('Concluído'),
  orgao_id: number()
    .label('Órgão responsável'),
  pessoa_responsavel: string()
    .label('Pessoa responsável'),
});
