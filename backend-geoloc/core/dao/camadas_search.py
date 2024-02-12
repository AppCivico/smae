from typing import List
from core.integrations import geosampa
from core.dao.parsers.geosampa_capabilities import ParseCamadas, ParseCamadaDetail

class ListCamadas:

    def __init__(self):

        self.geosampa = geosampa
        self.parser = ParseCamadas()

    def get_camadas(self)->List[dict]:

        capabilities = self.geosampa.list_capabilities()
        camadas = self.parser(capabilities)

        return camadas
    
    def __call__(self):

        camadas = self.get_camadas()

        return camadas
    

class DetailCamada:

    def __init__(self):

        self.geosampa = geosampa
        self.parser = ParseCamadaDetail()
    
    def get_properties(self, layer_name:str)->None:

        properties_data = self.geosampa.describe_feature(layer_name)
        
        return self.parser(properties_data)
    
    def find_geom_col(self, properties:List[dict], layer_name:str)->str:

        for prop in properties:
            if prop['is_geom']:
                name = prop['name']
                type_ = prop['type']
                return name, type_
        else:
            raise RuntimeError(f'Geom column not found on camada {layer_name}')
    
    def camada_search(self, layer_name:str)->None:

        properties_detail = self.get_properties(layer_name)
        geom_col, geom_type = self.find_geom_col(properties_detail, layer_name)
        
        parsed = {
            'layer_name' : layer_name,
            'properties' : properties_detail,
            'geom_col' : geom_col,
            'geom_type' : geom_type
        }

        return parsed
    
    def __call__(self, layer_name:str)->dict:

        return self.camada_search(layer_name)