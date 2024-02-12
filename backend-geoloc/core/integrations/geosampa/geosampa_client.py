from requests import Session, Response

from .query_builder import WithinQueryBuilder
from .capabilities import CapabilitiesRequest, DescribeFeature
from core.decorators.response_parsing import json_decode_error_handling, xml_to_json_decode_error_handling

class GeoSampa:

    def __init__(self, host:str, version:str, default_precision:int)->None:

        self.host = host
        self.version = version
        self.base_url = self.build_base_url()

        self.session = Session()
        self.within_query = WithinQueryBuilder(self.version)
        self.list_capabilities_query = CapabilitiesRequest()
        self.describe_feature_query = DescribeFeature()

        self.precision = default_precision


    @json_decode_error_handling
    def wfs_geojson_request(self, request_url:str)->dict:

        print(f'Requesting geosampa: {request_url}')

        with self.session.get(request_url) as r:
            return r

    @xml_to_json_decode_error_handling
    def wfs_xml_request(self, request_url:str)->dict:

        print(f'Requesting geosampa: {request_url}')

        with self.session.get(request_url) as r:
            return r

    def build_base_url(self)->str:
        
        base_params = f'?service=WFS&version={self.version}'

        return self.host + '/' + base_params
    
    def build_query_str(self, query:dict)->str:

        params = [f'{key}={val}' for key, val in query.items()]
        param_str = '&'.join(params)

        return param_str
    
    def build_query_url(self, query_params:dict)->str:

        query_str = self.build_query_str(query_params)

        url = self.base_url + '&' + query_str

        return url
        
    def point_within_pol(self, camada:str, x:float, y:float, precision:float=None, geom_type='poligono')->dict:

        if precision is None:
            precision = self.precision

        query_args = self.within_query(camada, x, y, precision, geom_type)
        url = self.build_query_url(query_args)

        return self.wfs_geojson_request(url)
    

    def list_capabilities(self)->dict:

        query_args = self.list_capabilities_query()
        url = self.build_query_url(query_args)

        return self.wfs_xml_request(url)
    
    def describe_feature(self, feature_name:str)->dict:

        query_args = self.describe_feature_query(feature_name)
        url = self.build_query_url(query_args)

        return self.wfs_geojson_request(url)
