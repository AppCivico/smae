import {
  number, object, string,
} from './initSchema';

export default object().shape({
  group_by: string()
    .label('Agrupar por')
    .nullableOuVazio(),
  orgao_id: number()
    .label('Órgão')
    .nullableOuVazio(),
  tag_id: number()
    .label('Tag')
    .nullableOuVazio(),
});
