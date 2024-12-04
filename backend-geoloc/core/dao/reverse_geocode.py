from .geocoder import get_geocoder

from core.exceptions import OutofBounds
from core.utils.geo import within_sao_paulo_bbox

from typing import List

class ReverseGeocode:

    def __init__(self):

        self.geocoder = get_geocoder()

    def check_bbox(self, x:float, y:float)->None:

        if not within_sao_paulo_bbox(x, y):
            raise OutofBounds(f'Coordenados ({x}, {y}) fora dos limites de São Paulo')
    
    def is_sp(self, address:dict)->bool:

        test_city = address['properties']['cidade']=='São Paulo'
        test_state = address['properties']['estado']=='São Paulo'
        test_country = address['properties']['codigo_pais'].lower()=='br'

        return test_city * test_state & test_country
    
    def filter_address_sp(self, address_geojson:list)->List:

        in_city = [add for add in address_geojson['features']
                if self.is_sp(add)]
        address_geojson['features'] = in_city

    def pipeline(self, x:float, y:float)->dict:

        self.check_bbox(x, y)
        address = self.geocoder.reverse_geocode(x, y)
        self.filter_address_sp(address)

        return address
    
    
    def __call__(self, x:float, y:float)->dict:


        a = self.pipeline(x, y)
        print(a)

        return a