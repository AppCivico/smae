from dotenv import load_dotenv
import os

def load_env(var_name:str)->str:

    load_dotenv()
    try:
        return os.environ[var_name]
    except KeyError:
        raise RuntimeError(f'Variável de ambiente {var_name} não definida!')
    
def str_to_bool(var_name:str)->bool:

    var_value = load_env(var_name)

    if var_value.lower() == 'false':
        return False
    if var_value.lower() == 'true':
        return True
    
    raise RuntimeError(f'Variável de ambiente {var_name} é booleana. Definir como (true, false). Definida como: {var_value}')

CITY=load_env('CITY')
STATE=load_env('STATE')
COUNTRY_ISO=load_env('COUNTRY_ISO')

NOMINATIM_EMAIL=load_env('NOMINATIM_EMAIL')

GEOSAMPA_WFS_DOMAIN=load_env('GEOSAMPA_WFS_DOMAIN')
GEOSAMPA_API_VERSION=load_env('GEOSAMPA_API_VERSION')
DISTANCIA_PADRAO_MTS_GEOSAMPA=load_env('DISTANCIA_PADRAO_MTS_GEOSAMPA')


GEOM_TYPES = (
    'Geometry',
    'LineString',
    'MultiLineString',
    'MultiPolygon',
    'Point',
    'Polygon'
)

NAMES_CAMADAS_TTL_SECONDS=load_env('NAMES_CAMADAS_TTL_SECONDS')


#esta no formato long lat
SAO_PAULO_WGS_BOUNDING_BOX = ((-46.809319, -23.784969), (-46.36499, -23.39566))
WGS84_EPSG=4326

AZURE_KEY = load_env('AZURE_KEY')
USE_AZURE = str_to_bool('USE_AZURE')