from .sof_client import SofClient
from core.utils.utils_dotacao import ParserDotacao


class Client(SofClient):


    def __init__(self, auth_token:str)->None:

        super(Client, self).__init__(auth_token)

        self.parse_dotacao = ParserDotacao()


    def empenhos_processo(self, ano:int, mes:int, proc:int,
                    num_pag:int=1)->dict:

        endpoint = 'empenhos'
        params = {
            'anoEmpenho' : ano,
            'mesEmpenho' : mes,
            'numProcesso' : proc,
            'numPagina' : num_pag}

        return self.get(endpoint, **params)


    def empenhos_nota_empenho(self, ano:int, mes:int, cod_nota:int,
                    num_pag:int=1)->dict:

        endpoint = 'empenhos'
        params = {
            'anoEmpenho' : ano,
            'mesEmpenho' : mes,
            'codEmpenho' : cod_nota,
            'numPagina' : num_pag}

        return self.get(endpoint, **params)


    def empenhos_dotacao(self, ano:int, mes:int, dotacao:str,
                    num_pag:int=1)->dict:

        endpoint = 'empenhos'

        params = self.parse_dotacao(dotacao)
        params['anoEmpenho'] = ano
        params['mesEmpenho'] = mes
        params['numPagina'] = num_pag


        return self.get(endpoint, **params)

    def __check_params(self, dotacao:str=None, processo:str=None,
                nota_empenho:str=None)->None:

        params = (dotacao, processo, nota_empenho)
        checksum= sum(1 for p in params if not p is None)

        if checksum==0:
            raise ValueError('Either dotacao, processo or nota_empenho must be defined.')
        if checksum>1:
            raise ValueError('Only one of dotacao, processo or nota_empenho must be defined.')

    def __call__(self, ano:int, mes:int, *_, dotacao:str=None,
        processo:int=None, nota_empenho: int=None, num_pag:int=1)->dict:

        self.__check_params(dotacao, processo, nota_empenho)

        if dotacao:
            return self.empenhos_dotacao(ano, mes, dotacao, num_pag)
        if processo:
            return self.empenhos_processo(ano, mes, processo, num_pag)
        if nota_empenho:
            return self.empenhos_nota_empenho(ano, mes, nota_empenho, num_pag)
