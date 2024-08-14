from core.soap import SEIClient
from core.utils.data import snake_case_dict
from core.utils.string import match_erro_processo_nao_encontrado
from core.exceptions.processo import ProcessoNaoEncontrado
from zeep.exceptions import Fault

def set_client(func):

    client = SEIClient()
    def wraped(*args, **kwargs):
        
        return func(client, *args, **kwargs)

    return wraped


def processo_nao_encontrado(func):

    def wraped(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Fault as error:
            error_msg = str(error)
            proc = match_erro_processo_nao_encontrado(error_msg)
            if proc is not None:
                raise ProcessoNaoEncontrado(404, detail=f'Processo {proc} não encontrado.')
            else:
                raise RuntimeError(f'Erro na resposta: {error_msg}')
        
    return wraped