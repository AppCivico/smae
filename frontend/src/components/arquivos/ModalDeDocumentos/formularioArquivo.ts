import {
  boolean,
  mixed,
  object,
  string,
  number,
} from '@/consts/formSchemas/initSchema';

const schema = object({
  id: number().label('id').nullable(),
  descricao: string().label('Descrição').required().max(1024),
  autoriza_divulgacao: boolean().label('Autoriza divulgação').default(false),
  arquivo: mixed<File>().label('Arquivo').required('Selecione um arquivo'),
});
export default schema;
