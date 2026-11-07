import {
  number,
  object,
} from './initSchema';

export default object({
  fase_id: number()
    .required(),
  // `null` indica que a fase pertence a outro órgão
  orgao_responsavel_id: number()
    .label('Órgão responsável')
    .nullable(),
  pessoa_responsavel_id: number()
    .label('Pessoa Responsável')
    .when('orgao_responsavel_id', (orgaoId, field) => (orgaoId === null
      ? field.nullable()
      : field.required())),
  situacao_id: number()
    .label('Situação')
    .required(),
});
