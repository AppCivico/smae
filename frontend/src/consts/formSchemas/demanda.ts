import {
  object, number, string, array,
} from './initSchema';

export const CadastroDemanda = object()
  .shape({
    // Recurso Financeiro
    valor: string()
      .label('Valor (mínimo de R$ 10.000,00)')
      .required(),
    finalidade: string()
      .label('Finalidade')
      .oneOf(['Custeio', 'Investimento'], 'Selecione uma finalidade válida')
      .required(),

    // Contato do Proponente
    orgao_id: number()
      .label('Gestor Municipal')
      .required(),
    unidade_responsavel: string()
      .label('Unidade Responsável')
      .max(250)
      .required(),
    nome_responsavel: string()
      .label('Nome do Responsável')
      .max(250)
      .required(),
    cargo_responsavel: string()
      .label('Cargo do Responsável')
      .max(250)
      .required(),
    email_responsavel: string()
      .label('Email')
      .email('Email inválido')
      .max(250)
      .required(),
    telefone_responsavel: string()
      .label('Telefone')
      .max(20)
      .required(),

    // Demanda
    nome_projeto: string()
      .label('Nome do Projeto')
      .max(250)
      .required(),
    descricao: string()
      .label('Descrição')
      .max(2048)
      .required(),
    justificativa: string()
      .label('Justificativa')
      .max(2048)
      .required(),
    localizacoes: array()
      .label('Localização (Distrito/Subprefeitura)')
      .nullable(),

    // Área Temática
    area_tematica_id: number()
      .label('Área')
      .required(),
    acao_ids: array()
      .label('Ações')
      .of(number())
      .nullable(),
    observacao: string()
      .label('Observação')
      .max(2048)
      .nullable(),

    // Arquivos
    arquivos: array()
      .label('Documentos/Fotos/Arquivos')
      .nullable(),
  });

export default { };
