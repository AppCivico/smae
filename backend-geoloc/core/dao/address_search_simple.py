from core.integrations import nominatim_address_search
from .parsers.nominatim import AddressParser
from typing import List

from core.utils.geo import geojson_envelop

class AddresSearchSimple:

    def __init__(self):

        self.nominatim = nominatim_address_search
        self.nominatim_parser = AddressParser()

    def nominatim_address_search(self, address:str)->List[dict]:

        resp = self.nominatim(address)
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

    def address_feature_to_geojson(self, address_feat:dict, crs:dict)->dict:
        '''takes and anddress features and format it to a whole geojson'''
        
        #crs must be of t he whole geojson not of just one feature
        crs_num = int(crs['properties']['name'].split(':')[-1])
        
        return geojson_envelop([address_feat], crs_num)
    
    
    def __call__(self, address:str)->List[dict]:


        geoloc_resp = self.nominatim_address_search(address)
        self.filter_address_sp(geoloc_resp)

        return geoloc_resp
            


    
    
    



