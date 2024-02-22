from requests import Session, Response

from core.decorators.response_parsing import json_decode_error_handling
from .query_builder import QueryBuilder



class Nominatim:
    '''Classe que implementa busca por endereços usando a API do nominatim.
    city: str -> parametro que define a cidade limite da pesquisa;
    state: str -> parametro que define o Estado limite da pesquisa;
    country_iso: str -> parametro que define o país limite da pesquisa
    tem que estar no formato ISO https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2;
    bbox_bound: dict{x_min, x_max, y_min, y_max} -> parametro que define o bound box limite da pesquisa;
    '''

    host = 'nominatim.openstreetmap.org'
    endpoint = 'search'

    def __init__(self, city:str, state:str, country_iso:str, contact_email:str, bbox_bound:dict=None)->None:


        self.build_query = QueryBuilder(city, state, country_iso,
                                        contact_email, bbox_bound)

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
        print('Searching nominatim: ', url)
        with self.session.get(url) as r:
            return r

    def __call__(self, address:str)->dict:

        return self.address_request(address)