from .geosampa import geosampa_point_query
from core.utils.geo import within_sao_paulo_bbox
from .parsers.point_to_geojson import point_to_geojson

from core.exceptions import OutofBounds

class LatLongSearch:

    def __init__(self)->None:

        self.geosampa = geosampa_point_query
        self.point_to_geojson = point_to_geojson
    
    
    def format_data(self, x:float, y:float, camadas)->dict:


        point = point_to_geojson(x, y)

        data = {
            'point' : point,
            'camadas_geosampa' : camadas
        }
        
        return data
    

    def __call__(self, x:float, y:float, convert_to_wgs_84:bool=True, **camadas)->None:
        
        if not within_sao_paulo_bbox(x, y):
            raise OutofBounds('Must be within Sao Paulo bbox')
        camadas = self.geosampa(x, y, convert_to_wgs_84, **camadas)
        data = self.format_data(x, y, camadas)

        return data