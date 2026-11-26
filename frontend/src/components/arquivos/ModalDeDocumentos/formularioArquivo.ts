import {
  boolean,
  mixed,
  object,
  string,
  number,
} from '@/consts/formSchemas/initSchema';

const schema = object({
  arquivo: mixed<File>().label('Arquivo').required('Selecione um arquivo'),
  autoriza_divulgacao: boolean().label('Autoriza divulgação').default(false),
  descricao: string().label('Descrição').required().max(1024),
  id: number().label('id').nullable(),
  // o backend exige o tipo só quando um arquivo novo é enviado; ao editar apenas as
  // informações de um documento já anexado, `arquivo` não é um `File`
  tipo_documento_id: number()
    .label('Tipo de documento')
    .nullableOuVazio()
    .when('arquivo', {
      is: (arquivo: unknown) => arquivo instanceof File,
      then: (campo) => campo.required('Escolha um tipo de documento'),
    }),
});
export default schema;
