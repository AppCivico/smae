
import warnings
import re
from typing import Optional
from core.utils.misc import url_encode

class QueryBuilder:

    version = '1.0'

    def __init__(self, city:str, state:str, country_iso:str, 
                token:str, only_cep:bool=False, **kwargs)->None:
        

        self.check_country_iso(country_iso)
        self.country = country_iso
        self.state = state
        self.city = city
        self.token = token

        self.only_cep = only_cep

        if kwargs.get('bbox_bound') or kwargs.get('bbox'):
            warnings.warn('Azure Maps não suporta bounding box na resposta')

    def check_country_iso(self, country_iso:str)->None:

        num_chars = len(country_iso)
        if num_chars!=2:
            raise ValueError('Contry ISO must be ISO_3166 compliant. Must be only two characters!')
        

    def set_accept_language_param(self, query:dict)->None:

        #soh para garantir vou colocar nos parametros tambem
        query['language'] = 'en-US'


    def set_token(self, query:dict)->None:

        query['subscription-key'] = self.token

    def set_version(self, query:dict)->None:

        query['api-version'] = self.version

    def set_city(self, query:dict)->None:

        query['municipality'] = self.city

    def set_state(self, query:dict)->None:

        query['countrySecondarySubdivision'] = self.state

    def set_country(self, query:dict)->None:

        query['countryCode'] = self.country

    def set_config_params(self, query:dict)->None:

        self.set_version(query)
        self.set_accept_language_param(query)
        self.set_token(query)
    
    def set_search_boundaries(self, query:dict)->None:

        self.set_city(query)
        self.set_state(query)
        self.set_country(query)


    def set_street(self, query:dict, street:str)->None:

        #rua e numero apenas o resto vai ser pre definido
        query['streetName'] = street

    def set_street_number(self, query:dict, number:str)->None:

        #rua e numero apenas o resto vai ser pre definido
        query['streetNumber'] = number


    def set_cep(self, query:dict, cep:str)->None:

        query['postalCode'] = cep


    def build_query_str(self, query:dict)->str:

        search_pairs = [f'{key}={val}' for key, val in query.items()]

        return '&'.join(search_pairs)

    def get_street_number(self, address:str)->str:

        #esse regex vai pegar o numero e o que tem logo em volta dele
        regex_pat = r'((,|;|nº)*\s*)\d+(\s|\w|,|;)'

        num_search = re.search(regex_pat, address, flags=re.IGNORECASE)
        if num_search:
            num_search = num_search.group()
            num = ''.join(char for char in num_search if char.isdigit())
            return num
        
        return ''
    
    def find_index_street_name(self, address:str)->int:

        street_num = self.get_street_number(address)
        if street_num:
            return address.find(street_num)
        
        primeira_virgula = re.search(r'(,|;)', address)
        if primeira_virgula:
            primeira_virgula=primeira_virgula.group()
            return address.find(primeira_virgula)
        
        sao_paulo = re.search(r's.o paulo', address, re.IGNORECASE)
        if sao_paulo:
            sao_paulo = sao_paulo.group()
            return address.find(sao_paulo)
        
        #se nao tem nada disso, o endereço é só o nome da rua
        return len(address)+1
        
    
    def get_street_name(self, address:str)->str:

        end_index = self.find_index_street_name(address)
        street_name = address[:end_index]
        street_name = re.sub(r'[^\w0-9\s-]', '', street_name)

        street_name = street_name.strip()

        return street_name
    
    def set_search_params(self, query:dict, address:str, cep:str)->None:

        if address:
            street = self.get_street_name(address)
            number = self.get_street_number(address)
            self.set_street(query, street)
            self.set_street_number(query, number)
        if cep:
            cep  = self.set_cep(query, cep)
    
    def url_encod_params(self, query:dict)->None:

        for key, value in query.items():
            query[key] = url_encode(query[key])

    def build_full_query(self, address:str, cep:str)->str:

        query = dict()
        self.set_search_params(query, address, cep)
        self.set_search_boundaries(query)

        #must run before seting config otherwise screws with token
        self.url_encod_params(query)

        self.set_config_params(query)

        return self.build_query_str(query)
    
    def solve_adress_parameter(self, address:str)->str:

        #only cep overrides address parameter
        if self.only_cep:
            address = None
        
        return address


    def __call__(self, address:Optional[str]=None, cep:Optional[str]=None)->str:
        '''Address is considered just street number and name. Rest is pre-defined. 
        Street number and name are extracted from string'''

        address = self.solve_adress_parameter(address)

        if address is None and cep is None:
            raise ValueError("Either address or cep must be defined")

        query_str = self.build_full_query(address, cep)
        return query_str