from core.integrations import geosampa
from core.utils.geo import convert_points_to_sirgas
from .parsers.geosampa_geojson import GeosampaGeoJsonParser

class GeoSampaQuery:

    def __init__(self):

        self.geosampa = geosampa
        self.parse_geojson = GeosampaGeoJsonParser()
    
    def geosampa_layer_query(self, point_geojson:dict, layer_name:str)->dict:

        x, y = convert_points_to_sirgas(point_geojson)

        return self.geosampa.point_within_pol(layer_name, x, y)

    def query_camadas(self, endereco_feature:dict, **camadas)->dict:
        '''endereco_feature must be a point geojson'''

        camadas_geosampa = dict()
        if camadas:
            for camada_alias, camada_nome in camadas.items():
                layer_data = self.geosampa_layer_query(endereco_feature, camada_nome)
                camadas_geosampa[camada_alias] = self.parse_geojson(layer_data)
                
            return camadas_geosampa
        return {}
    
    def __call__(self, endereco_feature:dict, **camadas)->dict:

        return self.query_camadas(endereco_feature, **camadas)