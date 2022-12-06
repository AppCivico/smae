from .sof_client import SofClient


class Client(SofClient):


    def __init__(self, auth_token:str)->None:

        super(Client, self).__init__(auth_token)


    def orgaos(self, ano:int, num_pag:int=1)->dict:

        endpoint = 'orgaos'
        params = {
            'anoExercicio' : ano,
            'numPagina' : num_pag
            }

        return self.get(endpoint, **params)


    def unidades(self, ano:int, cod_orgao: str)->dict:

        endpoint = 'unidades'
        params = {
            'anoExercicio' : ano,
            'codOrgao' : cod_orgao,
            }

        return self.get(endpoint, **params)


    def funcoes(self, ano:int)->dict:

        endpoint = 'funcoes'
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)
    
    
    def subfuncoes(self, ano:int)->dict:

        endpoint = 'subFuncoes'
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)

    
    def programas(self, ano:int)->dict:

        endpoint = 'programas'
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)

    def projetos_atividades(self, ano:int)->dict:

        endpoint = 'projetosAtividades'
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)

    def categorias(self, ano:int)->dict:

        endpoint = 'categorias'
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)

    def grupos(self, ano:int)->dict:

        endpoint = 'grupos'
        #pode filtrar pela categoria posteriormente
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)

    def modalidades(self, ano:int)->dict:

        endpoint = 'modalidades'
        #pode filtrar pela categoria posteriormente
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)

    def elementos(self, ano:int)->dict:

        endpoint = 'elementos'
        #pode filtrar por varios itens como categoria etc.
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)

    def fonte_recursos(self, ano:int)->dict:

        endpoint = 'fonteRecursos'
        #pode filtrar por varios itens como categoria etc.
        params = {
            'anoExercicio' : ano,
            }

        return self.get(endpoint, **params)


    def __call__(self, endpoint_name:str, ano:str,*_, **kwargs)->dict:

        try:
            get_func = getattr(self, endpoint_name)
        except AttributeError:
            raise ValueError(f'invalid endpoint_name: {endpoint_name}')

        return get_func(ano=ano, **kwargs)



    

    

    