import {
  array, boolean, object, string,
} from './initSchema';

export default object({
  config: object({
    arquivos: array()
      .label('Configurar arquivos do relatório')
      .of(
        object({
          arquivo: string()
            .label('Arquivo')
            .required(),
          colunas: array()
            .label('Colunas selecionadas')
            .of(
              object({
                coluna: string()
                  .label('Coluna')
                  .required('Selecione a coluna'),
                label: string()
                  .label('Nome')
                  .nullableOuVazio(),
              }),
            ),
          incluir: boolean()
            .label('Excluir este arquivo do relatório'),
          order_by: array()
            .label('Ordenação')
            .of(
              object({
                coluna: string()
                  .label('Coluna')
                  .required('Selecione a coluna'),
                direcao: string()
                  .label('Direção')
                  .required('Selecione a direção'),
              }),
            ),
        }),
      ),
    xlsx_tipado: boolean()
      .label('XLSX com tipos nativos')
      .meta({
        balaoInformativo: 'Se marcado, o XLSX gerado terá dados em tipos nativos (números, datas, booleanos) em vez de todos como texto. Isso permite que a abertura do arquivo no Excel e execução filtros, ordenações e cálculos sem precisar de conversão de dados.',
      }),
  }),
  descricao: string()
    .label('Descrição')
    .max(1000)
    .nullableOuVazio(),
  fonte: string()
    .label('Relatório')
    .required('Selecione a fonte do relatório'),
  nome: string()
    .label('Nome')
    .max(250)
    .required('Preencha o nome do modelo'),
});

// Schema do formulário de filtro da listagem (FiltroParaPagina) — só o que é filtrável lá, não o
// formulário de criação/edição inteiro (que tem campos obrigatórios que travariam a busca).
export const filtro = object({
  fonte: string()
    .label('Relatório')
    .nullableOuVazio(),
});
