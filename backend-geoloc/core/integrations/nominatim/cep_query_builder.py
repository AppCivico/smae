from core.utils.misc import check_cep

class CepQueryBuilder:

    def __init__(self, city:str, state:str, country_iso:str, 
                contact_email:str, bbox_bound:dict=None)->None:

        self.check_country_iso(country_iso)
        self.country = country_iso
        self.state = state
        self.city = city
        if bbox_bound is not None:
            self.bbox = self.build_bbox(bbox_bound)
        else:
            self.bbox = None

        self.email = contact_email

    def check_country_iso(self, country_iso:str)->None:

        num_chars = len(country_iso)
        if num_chars!=2:
            raise ValueError('Contry ISO must be ISO_3166 compliant. Must be only two characters!')

    def build_bbox(self, *, x_min:str, x_max:str, y_min:str, y_max:str)->str:

        return f'{x_min},{y_min},{x_max},{y_max}'

    def set_format_param(self, query:dict)->None:

        query['format'] = 'geojson'

    def set_accept_language_param(self, query:dict)->None:

        #soh para garantir vou colocar nos parametros tambem
        query['accept-language'] = 'en-US'

    def set_bbox_param(self, query:dict)->None:

        if self.bbox:
            query['bounded'] = 1
            query['viewbox'] = self.bbox
        else:
            query['bounded'] = 0

    def set_email_param(self, query:dict)->None:

        query['email'] = self.email

    def set_address_layer_param(self, query:dict)->None:

        #esse parametro diz que estamos buscando endereços e não pontos de interesse
        query['layer'] = 'address'

    def set_address_details_param(self, query:dict)->None:

        #esse parametro faz retornar os detalhes do endereco encontrado - importante para checagem
        query['addressdetails'] = 1

    def set_city(self, query:dict)->None:

        query['city'] = self.city

    def set_state(self, query:dict)->None:

        query['state'] = self.state

    def set_country(self, query:dict)->None:

        query['country'] = self.country

    def set_config_params(self, query:dict)->None:

        self.set_address_layer_param(query)
        self.set_format_param(query)
        self.set_accept_language_param(query)
        self.set_email_param(query)
        self.set_address_details_param(query)
    
    def set_search_boundaries(self, query:dict)->None:

        self.set_city(query)
        self.set_state(query)
        self.set_country(query)
        self.set_bbox_param(query)


    def search_cep(self, query:dict, cep:str)->None:

        #apenas o numero do cep o resto vai pre definido
        check_cep(cep)
        query['postalcode'] = cep

    def build_query_str(self, query:dict)->str:

        search_pairs = [f'{key}={val}' for key, val in query.items()]

        return '&'.join(search_pairs)

    def build_full_query(self, address:str)->dict:

        query = dict()
        self.search_cep(query, address)
        self.set_search_boundaries(query)
        self.set_config_params(query)

        return self.build_query_str(query)

    def __call__(self, cep:str)->str:
        '''CEP as str in format \d{5}-\d{3}'''

        return self.build_full_query(cep)