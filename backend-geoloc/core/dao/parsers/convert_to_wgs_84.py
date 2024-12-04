from core.utils.geo import geojson_dict_to_geodf, geopandas_to_wgs_84, geopandas_to_geojson_dict

class WGS84_conversor:

    def retrieve_geometry_name(self, new_geojson:dict, old_geojson:dict)->dict:

        for i, old_feature in enumerate(old_geojson['features']):

            new_geojson['features'][i]['geometry_name'] = old_feature['geometry_name']

    def __call__(self, geojson:dict, retrieve_geometry_name:bool=False)->dict:

        gdf = geojson_dict_to_geodf(geojson, long_lat=True)
        gdf_converted = geopandas_to_wgs_84(gdf)
        new_geojson = geopandas_to_geojson_dict(gdf_converted, epsg_num=4326)

        if retrieve_geometry_name:
            self.retrieve_geometry_name(new_geojson, geojson)

        return new_geojson