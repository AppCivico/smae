from requests import Session, Response

from .reverse_query_builder import ReverseQueryBuilder

from core.decorators.response_parsing import json_decode_error_handling


class ReverseGeocoding:

    host = 'nominatim.openstreetmap.org'
    endpoint = 'reverse'

    def __init__(self, contact_email:str):

        self.base_url = self.build_base_url(self.host, self.endpoint)
        self.session = Session()
        self.build_query = ReverseQueryBuilder(contact_email)
        self.add_language_headers()

    def build_base_url(self, host:str, endpoint:str)->str:

        return f'https://{host}/{endpoint}'
    
    def add_language_headers(self):
        
        #tem que colocar esse header se nao ele muda a language da
        #resposta da API com base no reverse location search do IP
        #o que faria o codigo quebrar

        self.session.headers.update({'Accept-Language' : 'en-US'})
    

    @json_decode_error_handling
    def reverse_geocode_request(self, x:float, y:float)->dict:

        query = self.build_query(x, y)
        url = self.base_url+'?'+query
        print('Searching nominatim reverse geocode: ', url)
        with self.session.get(url) as r:
            return r
        
    def __call__(self, x:float, y:float)->dict:

        return self.reverse_geocode_request(x, y)