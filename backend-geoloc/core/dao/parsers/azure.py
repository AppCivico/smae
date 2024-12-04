from .handlers import attr_not_found
from core.exceptions import AtributeNotFound
from core.utils.geo import geojson_envelop, build_bbox_viewport, build_geom_from_points

from typing import List

class AddressParser:

    @attr_not_found('address')
    def get_address(self, feature:dict)->dict:

        return feature['address']

    @attr_not_found('cidade')
    def get_city(self, address:dict)->str:

        return address['municipality']

    @attr_not_found('state')
    def get_state(self, address:dict)->str:

        return address['countrySubdivisionName']

    @attr_not_found('country')
    def get_country(self, address:dict)->str:

        return address['country']

    @attr_not_found('country_code')
    def get_country_code(self, address:dict)->str:

        return address['countryCode']

    def get_road(self, address:dict)->str:

        return address.get('streetName')

    def get_number(self, address:dict)->str:

        return address.get('streetNumber', None)

    @attr_not_found('geometry')
    def get_geom(self, feature:dict)->dict:

        position = feature['position']
        if type(position) is str:
            position_split = position.split(',')
            position = {'lat' : float(position_split[0]), 'lon' :float(position_split[1])}
        geom = build_geom_from_points(position)

        return geom

    def build_viewport_from_weird_bbox(self, weird_bbox:dict)->dict:

        
        y_max = weird_bbox['northEast'].split(',')[0]
        y_min = weird_bbox['southWest'].split(',')[0]
        x_max = weird_bbox['southWest'].split(',')[1]
        x_min = weird_bbox['northEast'].split(',')[1]

        viewport = {}
        viewport['topLeftPoint'] = {'lat' : y_max,
                                    'lon' : x_min}
        viewport['btmRightPoint'] = {'lat' : y_min,
                                    'lon' : x_max}
        
        return viewport

    @attr_not_found('bbox')
    def get_bbox(self, feature:dict)->dict:
        
        viewport = feature.get('viewport')
        if viewport is None:
            #no caso do reverse geocode vem uma bbox estranha que é um viewport na verdade
            viewport = self.build_viewport_from_weird_bbox(feature['address']['boundingBox'])

        return build_bbox_viewport(viewport)


    @attr_not_found('tipo_endereco')
    def get_osm_type(self, feature:dict)->str:

        return feature.get('type') or feature['matchType']
    

    def get_cep(self, address:dict)->str:

        # a informação do cep não vem sempre no Azure não dá para obrigar
        # vai restringir muito os resultados
        cep = address.get('extendedPostalCode')

        return cep
    
    def get_bairro(self, address:dict)->str:
        
        #bairro não é obrigatório
        bairro = address.get('neighbourhood', '')

        return bairro

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

    def parse_address(self, feature:dict)->dict:

        resp_address = self.get_address(feature)

        parsed_addres = {
            'rua' : self.get_road(resp_address),
            'cidade' : self.get_city(resp_address),
            'estado' : self.get_state(resp_address),
            'pais' : self.get_country(resp_address),
            'codigo_pais' : self.get_country_code(resp_address),
            'cep' : self.get_cep(resp_address),
            'bairro' : self.get_bairro(resp_address)
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

        results = resp.get('results')
        if not results:
            resp['results'] = resp['addresses']

        return resp['results']


    def parse_all_features(self, resp:dict)->List[dict]:

        features = self.get_features(resp)

        #a API da Azure devolve municipios inteiros, regioes etc.
        #entao precisa fazer um filtro, porque é comum vir com outros atributos
        parsed_results = []
        for feat in features:
            try:
                parsed = self.build_feat_geojson(feat)
                parsed_results.append(parsed)
            except AtributeNotFound as e:
                print(f'Feature fora do padrão: {feat}')
                print(str(e))

        return parsed_results

    def __call__(self, resp:dict)->List[dict]:

        parsed_features = self.parse_all_features(resp)
        print(parsed_features)
        return geojson_envelop(parsed_features, epsg_num=4326)