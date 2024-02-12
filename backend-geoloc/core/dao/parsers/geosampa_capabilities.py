from typing import List


class ParseCamadas:

    def get_camadas(self, xml_resp:dict)->List[dict]:
        '''Xml resp must be the original wfs xml resp parsed to dict'''

        return xml_resp['WFS_Capabilities']['FeatureTypeList']['FeatureType']
    
    def parse_camada(self, feature_dict:dict)->dict:

        parsed = {
            'layer_name' : feature_dict['Name'],
            'title' : feature_dict['Title'],
            'abstract' : feature_dict['Abstract'],
            'crs' : feature_dict['SRS']
        }

        return parsed
    
    def parse_all_camadas(self, feature_list:list)->List[dict]:

        return [self.parse_camada(feat) for feat in feature_list]
    
    def __call__(self, xml_resp:dict)->List[dict]:

        features = self.get_camadas(xml_resp)

        return self.parse_all_camadas(features)

class ParseCamadaDetail:


    def extract_feature_data(self, original_resp:dict)->List[dict]:

        try:
            #todas as camadas soh tem uma featuretype
            feats = original_resp['featureTypes']
            return feats[0]['properties']
        except KeyError:
            raise RuntimeError(f'Camada com erro nas propriedades: {original_resp}')

    def prop_is_geom(self, property_data:dict)->bool:

        return property_data['type'].startswith('gml')
    
    def parse_property(self, property_data:dict)->dict:

        parsed = {'name' : property_data['name'],
                  'nillable' : property_data['nillable'],
                  'type' : property_data['localType'],
                  'is_geom' : self.prop_is_geom(property_data),
                  }
        
        return parsed
    
    def parse_camada(self, original_resp:dict)->dict:

        props = self.extract_feature_data(original_resp)
        
        return [self.parse_property(prop) for prop in props]

    def __call__(self, original_resp:dict)->List[dict]:

        return self.parse_camada(original_resp)
    
