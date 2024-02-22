from .handlers import attr_not_found
from core.exceptions import AtributeNotFound
from core.utils.geo import geojson_envelop

from typing import List

class AddressParser:

    @attr_not_found('address')
    def get_address(self, feature:dict)->dict:

        return feature['properties']['address']

    @attr_not_found('cidade')
    def get_city(self, address:dict)->str:

        cidade = address.get('city') or address.get('town')
        if cidade is None:
            raise AtributeNotFound(f'Atributo não encontrado: cidade: {address}' )
    

    @attr_not_found('state')
    def get_state(self, address:dict)->str:

        return address['state']
    
    @attr_not_found('country')
    def get_country(self, address:dict)->str:

        return address['country']
    
    @attr_not_found('country_code')
    def get_country_code(self, address:dict)->str:

        return address['country_code']
    
    @attr_not_found('road')
    def get_road(self, address:dict)->str:

        return address['road']
    
    def get_number(self, address:dict)->str:

        return address.get('house_number', None)
    
    @attr_not_found('geometry')
    def get_geom(self, feature:dict)->dict:

        return feature['geometry']
    
    @attr_not_found('bbox')
    def get_bbox(self, feature:dict)->dict:

        return feature['bbox']
    
    @attr_not_found('tipo_endereco')
    def get_osm_type(self, feature_properties:dict)->dict:

        return feature_properties['osm_type']
    
    def build_address_string(self, parsed_adress:dict)->str:

        if parsed_adress.get('numero'):
            addres= (f"{parsed_adress['rua']}, nº {parsed_adress['numero']}, "
                    f"{parsed_adress['cidade']}, {parsed_adress['cidade']}, {parsed_adress['pais']}")
        else:
            addres= (f"{parsed_adress['rua']}, "
                    f"{parsed_adress['cidade']}, {parsed_adress['cidade']}, {parsed_adress['pais']}")
        
        return addres
    
    def parse_address(self, feature:dict)->dict:

        resp_address = self.get_address(feature)

        parsed_addres = {
            'rua' : self.get_road(resp_address),
            'cidade' : self.get_city(resp_address),
            'estado' : self.get_state(resp_address),
            'pais' : self.get_country(resp_address),
            'codigo_pais' : self.get_country_code(resp_address),
        }

        numero = self.get_number(resp_address)
        if numero:
            parsed_addres['numero'] = numero

        parsed_addres['string_endereco'] = self.build_address_string(parsed_addres)

        return parsed_addres
    
    def build_feat_geojson(self, feature:dict)->dict:

        resp = {'type' : 'Feature'}
        resp['properties'] = self.parse_address(feature)
        resp['geometry'] = self.get_geom(feature)
        resp['bbox'] = self.get_bbox(feature)
        #adicionando tipo de endereco às propriedades
        resp['properties']['osm_type'] = self.get_osm_type(feature['properties'])

        return resp
    
    @attr_not_found('features')
    def get_features(self, resp:dict)->List[dict]:

        return resp['features']

    
    def parse_all_features(self, resp:dict)->List[dict]:

        features = self.get_features(resp)

        return [self.build_feat_geojson(feat) for feat in features]

    def __call__(self, resp:dict)->List[dict]:

        parsed_features = self.parse_all_features(resp)

        return geojson_envelop(parsed_features, epsg_num=4326)


    
