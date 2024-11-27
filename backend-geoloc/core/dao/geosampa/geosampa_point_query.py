from core.integrations import geosampa
from core.utils.geo import point_from_wgs_to_sirgas
from ..parsers.geosampa_geojson import GeosampaGeoJsonParser
from ..camadas_search import DetailCamada
from ..parsers.convert_to_wgs_84 import WGS84_conversor

from core.schemas.camadas import CamadaParamInternal


class GeoSampaPointQuery:

    def __init__(self):

        self.geosampa = geosampa
        self.convert_wgs_84 = WGS84_conversor()
        self.parse_geojson = GeosampaGeoJsonParser()
        self.detalhar_camada = DetailCamada()

    def geosampa_layer_query(self, x:float, y:float, layer_name:str, geom_col:str, precision:float=None)->dict:

        x, y = point_from_wgs_to_sirgas(x, y)

        return self.geosampa.point_within_dist(layer_name, x, y, geom_col, precision)

    def query_camada(self, x:float, y:float, camada_data:dict, convert_to_wgs_84:bool)->dict:

        layer_data = self.geosampa_layer_query(x, y, camada_data.layer_name, camada_data.geom_col, camada_data.distance)
        geojson_data = self.parse_geojson(layer_data)
        if convert_to_wgs_84 and geojson_data['features']:
            geojson_data = self.convert_wgs_84(geojson_data, retrieve_geometry_name=True)

        return geojson_data
    
    def set_geom_col(self, camada_data)->None:

        detalhes_camada = self.detalhar_camada(camada_data.layer_name)
        camada_data = camada_data.__dict__
        camada_data['geom_col'] = detalhes_camada['geom_col']
        camada_data = CamadaParamInternal(**camada_data)

    def query_camadas(self, x: float, y:float, convert_to_wgs_84:bool, **camadas)->dict:
        '''endereco_feature must be a point geojson'''

        camadas_geosampa = dict()
        if camadas:
            for camada_alias, camada_data in camadas.items():

                self.set_geom_col(camada_data)
                geojson_data = self.query_camada(x, y, camada_data, convert_to_wgs_84)
                camadas_geosampa[camada_alias] = geojson_data
                
            return camadas_geosampa
        return {}
    
    def __call__(self, x:float, y:float, convert_to_wgs_84:bool, **camadas)->dict:

        return self.query_camadas(x, y, convert_to_wgs_84, **camadas)