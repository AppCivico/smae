from core.integrations import geosampa
from core.utils.geo import convert_points_to_sirgas
from ..parsers.geosampa_geojson import GeosampaGeoJsonParser
from ..parsers.convert_to_wgs_84 import WGS84_conversor
from ..camadas_search import DetailCamada

from core.schemas.camadas import CamadaParamInternal

class GeoSampaAdressQuery:

    def __init__(self):

        self.geosampa = geosampa
        self.parse_geojson = GeosampaGeoJsonParser()
        self.convert_wgs_84 = WGS84_conversor()
        self.detalhar_camada = DetailCamada()
    
    def geosampa_layer_query(self, point_geojson:dict, layer_name:str, geom_col:str, precision:float=None)->dict:

        x, y = convert_points_to_sirgas(point_geojson)

        return self.geosampa.point_within_dist(layer_name, x, y, geom_col, precision)
    
    def query_camada(self, endereco_feature:dict, camada_data:dict, convert_to_wgs_84:bool)->dict:

        layer_data = self.geosampa_layer_query(endereco_feature, camada_data.layer_name, camada_data.geom_col, camada_data.distance)
        geojson_data = self.parse_geojson(layer_data)
        if convert_to_wgs_84 and geojson_data['features']:
            geojson_data = self.convert_wgs_84(geojson_data, retrieve_geometry_name=True)

        return geojson_data
    
    def set_geom_col(self, camada_data)->None:

        detalhes_camada = self.detalhar_camada(camada_data.layer_name)
        camada_data = camada_data.__dict__
        camada_data['geom_col'] = detalhes_camada['geom_col']
        camada_data = CamadaParamInternal(**camada_data)

    def query_camadas(self, endereco_feature:dict, convert_to_wgs_84:bool, **camadas)->dict:
        '''endereco_feature must be a point geojson'''

        camadas_geosampa = dict()
        if camadas:
            for camada_alias, camada_data in camadas.items():

                self.set_geom_col(camada_data)
                geojson_data = self.query_camada(endereco_feature, camada_data, convert_to_wgs_84)
                camadas_geosampa[camada_alias] = geojson_data
                
            return camadas_geosampa
        return {}
    
    def __call__(self, endereco_feature:dict, convert_to_wgs_84:bool, **camadas)->dict:

        return self.query_camadas(endereco_feature, convert_to_wgs_84, **camadas)