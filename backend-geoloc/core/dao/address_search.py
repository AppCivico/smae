from .geocoder import get_geocoder
from .geosampa import geosampa_address_query
from core.utils.geo import geojson_envelop
from config import MAX_ADDRESSES
from typing import List

class AddresSearch:

    def __init__(self):

        self.geosampa_query = geosampa_address_query
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

    def address_feature_to_geojson(self, address_feat:dict, crs:dict)->dict:
        '''takes and anddress features and format it to a whole geojson'''
        
        #crs must be of t he whole geojson not of just one feature
        crs_num = int(crs['properties']['name'].split(':')[-1])
        
        return geojson_envelop([address_feat], crs_num)
    
    def format_address_data(self, address:dict, nominatim_crs:str, convert_to_wgs_84:bool, **camadas)->dict:

        address_data = {
                'endereco' : self.address_feature_to_geojson(address, nominatim_crs),
            }

        camadas_data = self.geosampa_query(address, convert_to_wgs_84, **camadas)
        address_data['camadas_geosampa'] = camadas_data

        return address_data
    
    def geocode(self, address:str)->List[dict]:

        geocode_resp = self.geocoder.geocode(address)
        self.filter_address_sp(geocode_resp)

        return geocode_resp
    
    def __call__(self, address:str, convert_to_wgs_84:bool=True, **camadas)->List[dict]:

        geocode_resp = self.geocode(address)
        resp_crs = geocode_resp['crs']
        data = []
        #arrumar o endereco para ficar geojson
        for i, add in enumerate(geocode_resp['features']):
            if i >= MAX_ADDRESSES:
                break
            data.append(self.format_address_data(add, resp_crs, convert_to_wgs_84, **camadas))

        return data
            


    
    
    



