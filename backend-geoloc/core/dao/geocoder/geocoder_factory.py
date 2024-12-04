from core.integrations import azure_maps_address_search, azure_maps_reverse_search, azure_maps_cep_search
from core.integrations import nominatim_address_search, nominatim_reverse_search, nomimatim_cep_search

from core.dao.parsers.nominatim import AddressParser as NominatimAddressParser
from core.dao.parsers.azure import AddressParser as AzureAddressParser


class GeocodeObj:

    def __init__(self, address_geocode, cep_geocode, address_parser, reverse_search)->None:

        self.__address_geocode = address_geocode
        self.__cep_geocode = cep_geocode
        self.__parse_address = address_parser
        self.__reverse_geoloc = reverse_search

    def geocode(self, address:str)->dict:

        resp  = self.__address_geocode(address)
        parsed = self.__parse_address(resp)

        return parsed
    
    def geocode_cep(self, cep:str)->dict:

        resp = self.__cep_geocode(cep)
        parsed = self.__parse_address(resp)

        return parsed
    
    def reverse_geocode(self, x:float, y:float)->None:
        
        resp = self.__reverse_geoloc(x, y)
        parsed = self.__parse_address(resp)

        return parsed



class GeocodeFactory:

    def __init__(self, use_azure:bool)->None:

        self.use_azure = use_azure

        if self.use_azure:
            print('Using Azure API')
            self.address_geocode = azure_maps_address_search
            self.address_parser = AzureAddressParser()
            self.cep_geocode = azure_maps_cep_search
            self.reverse_search = azure_maps_reverse_search

        else:
            print('Using Nominatim API')
            self.address_geocode = nominatim_address_search
            self.address_parser = NominatimAddressParser()
            self.cep_geocode = nomimatim_cep_search
            self.reverse_search = nominatim_reverse_search

    def __call__(self)->GeocodeObj:

        geocode_obj = GeocodeObj(self.address_geocode,
                               self.cep_geocode,
                               self.address_parser,
                               self.reverse_search)

        return geocode_obj

    
    