from .handlers import attr_not_found
from core.exceptions import AtributeNotFound
from core.utils.geo import geojson_envelop

from typing import List

class AddressParser:
      
    @attr_not_found('address')
    def get_address(self, feature:dict)->dict:

        if 'properties' in feature:

            return feature['properties']['address']
        
        #no caso de ser flat o address é um atributo direto
        return feature['address']

    @attr_not_found('cidade')
    def get_city(self, address:dict)->str:

        cidade = address.get('city') or address.get('town') or address.get('municipality')
        if cidade is None:
            raise AtributeNotFound(f'Atributo não encontrado: cidade: {address}' )

        return cidade
    
    def get_bairro(self, address:dict)->str:

        bairro = address.get('city_district') or address.get('suburb')
        
        return bairro

    @attr_not_found('state')
    def get_state(self, address:dict)->str:

        return address['state']

    @attr_not_found('country')
    def get_country(self, address:dict)->str:

        return address['country']

    @attr_not_found('country_code')
    def get_country_code(self, address:dict)->str:

        return address['country_code']

    def get_road(self, address:dict)->str:

        rua = address.get('road')
        return rua
        
            
    def get_number(self, address:dict)->str:

        return address.get('house_number', None)
    
    def build_geometry_from_lon_lat(self, lon:float, lat:float)->dict:

        return {'type' : 'Point', 'coordinates' : [lon, lat]}

    @attr_not_found('geometry')
    def get_geom(self, feature:dict)->dict:


        geom = feature.get('geometry')

        if geom is None:
            feature['geometry'] = self.build_geometry_from_lon_lat(1, 2)

        return feature['geometry']
            
        

    @attr_not_found('bbox')
    def get_bbox(self, feature:dict)->dict:

        return feature.get('bbox') or feature.get('boundingbox')

    @attr_not_found('tipo_endereco')
    def get_osm_type(self, feature:dict)->dict:

        #tenta pegar properties, se nao tiver, devolve o feature mesmo
        prop = feature.get('properties', feature)
        return prop['osm_type']

    def build_address_string(self, parsed_adress:dict)->str:

        if parsed_adress.get('numero') and parsed_adress['rua']:
            return (f"{parsed_adress['rua']}, nº {parsed_adress['numero']}, "
                    f"{parsed_adress['cidade']}, {parsed_adress['pais']}")
        if not parsed_adress.get('numero') and parsed_adress['rua']:
            return (f"{parsed_adress['rua']}, sem número,"
                    f"{parsed_adress['cidade']}, {parsed_adress['pais']}")
            
        if not parsed_adress['rua'] and parsed_adress['bairro']:
            return f"{parsed_adress['bairro']}, {parsed_adress['cidade']}, {parsed_adress['pais']}"
        
        return f"{parsed_adress['cidade']}, {parsed_adress['pais']}"


    def get_cep(self, feature:dict)->dict:

        cep = feature.get('postcode')
        
        return cep

    def parse_address(self, feature:dict)->dict:

        resp_address = self.get_address(feature)

        parsed_addres = {
            'rua' : self.get_road(resp_address),
            'cidade' : self.get_city(resp_address),
            'bairro' : self.get_bairro(resp_address),
            'estado' : self.get_state(resp_address),
            'pais' : self.get_country(resp_address),
            'codigo_pais' : self.get_country_code(resp_address),
            'cep' : self.get_cep(resp_address)
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
        resp['properties']['osm_type'] = self.get_osm_type(feature)

        return resp

    @attr_not_found('features')
    def get_features(self, resp:dict)->List[dict]:

        return resp['features']


    def parse_all_features(self, resp:dict)->List[dict]:

        features = self.get_features(resp)

        return [self.build_feat_geojson(feat) for feat in features]

    def __call__(self, resp:dict)->List[dict]:

        if 'features' not in resp:
            #envelopa
            resp['features']=[resp]
        
        parsed_features = self.parse_all_features(resp)

        return geojson_envelop(parsed_features, epsg_num=4326)



