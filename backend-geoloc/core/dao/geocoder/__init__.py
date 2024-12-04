from .geocoder_factory import GeocodeFactory
from config import USE_AZURE

get_geocoder = GeocodeFactory(USE_AZURE)