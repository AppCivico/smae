from pyproj import CRS, Transformer
from typing import Tuple
import geopandas as gpd
from shapely.geometry import shape
from typing import List
import json

wgs_84_crs = CRS("WGS84")
sirgas_2000_crs = CRS('epsg:31983')

transf_wgs_to_sirgas=  Transformer.from_crs(wgs_84_crs, sirgas_2000_crs)
transf_sirgas_to_wgs=  Transformer.from_crs(wgs_84_crs, sirgas_2000_crs)


def point_from_wgs_to_sirgas(x:float, y:float)->Tuple[float, float]:

    x, y = transf_wgs_to_sirgas.transform(x, y)

    return x, y


def point_from_sirgas_to_wgs(x:float, y:float)->Tuple[float, float]:

    x, y = transf_sirgas_to_wgs.transform(x, y)

    return x, y


def geojson_dict_to_geodf(geojson:dict, crs_data=True)->gpd.GeoDataFrame:

    geometries = [shape(feature['geometry']) for feature in geojson['features']]
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

        #nunca entendi o por que, mas precisa inverter
        return y, x

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


def geopandas_to_wgs_84(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    wgs_84_crs = CRS("EPSG:4326")
    gdf['geometry'] = gdf['geometry'].to_crs(wgs_84_crs)
    return gdf


def geopandas_to_geojson_dict(gdf: gpd.GeoDataFrame, epsg_num: int = None) -> dict:
    if epsg_num:
        wgs_84_crs = CRS("EPSG:4326")
        gdf = gdf.to_crs(wgs_84_crs)

    geojson_dict = json.loads(gdf.to_json())
    if epsg_num:
        geojson_dict['crs'] = geojson_crs_param(epsg_num)

    return geojson_dict