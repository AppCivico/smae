from typing import Literal, Optional


DOMAIN ='www.gov.br'

BASE_URL='transferegov/pt-br/comunicados/'

MAPPER_ENDPOINTS = {
    'gerais' : 'comunicados-gerais',
    'cronogramas' : {
        'base' : 'cronogramas-de-emendas-parlamentares/',
        'individuais' :'cronograma-emendas-individuais-rp6-finalidade-definida',
        'especiais' :'cronograma-emendas-individuais-rp6-transferencias-especiais',
        'bancada' : 'cronograma-emendas-de-bancada-rp7'
    }
}


TIPOS_EMENDAS = Literal['individuais', 'especiais', 'bancada']

class UrlBuilder:

    def __init__(self, https:bool=True)->None:

        self.base_url = self.__build_base_url(https)

    def __build_base_url(self, https:bool=True)->str:

        protocol = 'https://' if https else 'http://'
        
        base_url = protocol + DOMAIN + '/' + BASE_URL

        return base_url
    
    def __check_tipos_emendas(self, tipo_emenda:TIPOS_EMENDAS):

        tipos_aceitos = {'individuais', 'especiais', 'bancada'}
        if tipo_emenda is not None and tipo_emenda not in tipos_aceitos:
            raise ValueError(f'tipo_emenda must be in {tipos_aceitos}')

    def __build_endpoint(self, *args, gerais:bool, tipo_emenda:Optional[TIPOS_EMENDAS]=None)->str:
        
        
        if gerais:
            return self.base_url + MAPPER_ENDPOINTS['gerais']
        
        if not gerais and tipo_emenda is None:
            raise ValueError('Se não buscar comunicados gerais deve definir tipo emenda')
        
        self.__check_tipos_emendas(tipo_emenda)
        base_url= self.base_url + MAPPER_ENDPOINTS['cronogramas']['base']
        
        return base_url + MAPPER_ENDPOINTS['cronogramas'][tipo_emenda]

    def __build_url(self, *args, gerais:bool, ano:int, tipo_emenda:Optional[TIPOS_EMENDAS]=None, )->str:
        
        endpoint = self.__build_endpoint(gerais=gerais, tipo_emenda=tipo_emenda)

        #neste caso não tem ano
        if not gerais and tipo_emenda == 'especiais':
            return endpoint
        
        return endpoint + f'/{ano}'

    
    def __call__(self, gerais:bool, ano:int, tipo_emenda:Optional[TIPOS_EMENDAS]=None)->str:
        
        return self.__build_url(gerais=gerais, ano=ano, tipo_emenda=tipo_emenda)