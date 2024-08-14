
from .basic import parse_tipo_doc, parser_unidade

def parse_link_documento(dados_doc:dict)->dict:

    return {'link' : dados_doc['link_acesso']}


def parse_resumo_documento(dados_doc:dict)->dict:

    parsed = {
            'id' : dados_doc['id_documento'],
            'numero_documento' : dados_doc['documento_formatado'],
            'numero_processo' : dados_doc['procedimento_formatado'],
            'tipo_doc' : parse_tipo_doc(dados_doc['serie']),
            'link_acesso' : dados_doc['link_acesso'],
            'data_criacao' : dados_doc['data'],
            'nome' : dados_doc['nome_arvore']
        }

    return parsed


def parse_assinatura_documento(assinatura:dict)->dict:
    
    parsed = {
        'usuario' : {
            'id' : assinatura['id_usuario'],
            'nome' : assinatura['nome'],
            'rf' : assinatura['sigla']
        },
        'cargo_funcao' : assinatura['cargo_funcao'],
        'data' : assinatura['data_hora'],

    }

    return parsed

def parse_relatorio_documento(dados_doc:dict)->dict:

    dados = parse_resumo_documento(dados_doc)
    parsed = {
        'descricao' : dados_doc['descricao'],
        'unidade_elaborado' : parser_unidade(dados_doc['unidade_elaboradora']),
        'usuario_elaborou' : dados_doc['andamento_geracao']['usuario'],
        'assinaturas' : [parse_assinatura_documento(assin) 
                         for assin in dados_doc['assinaturas']]
    }

    dados.update(parsed)

    return dados

