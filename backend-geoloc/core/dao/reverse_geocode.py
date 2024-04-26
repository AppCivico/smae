from core.integrations import nominatim_reverse_search
from .parsers.nominatim import AddressParser

from core.exceptions import OutofBounds
from core.utils.geo import within_sao_paulo_bbox

from typing import List

class ReverseGeocode:

    def __init__(self):

        self.nominatim = nominatim_reverse_search
        self.nominatim_parser = AddressParser(feature_list=False, extract_geom=False)

    def check_bbox(self, x:float, y:float)->None:

        if not within_sao_paulo_bbox(x, y):
            raise OutofBounds(f'Coordenados ({x}, {y}) fora dos limites de São Paulo')

    def nominatim_reverse_search(self, x:float, y:float)->List[dict]:

        resp = self.nominatim(x, y)
        geojson_data = self.nominatim_parser(resp)

        return geojson_data
    
    def is_sp(self, address:dict)->bool:

        test_city = address['properties']['cidade']=='São Paulo'
        test_state = address['properties']['estado']=='São Paulo'
        test_country = address['properties']['codigo_pais']=='br'

        return test_city * test_state & test_country
    
    def filter_address_sp(self, address_geojson:list)->List:

        in_city = [add for add in address_geojson['features']
                if self.is_sp(add)]
        address_geojson['features'] = in_city

    def get_geometry(self, x:float, y:float)->dict:

        return {'type' : 'Point', 'coordinates' : [x, y]}
    
    def set_geometry(self, address:dict, x:float, y:float)->None:

        for add in address['features']:
            add['geometry'] = self.get_geometry(x, y)

    def pipeline(self, x:float, y:float)->dict:

        self.check_bbox(x, y)
        address = self.nominatim_reverse_search(x, y)
        self.filter_address_sp(address)
        self.set_geometry(address, x, y)


        return address
    
    
    def __call__(self, x:float, y:float)->dict:


        a = self.pipeline(x, y)
        print(a)

        return a