from core.utils.geo import geojson_envelop

from config import SAO_PAULO_WGS_BOUNDING_BOX, WGS84_EPSG


def point_to_geojson(x:float, y:float)->dict:         
         
        feature = {
                    "type": "Feature",
                    "properties": {
                    },
                    "geometry" : {
                    "type": "Point",
                    "coordinates": [x, y]
                    }
                    }
        
        feature['bbox']=[
                        SAO_PAULO_WGS_BOUNDING_BOX[0][0],
                        SAO_PAULO_WGS_BOUNDING_BOX[0][1],
                        SAO_PAULO_WGS_BOUNDING_BOX[1][0],
                        SAO_PAULO_WGS_BOUNDING_BOX[1][1]
                    ]
        
        geojson = geojson_envelop([feature], WGS84_EPSG)
        
        
        return geojson