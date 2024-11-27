from requests import Session, Response

from core.decorators.response_parsing import json_decode_error_handling
from .query_builder import QueryBuilder



class AzureMapsAdress:
    '''Classe que implementa busca por endereços usando a API do AzureMaps.
    city: str -> parametro que define a cidade limite da pesquisa;
    state: str -> parametro que define o Estado limite da pesquisa;
    country_iso: str -> parametro que define o país limite da pesquisa
    tem que estar no formato ISO https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2;
    '''

    host = 'atlas.microsoft.com'
    endpoint = 'search/address/structured/json'

    def __init__(self, city:str, state:str, country_iso:str, token:str, **kwargs)->None:

        
        self.build_query = QueryBuilder(city, state, country_iso, 
                                        token, **kwargs)

        self.session = Session()
        self.add_language_headers()

        self.base_url = self.build_base_url()    
        
    def build_base_url(self)->str:

        return f'https://{self.host}/{self.endpoint}'
        
    
    def add_language_headers(self):
        
        #tem que colocar esse header se nao ele muda a language da
        #resposta da API com base no reverse location search do IP
        #o que faria o codigo quebrar

        self.session.headers.update({'Accept-Language' : 'en-US'})

    @json_decode_error_handling
    def address_request(self, address:str)->dict:

        query = self.build_query(address)
        url = self.base_url+'?'+query
        print('Searching Azure Maps: ', url)
        with self.session.get(url) as r:
            return r

    def __call__(self, address:str)->dict:

        return self.address_request(address)