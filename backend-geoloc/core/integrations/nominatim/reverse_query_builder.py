
BUILDING_LEVEL_ZOOM=18
#for other zooms, see https://nominatim.org/release-docs/develop/api/Reverse/

class ReverseQueryBuilder:

    def __init__(self, contact_email:str)->None:
        '''Address level reverse geocoder.'''
        
        self.email = contact_email
        
    def set_language(self, query:dict)->None:

        query['accept-language'] = 'en'

    def set_format(self, query:dict)->None:

        query['format'] = 'json'

    def set_lat(self, query:dict, lat:float)->None:

        query['lat']=lat

    def set_lon(self, query:dict, lon:float)->None:

        query['lon']=lon

    def set_zoom(self, query:dict)->None:

        query['zoom']=BUILDING_LEVEL_ZOOM

    def set_layer(self, query:dict)->None:

        query['layer']='address'

    def set_email(self, query:dict)->None:

        query['email'] = self.email

    def set_address_details(self, query:dict)->None:

        query['addressdetails']=1

    def set_general_config_params(self, query:dict)->None:

        self.set_email(query)
        self.set_language(query)
        self.set_format(query)

    def set_geocoding_params(self, query:dict)->None:

        self.set_zoom(query)
        self.set_layer(query)
        self.set_address_details(query)


    def build_query_str(self, query:dict)->str:

        search_pairs = [f'{key}={val}' for key, val in query.items()]

        return '&'.join(search_pairs)

    def build_full_query(self, x:float, y:float)->dict:

        query = dict()
        self.set_general_config_params(query)
        self.set_geocoding_params(query)

        self.set_lat(query, y)
        self.set_lon(query, x)

        return self.build_query_str(query)
    
    def __call__(self, x:float, y:float)->str:
        '''x = longitude, y = latitude'''

        return self.build_full_query(x, y) 
