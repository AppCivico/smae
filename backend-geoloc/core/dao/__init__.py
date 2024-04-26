from .camadas_search import ListCamadas, DetailCamada
from .address_search import AddresSearch
from .address_search_simple import AddresSearchSimple
from .check_name_camada import CheckCamadaName
from .lat_long_search import LatLongSearch
from .reverse_geocode import ReverseGeocode
from .cep_search import CepSearch

listar_camadas = ListCamadas()
detalhar_camada = DetailCamada()
buscar_endereco = AddresSearch()
buscar_endereco_simples = AddresSearchSimple()
buscar_cep = CepSearch()
nomes_camadas = CheckCamadaName()
lat_long_geosampa = LatLongSearch()
gelocalizacao_reversa = ReverseGeocode()
