from .sof_client import SofClient

from typing import Union

class Client(SofClient):


    def __init__(self, auth_token:str)->None:

        super(Client, self).__init__(auth_token)

    def __solve_unidade(self, params:dict, unidade:Union[int, None]):

        if unidade is not None:
            params['codUnidade'] = unidade

    #se call vira router se houver outros metodos depois
    def __call__(self, ano:int, mes:int, orgao:int, unidade: Union[int, None],
                    proj_atividade: int, fonte: str, num_pag:int=1)->dict:

        endpoint = 'despesas'
        params = {
            'anoDotacao' : ano,
            'mesDotacao' : mes,
            'codOrgao' : orgao,
            'codProjetoAtividade' : proj_atividade,
            'codFonteRecurso' : fonte,
            'numPagina' : num_pag}

        self.__solve_unidade(params, unidade)

        return self.get(endpoint, **params)