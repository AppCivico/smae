from .azure_maps import AzureMapsAdress
from .azure_maps_cep import AzureMapsCep
from .azure_maps_reverse_geocode import AzureMapsReverse
from config import CITY, STATE, COUNTRY_ISO, AZURE_KEY


azure_maps_address_search = AzureMapsAdress(CITY, STATE, COUNTRY_ISO, AZURE_KEY)
azure_maps_cep_search = AzureMapsCep(CITY, STATE, COUNTRY_ISO, AZURE_KEY)
azure_maps_reverse_search = AzureMapsReverse(AZURE_KEY)