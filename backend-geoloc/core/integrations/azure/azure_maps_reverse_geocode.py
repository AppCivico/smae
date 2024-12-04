from requests import Session, Response

from core.decorators.response_parsing import json_decode_error_handling
from .query_builder import QueryBuilder

class AzureMapsReverse:
    '''Classe que implementa geocodificação reversa usabndo a API do AzureMaps.
    x : latitude em float,
    y : longitude em float.

    Devem estar codificados em WFS84.
    '''

    host = 'atlas.microsoft.com'
    endpoint = 'search/address/reverse/json'

    def __init__(self, token:str)->None:

        
        self.session = Session()
        self.add_language_headers()

        self.base_url = self.build_base_url()
        self.token = token
        
    def build_base_url(self)->str:

        return f'https://{self.host}/{self.endpoint}'
        
    
    def add_language_headers(self):
        
        #tem que colocar esse header se nao ele muda a language da
        #resposta da API com base no reverse location search do IP
        #o que faria o codigo quebrar

        self.session.headers.update({'Accept-Language' : 'en-US'})


    def set_token(self, query:dict)->None:

        query['subscription-key'] = self.token


    def config_query(self, query:dict)->None:

        config_params = {
            'returnMatchType' : True,
            'returnRoadUse' : False,
            'returnSpeedLimit' : False,
            'language' : 'en-US',
            'api-version' : '1.0'
        }

        query.update(config_params)
        self.set_token(query)

    def lat_lon_query(self, query:dict, x:float, y:float)->dict:

        query['query'] = f'{y},{x}'

    def build_query_str(self, query:dict)->str:

        search_pairs = [f'{key}={val}' for key, val in query.items()]

        return '&'.join(search_pairs)

    def build_query(self, x:float, y:float)->str:

        query = {}

        self.config_query(query)
        self.lat_lon_query(query, x, y)

        query_str = self.build_query_str(query)

        return query_str

    @json_decode_error_handling
    def reverse_request(self, x:float, y:float)->dict:

        query = self.build_query(x, y)
        url = self.base_url+'?'+query 
        print('Searching Azure Maps Reverse Geocode: ', url)
        with self.session.get(url) as r:
            return r

    def __call__(self, x:float, y:float)->dict:

        return self.reverse_request(x, y)