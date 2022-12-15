from .sof_client import SofClient


class Client(SofClient):


    def __init__(self, auth_token:str)->None:

        super(Client, self).__init__(auth_token)

    #se call vira router se houver outros metodos depois
    def __call__(self, ano:int, mes:int, orgao:int, unidade: int,
                    proj_atividade: int, fonte: str, num_pag:int=1)->dict:

        endpoint = 'despesas'
        params = {
            'anoDotacao' : ano,
            'mesDotacao' : mes,
            'codOrgao' : orgao,
            'codUnidade' : unidade,
            'codProjetoAtividade' : proj_atividade,
            'codFonteRecurso' : fonte,
            'numPagina' : num_pag}

        return self.get(endpoint, **params)