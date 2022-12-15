import requests
import warnings
from requests.exceptions import HTTPError
from requests import Response

#domain = 'https://gatewayapi.prodam.sp.gov.br:443/financas/orcamento/sof/'
#version = 'v3.0.1'


class Client:
    '''Restfull API Client.
    Responses must be JSONS.'''

    
    def __init__(self, base_url:str):

        self.base_url = base_url
    
    def __build_query_string(self, **params: dict)->str:

        if params:
            query_params = [f'{key}={val}' for key, val in params.items()]

            return '?' + '&'.join(query_params)
        
        return ''

    def __build_url(self, endpoint:str, **query_params:dict)->str:


        endpoint = self.base_url + endpoint
        query_string = self.__build_query_string(**query_params)

        return  endpoint + query_string

    def __assert_200_code(self, resp:Response)->dict:

        code = resp.status_code
        if code!=200:
            raise HTTPError(f'Erro na requisição: {code}. {resp.text}')

    def __assert_200_or_201_code(self, resp:Response)->dict:
        
        accept = {200, 201}
        code = resp.status_code
        if code not in accept:
            raise HTTPError(f'Erro na requisição: {code}. {resp.text}')

    def get(self, endpoint:str, headers:dict=None, **query_params:dict)->dict:

        url = self.__build_url(endpoint, **query_params)
        print(f'Get request por url: {url}')
        with requests.get(url, headers=headers) as resp:
            self.__assert_200_code(resp)
            print('Response obtained')
            return resp.json()

    def post(self, endpoint:str, data:dict=None, headers:dict=None,
            **query_params:dict)->dict:

        url = self.__build_url(endpoint, **query_params)
        print(f'Post request por url: {url}')
        with requests.post(url, data=data, headers=headers) as resp:
            self.__assert_200_or_201_code(resp)
            print('Response obtained')
            return resp.json()

    def put(self):

        raise NotImplementedError("Método put não implementado")

    def delete(self):

        raise NotImplementedError("Método delete não implementado")
