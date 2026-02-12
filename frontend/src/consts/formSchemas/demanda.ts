import { type DemandaAcao } from '@back/casa-civil/demanda/acao/dto/acao.dto';
import {
  object, number, string, array, mixed,
} from './initSchema';
import dinheiro from '@/helpers/dinheiro';

export const CadastroDemandaSchema = ({ valorMinimo = 0 }) => object()
  .shape({
    id: number()
      .nullable(),

    // Recurso Financeiro
    valor: string()
      .label(`Valor (mínimo de ${dinheiro(valorMinimo, { style: 'currency' })})`)
      .required()
      .test('valor-minimo-e-maximo', (valor, { createError }) => {
        if (!valor) {
          return false;
        }

        const valorNumero = parseFloat(valor);

        if (Number.isNaN(valorNumero) || valorNumero < valorMinimo) {
          return createError({ message: `Valor mínimo de ${dinheiro(valorMinimo, { style: 'currency' })}` });
        }

        return true;
      }),
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
      .label('Nome do Ponto Focal')
      .max(250)
      .required(),
    cargo_responsavel: string()
      .label('Cargo do Ponto Focal')
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
      .min(1, 'Selecione pelo menos um endereço'),

    // Área Temática
    area_tematica_id: number()
      .label('Área')
      .required(),
    acao_ids: array()
      .label('Ações')
      .of(number())
      .min(1, 'Selecione pelo menos uma ação')
      .required('Selecione pelo menos uma ação'),
    observacao: string()
      .label('Observação')
      .max(2048)
      .nullable(),

    // Arquivos
    arquivos: array()
      .label('Documentos/Fotos/Arquivos')
      .nullable(),

    // Encaminhamento
    encaminhamento: mixed<DemandaAcao>()
      .label('Encaminhamento')
      .oneOf(
        [
          'editar',
          'enviar',
          'validar',
          'devolver',
          'cancelar',
        ],
        'Selecione um encaminhamento válido',
      )
      .when('id', {
        is: (val: string) => !!val,
        then: (s) => s.required(),
        otherwise: (s) => s.nullable(),
      }),
    encaminhamento_justificativa: string()
      .label('Justificativa')
      .max(2048)
      .when('encaminhamento', {
        is: (val: string) => ['devolver', 'cancelar'].includes(val),
        then: (s) => s.required(),
        otherwise: (s) => s.nullable(),
      }),
  });

export const FiltroDemandaSchema = object()
  .shape({
    status: string()
      .label('Status')
      .nullableOuVazio(),
    orgao_id: number()
      .label('Gestor Municipal')
      .nullableOuVazio(),
    area_tematica_id: number()
      .label('Área Temática')
      .nullableOuVazio(),
    palavra_chave: string()
      .label('Palavra-chave')
      .nullableOuVazio(),
  });

export default { };
