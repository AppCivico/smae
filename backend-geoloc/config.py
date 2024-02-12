from dotenv import load_dotenv
import os

def load_env(var_name:str)->str:

    load_dotenv()
    try:
        return os.environ[var_name]
    except KeyError:
        raise RuntimeError(f'Variável de ambiente {var_name} não definida!')

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