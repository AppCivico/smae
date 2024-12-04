from .geocoder import get_geocoder
from typing import List
from config import MAX_ADDRESSES
from core.utils.geo import geojson_envelop

class AddresSearchSimple:

    def __init__(self):

       self.geocoder = get_geocoder()

    
    def is_sp(self, address:dict)->bool:

        test_city = address['properties']['cidade']=='São Paulo'
        test_state = address['properties']['estado']=='São Paulo'
        test_country = address['properties']['codigo_pais'].lower()=='br'

        return test_city * test_state & test_country

    def filter_address_sp(self, address_geojson:list)->List:

        in_city = [add for add in address_geojson['features']
                if self.is_sp(add)]
        address_geojson['features'] = in_city

    def limit_response(self, address_geojson)->List[dict]:

        address_geojson['features'] = address_geojson['features'][:MAX_ADDRESSES]   
    
    def __call__(self, address:str)->List[dict]:

   
        geocode_resp = self.geocoder.geocode(address)
        self.filter_address_sp(geocode_resp)
        self.limit_response(geocode_resp)

        return geocode_resp
            


    
    
    



