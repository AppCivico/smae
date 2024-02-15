from core.integrations import geosampa
from core.utils.geo import convert_points_to_sirgas
from .parsers.geosampa_geojson import GeosampaGeoJsonParser
from .convert_to_wgs_84 import WGS84_conversor

class GeoSampaQuery:

    def __init__(self):

        self.geosampa = geosampa
        self.parse_geojson = GeosampaGeoJsonParser()
        self.convert_wgs_84 = WGS84_conversor()
    
    def geosampa_layer_query(self, point_geojson:dict, layer_name:str)->dict:

        x, y = convert_points_to_sirgas(point_geojson)

        return self.geosampa.point_within_pol(layer_name, x, y)
    
    def query_camada(self, endereco_feature:dict, camada_nome:str, convert_to_wgs_84:bool)->dict:

        layer_data = self.geosampa_layer_query(endereco_feature, camada_nome)
        geojson_data = self.parse_geojson(layer_data)
        if convert_to_wgs_84:
            geojson_data = self.convert_wgs_84(geojson_data, retrieve_geometry_name=True)

        return geojson_data

    def query_camadas(self, endereco_feature:dict, convert_to_wgs_84:bool, **camadas)->dict:
        '''endereco_feature must be a point geojson'''

        camadas_geosampa = dict()
        if camadas:
            for camada_alias, camada_nome in camadas.items():
                geojson_data = self.query_camada(endereco_feature, camada_nome, convert_to_wgs_84)
                camadas_geosampa[camada_alias] = geojson_data
                
            return camadas_geosampa
        return {}
    
    def __call__(self, endereco_feature:dict, convert_to_wgs_84:bool, **camadas)->dict:

        return self.query_camadas(endereco_feature, convert_to_wgs_84, **camadas)