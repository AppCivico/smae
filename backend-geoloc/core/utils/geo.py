from pyproj import CRS, Transformer
from typing import Tuple
import geopandas as gpd
from shapely.geometry import shape
from typing import List
import json
from shapely.ops import orient

from config import SAO_PAULO_WGS_BOUNDING_BOX

wgs_84_crs = CRS("WGS84")
sirgas_2000_crs = CRS('epsg:31983')

transf_wgs_to_sirgas=  Transformer.from_crs(wgs_84_crs, sirgas_2000_crs)
transf_sirgas_to_wgs=  Transformer.from_crs(wgs_84_crs, sirgas_2000_crs)


def point_from_wgs_to_sirgas(x:float, y:float)->Tuple[float, float]:

    #o wgs 84 vem no format long lat, tenho que fazer lat lon para o sirgas
    x, y = y, x
    x, y = transf_wgs_to_sirgas.transform(x, y)

    return x, y


def point_from_sirgas_to_wgs(x:float, y:float)->Tuple[float, float]:

    x, y = transf_sirgas_to_wgs.transform(x, y)

    return x, y


def shapely_parse_geometries(geojson_dict:dict, long_lat=False)->list:


    #if long lat, will reorient geometries
    if long_lat:
        geometries = [orient(shape(feature['geometry'])) for feature in geojson_dict['features']]
    else:
        geometries = [shape(feature['geometry']) for feature in geojson_dict['features']]

    return geometries

def geojson_dict_to_geodf(geojson:dict, crs_data=True, long_lat=False)->gpd.GeoDataFrame:

    geometries = shapely_parse_geometries(geojson, long_lat)
    gdf = gpd.GeoDataFrame(geometry=geometries)
    #pressupoe que as properties sao as mesmas
    for key in geojson['features'][0]['properties']:
        gdf[key] = [feature['properties'][key] for feature in geojson['features']]

    if crs_data:
        gdf.crs = geojson['crs']['properties']['name']

    return gdf


def extract_points_from_feature(geojson_feature:dict)->Tuple[float, float]:

        geom = geojson_feature['geometry']
        geom_type = geom['type']
        if geom_type!='Point':
            raise ValueError(f'Geometria deve ser ponto. Geometria: {geom_type}')

        x, y = geom['coordinates']

        return x, y

def convert_points_to_sirgas(geojson_feature:dict)->Tuple[float, float]:

    x, y = extract_points_from_feature(geojson_feature)
    x, y = point_from_wgs_to_sirgas(x, y)

    return x, y


def geojson_crs_param(epsg_num:int)->None:

    crs = {
        "type": "name",
        "properties": {
        "name": f"EPSG:{epsg_num}"
        }
    }

    return crs

def geojson_envelop(feature_list:List[dict], epsg_num:int=None)->dict:

    geojson = {
        'type': 'FeatureCollection',
        'features' : feature_list
    }

    if epsg_num:
        geojson['crs'] = geojson_crs_param(epsg_num)


    return geojson


def geopandas_to_wgs_84(gdf:gpd.GeoDataFrame)->gpd.GeoDataFrame:

    gdf = gdf.to_crs(epsg=4326)

    return gdf


def geopandas_to_geojson_dict(gdf:gpd.GeoDataFrame, epsg_num:int=None)->dict:

    geojson_dict = json.loads(gdf.to_json())
    if epsg_num:
        geojson_dict['crs'] = geojson_crs_param(epsg_num)

    return geojson_dict


def within_sao_paulo_bbox(x: float, y: float)->bool:

    xmax = SAO_PAULO_WGS_BOUNDING_BOX[1][0]
    xmin = SAO_PAULO_WGS_BOUNDING_BOX[0][0]

    ymax = SAO_PAULO_WGS_BOUNDING_BOX[1][1]
    ymin = SAO_PAULO_WGS_BOUNDING_BOX[0][1]

    return (x>=xmin and x<=xmax)and(y>=ymin and y<=ymax)


def build_bbox_viewport(viewport:dict)->dict:

    lat_min = viewport['btmRightPoint']['lat']
    lat_max = viewport['topLeftPoint']['lat']

    long_min =  viewport['topLeftPoint']['lon']
    long_max = viewport['btmRightPoint']['lon']

    return [long_min, lat_min, long_max, lat_max]

def build_geom_from_points(position:dict)->dict:

    lat = position['lat']
    lon = position['lon']

    geom = {
        "type": "Point",
        "coordinates": [
          lon,
          lat
        ]
      }
    
    return geom