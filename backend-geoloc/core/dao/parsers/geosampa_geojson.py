from typing import List


class GeosampaGeoJsonParser:

    def remove_crs_junk(self, crs_value:str)->str:

        crs_value = crs_value.replace('urn:ogc:def:crs:', '')
        crs_value = crs_value.replace('::', ':')

        return crs_value
    
    def padronizar_crs(self, geojson:dict)->None:

        valor_atual = geojson['crs']['properties']['name']
        geojson['crs']['properties']['name'] = self.remove_crs_junk(valor_atual)
    
    def remove_unneeded_keys(self, geojson:dict)->dict:

        parsed = {
            'type' : geojson['type'],
            'features' : geojson['features'],
            'crs' : geojson['crs']
        }

        return parsed
    
    def padronizar_feature(self, feature:dict)->dict:

        parsed = {
            'type' : feature['type'],
            'properties' : feature['properties'],
            'geometry' : feature['geometry'],
            'geometry_name' : feature['geometry_name'],
        }

        return parsed

    def padronizar_all_features(self, feature_list:List[dict])->List[dict]:

        return [self.padronizar_feature(feat) for feat in feature_list]
    
    def padronizar_geojson(self, geojson:dict)->dict:

        geojson = self.remove_unneeded_keys(geojson)
        self.padronizar_crs(geojson)
        geojson['features'] = self.padronizar_all_features(geojson['features'])

        return geojson


    def __call__(self, geojson:dict)->dict:

        return self.padronizar_geojson(geojson)

    
    
