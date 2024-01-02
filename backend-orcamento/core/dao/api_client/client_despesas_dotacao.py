from .sof_client import SofClient
from core.utils.utils_dotacao import ParserDotacao

class Client(SofClient):
    '''Busca as despesas mas requer o preenchimento da dotação completa'''

    def __init__(self, auth_token:str)->None:

        super(Client, self).__init__(auth_token)
        self.parse_dotacao = ParserDotacao()

    def __call__(self, ano:int, mes:int, dotacao:str,
                    num_pag:int=1)->dict:

        endpoint = 'despesas'

        params = self.parse_dotacao(dotacao)
        params['anoDotacao'] = ano
        params['mesDotacao'] = mes
        params['numPagina'] = num_pag


        return self.get(endpoint, **params)