from .decorators import set_client, processo_nao_encontrado
from zeep.exceptions import Fault

@processo_nao_encontrado
@set_client
def get_link_processo(client, num_proc:str)->str:

    dados_proc = client('consultar_procedimento', 
                        id_unidade='', 
                        protocolo_procedimento=num_proc, 
                        sin_retornar_assuntos='N', 
                        sin_retornar_interessados='N',
                        sin_retornar_observacoes ='N', 
                        sin_retornar_andamento_geracao='N', 
                        sin_retornar_andamento_conclusao='N', 
                        sin_retornar_ultimo_andamento='N',
                        sin_retornar_unidades_procedimento_aberto='N', 
                        sin_retornar_procedimentos_relacionados='N', 
                        sin_retornar_procedimentos_anexados='N', 
                        array_return=False
                        )
    
    return dados_proc['link_acesso']


@processo_nao_encontrado
@set_client
def get_resumo_processo(client, num_proc:str)->dict:

    dados_proc = client('consultar_procedimento', 
                        id_unidade='', 
                        protocolo_procedimento=num_proc, 
                        sin_retornar_assuntos='S', 
                        sin_retornar_interessados='N',
                        sin_retornar_observacoes ='N', 
                        sin_retornar_andamento_geracao='N', 
                        sin_retornar_andamento_conclusao='N', 
                        sin_retornar_ultimo_andamento='N',
                        sin_retornar_unidades_procedimento_aberto='N', 
                        sin_retornar_procedimentos_relacionados='N', 
                        sin_retornar_procedimentos_anexados='N', 
                        array_return=False
                        )
    
    return dados_proc


@processo_nao_encontrado
@set_client
def get_relatorio_processo(client, num_proc:str)->dict:

    dados_proc = client('consultar_procedimento', 
                        id_unidade='', 
                        protocolo_procedimento=num_proc, 
                        sin_retornar_assuntos='S', 
                        sin_retornar_interessados='S',
                        sin_retornar_observacoes ='S', 
                        sin_retornar_andamento_geracao='S', 
                        sin_retornar_andamento_conclusao='S', 
                        sin_retornar_ultimo_andamento='S',
                        sin_retornar_unidades_procedimento_aberto='S', 
                        sin_retornar_procedimentos_relacionados='S', 
                        sin_retornar_procedimentos_anexados='S', 
                        array_return=False
                        )
    
    return dados_proc