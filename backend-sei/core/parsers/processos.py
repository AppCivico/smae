from core.utils.string import camel_to_snake_case
from .basic import parser_unidade
from typing import Union

def parse_resumo_processo(dados_processo:dict)->dict:

    parsed = {
    'numero_processo' : dados_processo['procedimento_formatado'],
    'especificacao' : dados_processo['especificacao'],
    'tipo' : dados_processo['tipo_procedimento']['nome'],
    'data_autuacao' : dados_processo['data_autuacao'],
    'link' : dados_processo['link_acesso'],
    'assuntos' : [{'codigo' : assunto['codigo_estruturado'], 'descricao' : assunto['descricao']}
                  for assunto in dados_processo['assuntos']]
    }

    return parsed

def parse_unidade_andamento(andamento:dict)->dict:

    dados_unidade = andamento['unidade']
    unidade = {camel_to_snake_case(key) : value 
              for key, value in dados_unidade.items()}
    
    parsed = parser_unidade(unidade)

    return parsed

def parse_usuario_andamento(andamento:dict)->str:

    user = andamento['usuario']
    parsed = {
            'id' : user['id_usuario'],
            'nome' : user['nome'],
            'rf' : user['sigla']
              }
    
    return parsed

def parse_abertura(dados_processo:dict)->dict:
    
    abertura = dados_processo['andamento_geracao']
    
    parsed = {
        'unidade' : parse_unidade_andamento(abertura),
        'usuario' : parse_usuario_andamento(abertura)
    }
    
    return parsed

def parse_ultimo_andamento(dados_processo:dict)->dict:

    andamento = dados_processo['ultimo_andamento']
    parsed = {
        'unidade' : parse_unidade_andamento(andamento),
        'usuario' : parse_usuario_andamento(andamento),
        'data' : andamento['data_hora'],
        'descricao' : andamento['descricao']
    }

    return parsed

def parse_conclusao(dados_processo:dict)->Union[dict, None]:

    conclusao = dados_processo['andamento_conclusao']
    if conclusao['id_andamento'] is None:
        return None
    
    #se nao estiver vazio, parseia igual o ultimo andamento
    parsed = parse_ultimo_andamento(conclusao)

    return parsed

def parse_usuario_atribuido(unidade:dict)->str:

    user = unidade['usuario_atribuicao']
    if user['id_usuario'] is None:
        return None
    parsed = {
        'nome' : user['nome'],
        'rf' : user['sigla']
    } 

    return parsed

def parse_unidades_aberto(dados_processo:dict)->dict:

    parsed_all = []
    for unidade in dados_processo['unidades_procedimento_aberto']:
        parsed_unidade = {
            'unidade' : parse_unidade_andamento(unidade),
            'usuario_atribuido' : parse_usuario_atribuido(unidade)
        }

        parsed_all.append(parsed_unidade)

    return parsed_all

def parse_relatorio_processo(dados_processo:dict)->dict:

    resumo = parse_resumo_processo(dados_processo)

    demais_atributos = {
        'abertura' : parse_abertura(dados_processo),
        'ultimo_andamento' : parse_ultimo_andamento(dados_processo),
        'conclusao' : parse_conclusao(dados_processo),
        'unidades_aberto' : parse_unidades_aberto(dados_processo)
    }

    resumo.update(demais_atributos)

    return resumo
